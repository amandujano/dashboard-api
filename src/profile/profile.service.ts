import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfileService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('profile')
      .select('name, bio')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
