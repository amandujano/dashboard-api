import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { Public } from '../auth/public.decorator';

@Controller('api/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Public()
  @Get()
  async findAll() {
    return this.imagesService.findAll();
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Body('alt') alt: string,
  ) {
    return this.imagesService.upload(file, alt ?? '');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
