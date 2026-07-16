import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ContactMessageEntitySchema } from './entity/contact-message';

@Injectable()
export class ContactMessageService {
  constructor(private supabaseService: SupabaseService) {}

  async saveContactMessage(name: string, email: string, message: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { data, error } = await this.supabaseService
      .getClient()
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (error || !data?.id) {
      throw new UnauthorizedException(
        error?.message ?? 'Error saving contact message',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return ContactMessageEntitySchema.parse(data);
  }
}
