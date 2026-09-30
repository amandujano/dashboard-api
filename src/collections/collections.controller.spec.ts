import { Test, TestingModule } from '@nestjs/testing';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

describe('CollectionsController', () => {
  let controller: CollectionsController;
  const service = { findAll: jest.fn(), create: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionsController],
      providers: [{ provide: CollectionsService, useValue: service }],
    }).compile();

    controller = module.get<CollectionsController>(CollectionsController);
  });

  it('findAll delegates to the service', async () => {
    service.findAll.mockResolvedValue(['c']);

    await expect(controller.findAll()).resolves.toEqual(['c']);
  });

  it('create delegates with the dto', async () => {
    const dto = { name: 'n' } as never;
    service.create.mockResolvedValue({ id: '1' });

    await expect(controller.create(dto)).resolves.toEqual({ id: '1' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('remove delegates with the id', async () => {
    service.remove.mockResolvedValue({ ok: true });

    await expect(controller.remove('1')).resolves.toEqual({ ok: true });
    expect(service.remove).toHaveBeenCalledWith('1');
  });
});
