import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  const service = { getProfile: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: service }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('getProfile returns the service result', async () => {
    service.getProfile.mockResolvedValue({ name: 'Ann' });

    await expect(controller.getProfile()).resolves.toEqual({ name: 'Ann' });
  });
});
