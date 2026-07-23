/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { aliasFromHash, emojiFromHash } from './visitor-alias';

type VisitInput = {
  ip: string;
  path: string;
  country?: string;
  userAgent?: string;
};

@Injectable()
export class TelemetryService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  private hashIp(ip: string): string {
    const salt = this.configService.get<string>('IP_HASH_SALT')!;
    return createHash('sha256')
      .update(ip + salt)
      .digest('hex');
  }

  private parseBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    return 'other';
  }

  async recordVisit(input: VisitInput) {
    const { error } = await this.supabaseService
      .getClient()
      .from('page_views')
      .insert([
        {
          visitor_hash: this.hashIp(input.ip),
          path: input.path,
          country: input.country ?? null,
          browser: this.parseBrowser(input.userAgent),
        },
      ]);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { ok: true };
  }

  async getStats() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('page_views')
      .select('visitor_hash, country, browser, created_at');

    if (error) {
      throw new BadRequestException(error.message);
    }

    const totalVisits = data.length;
    const uniqueVisitors = new Set(data.map((v) => v.visitor_hash)).size;

    const byCountry = this.groupCount(data, 'country');
    const byBrowser = this.groupCount(data, 'browser');
    const byDay = this.groupByDay(data);

    return { totalVisits, uniqueVisitors, byCountry, byBrowser, byDay };
  }

  private groupCount(rows: any[], key: string) {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const value = row[key] ?? 'unknown';
      counts[value] = (counts[value] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }

  private groupByDay(rows: any[]) {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const day = (row.created_at as string).slice(0, 10); // YYYY-MM-DD
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getVisitors() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('page_views')
      .select('visitor_hash, country, browser, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(error.message);
    }

    const visitors = new Map<
      string,
      {
        id: string;
        alias: string;
        emoji: string;
        visits: number;
        country: string | null;
        browser: string | null;
        firstSeen: string;
        lastSeen: string;
      }
    >();

    for (const row of data) {
      const hash = row.visitor_hash as string;
      const seenAt = row.created_at as string;
      const existing = visitors.get(hash);

      if (existing) {
        existing.visits += 1;
        if (seenAt < existing.firstSeen) existing.firstSeen = seenAt;
        if (seenAt > existing.lastSeen) existing.lastSeen = seenAt;
      } else {
        visitors.set(hash, {
          id: hash.slice(0, 8),
          alias: aliasFromHash(hash),
          emoji: emojiFromHash(hash),
          visits: 1,
          country: row.country,
          browser: row.browser,
          firstSeen: seenAt,
          lastSeen: seenAt,
        });
      }
    }

    return [...visitors.values()].sort((a, b) => b.visits - a.visits);
  }
}
