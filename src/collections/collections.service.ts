/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionEntitySchema } from './entity/collection';

@Injectable()
export class CollectionsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(input: CreateCollectionDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('collections')
      .insert([input])
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(
        error?.message ?? 'Error creando la colección',
      );
    }

    return CollectionEntitySchema.parse(data);
  }

  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('collections')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data.map((row) => CollectionEntitySchema.parse(row));
  }

  async remove(id: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return { ok: true };
  }
}
