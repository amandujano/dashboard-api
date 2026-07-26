import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { Public } from 'src/auth/public.decorator';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Controller('api/collections')
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Public()
  @Get()
  async findAll() {
    return this.collectionsService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
