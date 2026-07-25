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

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.map((row) => ImageEntitySchema.parse(row));
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
}
