/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post';

@Controller('api/blog-posts')
export class BlogPostsController {
  constructor(private blogPostsService: BlogPostsService) {}

  @Get('admin/all')
  async findAllAdmin() {
    return this.blogPostsService.getAllPostsAdmin();
  }

  @Public()
  @Get()
  async findAll() {
    return this.blogPostsService.getAllPosts();
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.blogPostsService.getPostBySlug(slug);
  }

  @Post()
  async create(@Body() dto: CreateBlogPostDto) {
    return this.blogPostsService.createPost(dto);
  }

  @Patch(':slug')
  async update(@Param('slug') slug: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogPostsService.updatePost(slug, dto);
  }

  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    return this.blogPostsService.deletePost(slug);
  }
}
