import { Body, Controller, Get, Header, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.login(body.email, body.password);

    res.cookie('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: session.expires_in * 1000,
    });

    res.cookie('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return { email: session.user.email };
  }

  @Public()
  @Post('logout')
  @Header('Cache-Control', 'no-store')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('sb-access-token', { path: '/' });
    res.clearCookie('sb-refresh-token', { path: '/' });
    return { ok: true };
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { user: req['user'] };
  }
}
