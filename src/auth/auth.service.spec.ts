import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const signInWithPassword = jest.fn();
  const getUser = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: SupabaseService,
          useValue: {
            getAuthClient: () => ({ auth: { signInWithPassword, getUser } }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns the session on success', async () => {
      const session = { access_token: 'a', refresh_token: 'r' };
      signInWithPassword.mockResolvedValue({ data: { session }, error: null });

      await expect(service.login('a@b.c', 'pw')).resolves.toBe(session);
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.c',
        password: 'pw',
      });
    });

    it('throws Unauthorized with the Supabase error message', async () => {
      signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: { message: 'bad creds' },
      });

      await expect(service.login('a@b.c', 'pw')).rejects.toThrow(
        new UnauthorizedException('bad creds'),
      );
    });

    it('throws Unauthorized when there is no session and no error', async () => {
      signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(service.login('a@b.c', 'pw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('getUserFromToken', () => {
    it('returns the user for a valid token', async () => {
      const user = { id: 'u1' };
      getUser.mockResolvedValue({ data: { user }, error: null });

      await expect(service.getUserFromToken('tok')).resolves.toBe(user);
      expect(getUser).toHaveBeenCalledWith('tok');
    });

    it('throws Unauthorized for an invalid token', async () => {
      getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'jwt expired' },
      });

      await expect(service.getUserFromToken('tok')).rejects.toThrow(
        new UnauthorizedException('jwt expired'),
      );
    });

    it('throws Unauthorized when the user is missing', async () => {
      getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(service.getUserFromToken('tok')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
