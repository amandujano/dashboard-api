import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessageController } from './contact-message.controller';
import { ContactMessageService } from './contact-message.service';

describe('ContactMessageController', () => {
  let controller: ContactMessageController;
  const service = { saveContactMessage: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessageController],
      providers: [{ provide: ContactMessageService, useValue: service }],
    }).compile();

    controller = module.get<ContactMessageController>(ContactMessageController);
  });

  it('create spreads the dto into saveContactMessage', async () => {
    service.saveContactMessage.mockResolvedValue({ ok: true });

    const result = await controller.create({
      name: 'Ann',
      email: 'a@b.c',
      message: 'hi',
    });

    expect(service.saveContactMessage).toHaveBeenCalledWith(
      'Ann',
      'a@b.c',
      'hi',
    );
    expect(result).toEqual({ ok: true });
  });
});
