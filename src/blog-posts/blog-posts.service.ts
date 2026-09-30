import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.constants';
import { orFail } from '../database/db-error';
import type { Database } from '../database/database.types';
import { blog_posts } from '../database/schema';
import {
  BlogPostEntitySchema,
  BlogPostSummarySchema,
} from './entity/blog-post';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post';

const summaryColumns = {
  id: blog_posts.id,
  slug: blog_posts.slug,
  title: blog_posts.title,
  author: blog_posts.author,
  is_published: blog_posts.is_published,
  published_at: blog_posts.published_at,
};

@Injectable()
export class BlogPostsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async getAllPosts() {
    const rows = await orFail(
      this.db
        .select(summaryColumns)
        .from(blog_posts)
        .orderBy(desc(blog_posts.published_at)),
      (message) => new NotFoundException(message),
    );

    return rows.map((post) => BlogPostSummarySchema.parse(post));
  }

  async getPostBySlug(slug: string) {
    const [post] = await orFail(
      this.db
        .select()
        .from(blog_posts)
        .where(eq(blog_posts.slug, slug))
        .limit(1),
      () => new NotFoundException('Post not found'),
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return BlogPostEntitySchema.parse(post);
  }

  async getAllPostsAdmin() {
    return this.getAllPosts();
  }

  async createPost(input: CreateBlogPostDto) {
    const [post] = await orFail(
      this.db.insert(blog_posts).values(input).returning(),
      (message) => new BadRequestException(message),
    );

    if (!post) {
      throw new BadRequestException('Error creating post');
    }

    return BlogPostEntitySchema.parse(post);
  }

  async updatePost(slug: string, input: UpdateBlogPostDto) {
    // Drizzle rejects an empty SET clause, so fall back to a plain read.
    if (Object.values(input).every((value) => value === undefined)) {
      return this.getPostBySlug(slug);
    }

    const [post] = await orFail(
      this.db
        .update(blog_posts)
        .set(input)
        .where(eq(blog_posts.slug, slug))
        .returning(),
      (message) => new NotFoundException(message),
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return BlogPostEntitySchema.parse(post);
  }

  async deletePost(slug: string) {
    await orFail(
      this.db.delete(blog_posts).where(eq(blog_posts.slug, slug)),
      (message) => new NotFoundException(message),
    );

    return { ok: true };
  }
}
