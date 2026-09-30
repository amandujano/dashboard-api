import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { profile } from '../database/schema';

@Injectable()
export class ProfileService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getProfile() {
    const [row] = await this.db
      .select({ name: profile.name, bio: profile.bio })
      .from(profile)
      .limit(1);

    if (!row) {
      throw new NotFoundException('Profile not found');
    }

    return row;
  }
}
