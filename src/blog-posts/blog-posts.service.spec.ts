import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '../database/database.constants';
import { createMockDb, driverError } from '../database/mock-db.testing';
import { BlogPostsService } from './blog-posts.service';

const post = {
  id: 'p1',
  slug: 'hello',
  title: 'Hello',
  content: 'Body',
  author: 'Angel',
  is_published: true,
  published_at: '2024-01-01T00:00:00.000Z',
};

async function build(...results: unknown[]) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      BlogPostsService,
      { provide: DRIZZLE, useValue: createMockDb(...results) },
    ],
  }).compile();
  return module.get(BlogPostsService);
}

describe('BlogPostsService', () => {
  it('lists posts without content', async () => {
    const summary = { ...post, content: undefined };
    delete summary.content;
    const service = await build([summary]);
    await expect(service.getAllPosts()).resolves.toEqual([summary]);
  });

  it('maps a listing failure to NotFoundException', async () => {
    const service = await build(driverError('boom'));
    await expect(service.getAllPosts()).rejects.toThrow(
      new NotFoundException('boom'),
    );
  });

  it('returns a post by slug', async () => {
    const service = await build([post]);
    await expect(service.getPostBySlug('hello')).resolves.toEqual(post);
  });

  it('throws NotFoundException when the slug does not exist', async () => {
    const service = await build([]);
    await expect(service.getPostBySlug('nope')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('maps an insert failure to BadRequestException', async () => {
    const service = await build(driverError('duplicate key', '23505'));
    await expect(
      service.createPost({
        slug: 'hello',
        title: 'Hello',
        content: 'Body',
        author: 'Angel',
        is_published: false,
      }),
    ).rejects.toThrow(new BadRequestException('duplicate key'));
  });

  it('throws NotFoundException when updating a missing post', async () => {
    const service = await build([]);
    await expect(service.updatePost('nope', { title: 'New' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns the current post when the update payload is empty', async () => {
    const service = await build([post]);
    await expect(service.updatePost('hello', {})).resolves.toEqual(post);
  });

  it('deletes a post', async () => {
    const service = await build(undefined);
    await expect(service.deletePost('hello')).resolves.toEqual({ ok: true });
  });
});
