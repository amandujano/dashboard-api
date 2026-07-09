import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('api/profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile() {
    return this.profileService.getProfile();
  }
}
