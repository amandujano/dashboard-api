/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Get, Param } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { BlogPostsService } from './blog-posts.service';

@Controller('api/blog-posts')
export class BlogPostsController {
  constructor(private blogPostsService: BlogPostsService) {}

  @Public()
  @Get()
  async findAll() {
    return await this.blogPostsService.getAllPosts();
  }

  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return await this.blogPostsService.getPostBySlug(slug);
  }
}
