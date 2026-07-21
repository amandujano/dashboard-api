/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BlogPostEntitySchema,
  BlogPostSummarySchema,
} from './entity/blog-post';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post';

@Injectable()
export class BlogPostsService {
  constructor(private supabaseService: SupabaseService) {}

  async getAllPosts() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .select('id, slug, title, author, is_published, published_at')
      .order('published_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data.map((post) => BlogPostSummarySchema.parse(post));
  }

  async getPostBySlug(slug: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      throw new NotFoundException('Post not found');
    }

    return BlogPostEntitySchema.parse(data);
  }

  async getAllPostsAdmin() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .select('id, slug, title, author, is_published, published_at')
      .order('published_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data.map((post) => BlogPostSummarySchema.parse(post));
  }

  async createPost(input: CreateBlogPostDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .insert([input])
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(error?.message ?? 'Error creating post');
    }

    return BlogPostEntitySchema.parse(data);
  }

  async updatePost(slug: string, input: UpdateBlogPostDto) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .update(input)
      .eq('slug', slug)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Post not found');
    }

    return BlogPostEntitySchema.parse(data);
  }

  async deletePost(slug: string) {
    const { error } = await this.supabaseService
      .getClient()
      .from('blog_posts')
      .delete()
      .eq('slug', slug);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return { ok: true };
  }
}
