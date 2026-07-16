import { Body, Controller, Post } from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { Public } from '../auth/public.decorator';

@Controller('api/contact-message')
export class ContactMessageController {
  constructor(private contactMessageService: ContactMessageService) {}

  @Public()
  @Post()
  async create(@Body() dto: CreateContactMessageDto) {
    const { name, email, message } = dto;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.contactMessageService.saveContactMessage(name, email, message);
  }
}
