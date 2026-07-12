import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private adminClient: SupabaseClient;
  private authClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url: string = this.configService.get<string>('SUPABASE_URL')!;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.adminClient = createClient(
      url,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.authClient = createClient(
      url,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
    );
  }

  getClient(): SupabaseClient {
    return this.adminClient;
  }

  getAuthClient(): SupabaseClient {
    return this.authClient;
  }
}
