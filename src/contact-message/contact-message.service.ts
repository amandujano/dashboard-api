import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.constants';
import { orFail } from '../database/db-error';
import type { Database } from '../database/database.types';
import { contact_messages } from '../database/schema';
import { ContactMessageEntitySchema } from './entity/contact-message';

@Injectable()
export class ContactMessageService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async saveContactMessage(name: string, email: string, message: string) {
    const now = new Date().toISOString();

    const [row] = await orFail(
      this.db
        .insert(contact_messages)
        .values({ name, email, message, created_at: now, updated_at: now })
        .returning(),
      (errorMessage) => new UnauthorizedException(errorMessage),
    );

    if (!row?.id) {
      throw new UnauthorizedException('Error saving contact message');
    }

    return ContactMessageEntitySchema.parse(row);
  }
}
