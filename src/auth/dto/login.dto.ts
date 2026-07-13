import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'tu@email.com' })
  email!: string;

  @ApiProperty({ example: 'tu-password' })
  password!: string;
}
