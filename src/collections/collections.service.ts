import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.constants';
import { orFail } from '../database/db-error';
import type { Database } from '../database/database.types';
import { collections } from '../database/schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CollectionEntitySchema } from './entity/collection';

@Injectable()
export class CollectionsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(input: CreateCollectionDto) {
    const [row] = await orFail(
      this.db.insert(collections).values(input).returning(),
      (message) => new BadRequestException(message),
    );

    if (!row) {
      throw new BadRequestException('Error creando la colección');
    }

    return CollectionEntitySchema.parse(row);
  }

  async findAll() {
    const rows = await orFail(
      this.db.select().from(collections).orderBy(asc(collections.name)),
      (message) => new BadRequestException(message),
    );

    return rows.map((row) => CollectionEntitySchema.parse(row));
  }

  async remove(id: string) {
    await orFail(
      this.db.delete(collections).where(eq(collections.id, id)),
      (message) => new NotFoundException(message),
    );

    return { ok: true };
  }
}
