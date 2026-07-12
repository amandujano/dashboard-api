import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Public } from '../auth/public.decorator';

@Controller('api/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Public()
  @Get()
  async getProfile() {
    return this.profileService.getProfile();
  }
}
