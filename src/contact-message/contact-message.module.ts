import { Module } from '@nestjs/common';
import { ContactMessageController } from './contact-message.controller';
import { ContactMessageService } from './contact-message.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [ContactMessageController],
  providers: [ContactMessageService],
})
export class ContactMessageModule {}
