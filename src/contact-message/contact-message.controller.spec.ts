import { Test, TestingModule } from '@nestjs/testing';
import { ContactMessageController } from './contact-message.controller';

describe('ContactMessageController', () => {
  let controller: ContactMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactMessageController],
    }).compile();

    controller = module.get<ContactMessageController>(ContactMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
