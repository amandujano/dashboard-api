import { Test, TestingModule } from '@nestjs/testing';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

describe('ImagesController', () => {
  let controller: ImagesController;
  const service = {
    findAll: jest.fn(),
    upload: jest.fn(),
    remove: jest.fn(),
    addToCollection: jest.fn(),
    removeFromCollection: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagesController],
      providers: [{ provide: ImagesService, useValue: service }],
    }).compile();

    controller = module.get<ImagesController>(ImagesController);
  });

  it('findAll passes the collection filter', async () => {
    service.findAll.mockResolvedValue(['i']);

    await expect(controller.findAll('c1')).resolves.toEqual(['i']);
    expect(service.findAll).toHaveBeenCalledWith('c1');
  });

  it('upload passes the file and alt text', async () => {
    const file = { originalname: 'a.png' } as Express.Multer.File;
    service.upload.mockResolvedValue({ id: '1' });

    await expect(controller.upload(file, 'alt')).resolves.toEqual({ id: '1' });
    expect(service.upload).toHaveBeenCalledWith(file, 'alt');
  });

  it('upload defaults alt to an empty string', async () => {
    const file = {} as Express.Multer.File;

    await controller.upload(file, undefined as unknown as string);

    expect(service.upload).toHaveBeenCalledWith(file, '');
  });

  it('remove delegates with the id', async () => {
    service.remove.mockResolvedValue({ ok: true });

    await expect(controller.remove('1')).resolves.toEqual({ ok: true });
    expect(service.remove).toHaveBeenCalledWith('1');
  });

  it('addToCollection delegates with ids', async () => {
    service.addToCollection.mockResolvedValue({ ok: true });

    await controller.addToCollection('1', 'c1');

    expect(service.addToCollection).toHaveBeenCalledWith('1', 'c1');
  });

  it('removeFromCollection delegates with ids', async () => {
    service.removeFromCollection.mockResolvedValue({ ok: true });

    await controller.removeFromCollection('1', 'c1');

    expect(service.removeFromCollection).toHaveBeenCalledWith('1', 'c1');
  });
});
