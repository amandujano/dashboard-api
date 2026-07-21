import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { ContactMessageModule } from './contact-message/contact-message.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { BlogPostsService } from './blog-posts/blog-posts.service';
import { BlogPostsController } from './blog-posts/blog-posts.controller';
import { BlogPostsModule } from './blog-posts/blog-posts.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL')!,
            limit: config.get<number>('THROTTLE_LIMIT')!,
          },
        ],
      }),
    }),
    SupabaseModule,
    ProfileModule,
    AuthModule,
    ContactMessageModule,
    BlogPostsModule,
    TelemetryModule,
  ],
  controllers: [AppController, BlogPostsController],
  // eslint-disable-next-line prettier/prettier
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    BlogPostsService,
  ],
})
export class AppModule {}
