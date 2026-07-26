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
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { Public } from '../auth/public.decorator';

@Controller('api/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Public()
  @Get()
  async findAll(@Query('collection') collection?: string) {
    return this.imagesService.findAll(collection);
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

  @Post(':id/collections')
  async addToCollection(
    @Param('id') id: string,
    @Body('collectionId') collectionId: string,
  ) {
    return this.imagesService.addToCollection(id, collectionId);
  }

  @Delete(':id/collections/:collectionId')
  async removeFromCollection(
    @Param('id') id: string,
    @Param('collectionId') collectionId: string,
  ) {
    return this.imagesService.removeFromCollection(id, collectionId);
  }
}
