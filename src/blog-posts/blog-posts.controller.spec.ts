import { Test, TestingModule } from '@nestjs/testing';
import { BlogPostsController } from './blog-posts.controller';
import { BlogPostsService } from './blog-posts.service';

describe('BlogPostsController', () => {
  let controller: BlogPostsController;
  const service = {
    getAllPostsAdmin: jest.fn(),
    getAllPosts: jest.fn(),
    getPostBySlug: jest.fn(),
    createPost: jest.fn(),
    updatePost: jest.fn(),
    deletePost: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlogPostsController],
      providers: [{ provide: BlogPostsService, useValue: service }],
    }).compile();

    controller = module.get<BlogPostsController>(BlogPostsController);
  });

  it('findAllAdmin delegates to getAllPostsAdmin', async () => {
    service.getAllPostsAdmin.mockResolvedValue(['a']);

    await expect(controller.findAllAdmin()).resolves.toEqual(['a']);
  });

  it('findAll delegates to getAllPosts', async () => {
    service.getAllPosts.mockResolvedValue(['p']);

    await expect(controller.findAll()).resolves.toEqual(['p']);
  });

  it('findOne delegates with the slug', async () => {
    service.getPostBySlug.mockResolvedValue({ slug: 's' });

    await expect(controller.findOne('s')).resolves.toEqual({ slug: 's' });
    expect(service.getPostBySlug).toHaveBeenCalledWith('s');
  });

  it('create delegates with the dto', async () => {
    const dto = { title: 't' } as never;
    service.createPost.mockResolvedValue({ id: 1 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 1 });
    expect(service.createPost).toHaveBeenCalledWith(dto);
  });

  it('update delegates with slug and dto', async () => {
    const dto = { title: 'n' } as never;
    service.updatePost.mockResolvedValue({ id: 1 });

    await expect(controller.update('s', dto)).resolves.toEqual({ id: 1 });
    expect(service.updatePost).toHaveBeenCalledWith('s', dto);
  });

  it('remove delegates with the slug', async () => {
    service.deletePost.mockResolvedValue({ ok: true });

    await expect(controller.remove('s')).resolves.toEqual({ ok: true });
    expect(service.deletePost).toHaveBeenCalledWith('s');
  });
});
