import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url: string = this.configService.get<string>('SUPABASE_URL')!;
    const role_key: string = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    )!;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.client = createClient(url, role_key);
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
