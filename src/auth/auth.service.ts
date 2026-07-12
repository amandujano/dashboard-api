import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabaseService: SupabaseService) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabaseService
      .getAuthClient()
      .auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      throw new UnauthorizedException(
        error?.message ?? 'Credenciales inválidas',
      );
    }

    return data.session;
  }
  async getUserFromToken(token: string) {
    const { data, error } = await this.supabaseService
      .getAuthClient()
      .auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException(
        error?.message ?? 'Usuario no encontrado',
      );
    }

    return data.user;
  }
}