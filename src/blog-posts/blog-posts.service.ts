/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BlogPostEntitySchema,
  BlogPostSummarySchema,
} from './entity/blog-post';

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
}
