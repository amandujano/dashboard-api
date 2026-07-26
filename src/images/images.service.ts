/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { put, del } from '@vercel/blob';
import sharp from 'sharp';
import { SupabaseService } from '../supabase/supabase.service';
import { ImageEntitySchema } from './entity/image';

const VARIANTS = [
  { name: 'thumb', width: 400 },
  { name: 'medium', width: 800 },
  { name: 'full', width: 1600 },
] as const;

@Injectable()
export class ImagesService {
  constructor(private supabaseService: SupabaseService) {}

  async upload(file: Express.Multer.File, alt: string) {
    const metadata = await sharp(file.buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('El archivo no es una imagen válida');
    }

    const baseName = file.originalname.replace(/\.[^.]+$/, '');

    const uploads = await Promise.all(
      VARIANTS.map(async (variant) => {
        const buffer = await sharp(file.buffer)
          .resize({ width: variant.width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        const blob = await put(
          `images/${baseName}-${variant.name}.webp`,
          buffer,
          {
            access: 'public',
            addRandomSuffix: true,
            contentType: 'image/webp',
          },
        );

        return [variant.name, blob.url] as const;
      }),
    );

    const urls = Object.fromEntries(uploads);

    const { data, error } = await this.supabaseService
      .getClient()
      .from('images')
      .insert([
        {
          filename: file.originalname,
          alt,
          url_thumb: urls.thumb,
          url_medium: urls.medium,
          url_full: urls.full,
          width: metadata.width,
          height: metadata.height,
          size_bytes: file.size,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        error?.message ?? 'Error guardando la imagen',
      );
    }

    return ImageEntitySchema.parse(data);
  }

  async findAll(collectionSlug?: string) {
    const client = this.supabaseService.getClient();

    // Si hay filtro, primero resolvemos el slug → id de la colección
    let collectionId: string | undefined;
    if (collectionSlug) {
      const { data: collection } = await client
        .from('collections')
        .select('id')
        .eq('slug', collectionSlug)
        .single();

      if (!collection) {
        return []; // colección inexistente → sin resultados
      }
      collectionId = collection.id;
    }

    const embed = collectionId
      ? 'image_collections!inner(collection_id)'
      : 'image_collections(collection_id)';

    let query = client
      .from('images')
      .select(`*, ${embed}`)
      .order('created_at', { ascending: false });

    if (collectionId) {
      query = query.eq('image_collections.collection_id', collectionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.map((row) => {
      const { image_collections, ...image } = row;
      return {
        ...ImageEntitySchema.parse(image),
        collectionIds: (image_collections ?? []).map(
          (rel: { collection_id: string }) => rel.collection_id,
        ),
      };
    });
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('images')
      .select('url_thumb, url_medium, url_full')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await del([data.url_thumb, data.url_medium, data.url_full]);

    await this.supabaseService.getClient().from('images').delete().eq('id', id);

    return { ok: true };
  }

  async addToCollection(imageId: string, collectionId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('image_collections')
      .insert([{ image_id: imageId, collection_id: collectionId }]);

    if (error) {
      // 23505 = unique_violation: la imagen ya estaba en esa colección
      if (error.code === '23505') {
        return { ok: true }; // idempotente: ya está, no es un error real
      }
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }

  async removeFromCollection(imageId: string, collectionId: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('image_collections')
      .delete()
      .eq('image_id', imageId)
      .eq('collection_id', collectionId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }
}
