import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { login: jest.fn() };

  const createRes = () =>
    ({ cookie: jest.fn(), clearCookie: jest.fn() }) as unknown as Response & {
      cookie: jest.Mock;
      clearCookie: jest.Mock;
    };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('login sets httpOnly session cookies and returns the email', async () => {
    authService.login.mockResolvedValue({
      access_token: 'access',
      refresh_token: 'refresh',
      expires_in: 3600,
      user: { email: 'a@b.c' },
    });
    const res = createRes();

    const result = await controller.login(
      { email: 'a@b.c', password: 'pw' },
      res,
    );

    expect(authService.login).toHaveBeenCalledWith('a@b.c', 'pw');
    expect(res.cookie).toHaveBeenCalledWith(
      'sb-access-token',
      'access',
      expect.objectContaining({ httpOnly: true, maxAge: 3600 * 1000 }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'sb-refresh-token',
      'refresh',
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
    expect(result).toEqual({ email: 'a@b.c' });
  });

  it('logout clears both cookies', () => {
    const res = createRes();

    expect(controller.logout(res)).toEqual({ ok: true });
    expect(res.clearCookie).toHaveBeenCalledWith('sb-access-token', {
      path: '/',
    });
    expect(res.clearCookie).toHaveBeenCalledWith('sb-refresh-token', {
      path: '/',
    });
  });

  it('me returns the user attached to the request', () => {
    const user = { id: 'u1' };

    expect(controller.me({ user } as unknown as Request)).toEqual({ user });
  });
});
