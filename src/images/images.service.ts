import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, exists, getTableColumns } from 'drizzle-orm';
import sharp from 'sharp';
import { DRIZZLE } from '../database/database.constants';
import { orFail, pgErrorCode, pgErrorMessage } from '../database/db-error';
import type { Database } from '../database/database.types';
import { collections, image_collections, images } from '../database/schema';
import { SupabaseService } from '../supabase/supabase.service';
import { ImageEntitySchema } from './entity/image';
import {
  IMAGES_BUCKET,
  buildObjectKey,
  publicUrlToPath,
} from './storage-paths';

const VARIANTS = [
  { name: 'thumb', width: 400 },
  { name: 'medium', width: 800 },
  { name: 'full', width: 1600 },
] as const;

@Injectable()
export class ImagesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly supabaseService: SupabaseService,
  ) {}

  private get storage() {
    return this.supabaseService.getClient().storage.from(IMAGES_BUCKET);
  }

  async upload(file: Express.Multer.File, alt: string) {
    const metadata = await sharp(file.buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('El archivo no es una imagen válida');
    }

    const uploadedPaths: string[] = [];

    const results = await Promise.allSettled(
      VARIANTS.map(async (variant) => {
        const buffer = await sharp(file.buffer)
          .resize({ width: variant.width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        const path = buildObjectKey(
          file.originalname,
          variant.name,
          randomUUID().slice(0, 8),
        );

        const { error } = await this.storage.upload(path, buffer, {
          contentType: 'image/webp',
          upsert: false,
        });
        if (error) {
          throw new BadRequestException(error.message);
        }
        uploadedPaths.push(path);

        return [
          variant.name,
          this.storage.getPublicUrl(path).data.publicUrl,
        ] as const;
      }),
    );

    const failure = results.find((r) => r.status === 'rejected');
    if (failure) {
      // Avoid orphans: drop whatever variants did make it to the bucket.
      if (uploadedPaths.length > 0) {
        await this.storage.remove(uploadedPaths).catch(() => undefined);
      }
      const reason = failure.reason as unknown;
      throw reason instanceof BadRequestException
        ? reason
        : new BadRequestException(
            reason instanceof Error
              ? reason.message
              : 'Error subiendo la imagen',
          );
    }

    const uploads = results.map(
      (r) => (r as PromiseFulfilledResult<readonly [string, string]>).value,
    );

    const urls = Object.fromEntries(uploads);

    const [row] = await orFail(
      this.db
        .insert(images)
        .values({
          filename: file.originalname,
          alt,
          url_thumb: urls.thumb,
          url_medium: urls.medium,
          url_full: urls.full,
          width: metadata.width,
          height: metadata.height,
          size_bytes: file.size,
        })
        .returning(),
      (message) => new BadRequestException(message),
    );

    if (!row) {
      throw new BadRequestException('Error guardando la imagen');
    }

    return ImageEntitySchema.parse(row);
  }

  async findAll(collectionSlug?: string) {
    // Si hay filtro, primero resolvemos el slug → id de la colección
    let collectionId: string | undefined;
    if (collectionSlug) {
      const [collection] = await this.db
        .select({ id: collections.id })
        .from(collections)
        .where(eq(collections.slug, collectionSlug))
        .limit(1);

      if (!collection) {
        return []; // colección inexistente → sin resultados
      }
      collectionId = collection.id;
    }

    const rows = await orFail(
      this.db
        .select({
          image: getTableColumns(images),
          collectionId: image_collections.collection_id,
        })
        .from(images)
        .leftJoin(image_collections, eq(image_collections.image_id, images.id))
        .where(
          collectionId
            ? exists(
                this.db
                  .select({ one: image_collections.image_id })
                  .from(image_collections)
                  .where(
                    and(
                      eq(image_collections.image_id, images.id),
                      eq(image_collections.collection_id, collectionId),
                    ),
                  ),
              )
            : undefined,
        )
        .orderBy(desc(images.created_at)),
      (message) => new BadRequestException(message),
    );

    // The join yields one row per (image, collection); fold back into one
    // entry per image, keeping the created_at ordering.
    const byImage = new Map<
      string,
      { image: (typeof rows)[number]['image']; collectionIds: string[] }
    >();
    for (const { image, collectionId: relatedId } of rows) {
      const entry = byImage.get(image.id) ?? { image, collectionIds: [] };
      if (relatedId) entry.collectionIds.push(relatedId);
      byImage.set(image.id, entry);
    }

    return [...byImage.values()].map(({ image, collectionIds }) => ({
      ...ImageEntitySchema.parse(image),
      collectionIds,
    }));
  }

  async remove(id: string) {
    const [image] = await orFail(
      this.db
        .select({
          url_thumb: images.url_thumb,
          url_medium: images.url_medium,
          url_full: images.url_full,
        })
        .from(images)
        .where(eq(images.id, id))
        .limit(1),
      () => new NotFoundException('Imagen no encontrada'),
    );

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    // Legacy (non-bucket) URLs are skipped: they resolve to null.
    const paths = [image.url_thumb, image.url_medium, image.url_full]
      .map((url) => (url ? publicUrlToPath(url) : null))
      .filter((path): path is string => path !== null);

    if (paths.length > 0) {
      const { error } = await this.storage.remove(paths);
      if (error) {
        throw new BadRequestException(error.message);
      }
    }

    await orFail(
      this.db.delete(images).where(eq(images.id, id)),
      (message) => new BadRequestException(message),
    );

    return { ok: true };
  }

  async addToCollection(imageId: string, collectionId: string) {
    try {
      await this.db
        .insert(image_collections)
        .values({ image_id: imageId, collection_id: collectionId });
    } catch (error) {
      // 23505 = unique_violation: la imagen ya estaba en esa colección
      if (pgErrorCode(error) === '23505') {
        return { ok: true }; // idempotente: ya está, no es un error real
      }
      throw new BadRequestException(pgErrorMessage(error));
    }

    return { ok: true };
  }

  async removeFromCollection(imageId: string, collectionId: string) {
    await orFail(
      this.db
        .delete(image_collections)
        .where(
          and(
            eq(image_collections.image_id, imageId),
            eq(image_collections.collection_id, collectionId),
          ),
        ),
      (message) => new BadRequestException(message),
    );

    return { ok: true };
  }
}
