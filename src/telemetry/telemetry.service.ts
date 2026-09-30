/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { desc } from 'drizzle-orm';
import geoip from 'geoip-lite';
import { DRIZZLE } from '../database/database.constants';
import { orFail } from '../database/db-error';
import type { Database } from '../database/database.types';
import { page_views } from '../database/schema';
import { aliasFromHash, emojiFromHash } from './visitor-alias';

const visitCols = {
  visitor_hash: page_views.visitor_hash,
  country: page_views.country,
  browser: page_views.browser,
  created_at: page_views.created_at,
};

type VisitInput = {
  ip: string;
  path: string;
  userAgent?: string;
};

@Injectable()
export class TelemetryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
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

  // Offline IP -> country lookup (no external call, no third-party IP
  // sharing). geoip.lookup returns null for unresolvable/private/malformed
  // IPs (e.g. 'unknown', loopback, LAN addresses) — treat that as "no
  // country" rather than throwing.
  private lookupCountry(ip: string): string | undefined {
    const result = geoip.lookup(ip);
    return result?.country ?? undefined;
  }

  async recordVisit(input: VisitInput) {
    await orFail(
      this.db.insert(page_views).values({
        visitor_hash: this.hashIp(input.ip),
        path: input.path,
        country: this.lookupCountry(input.ip) ?? null,
        browser: this.parseBrowser(input.userAgent),
      }),
      (message) => new BadRequestException(message),
    );

    return { ok: true };
  }

  async getStats() {
    const data = await orFail(
      this.db.select(visitCols).from(page_views),
      (message) => new BadRequestException(message),
    );

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
    const data = await orFail(
      this.db
        .select(visitCols)
        .from(page_views)
        .orderBy(desc(page_views.created_at)),
      (message) => new BadRequestException(message),
    );

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
      const hash = row.visitor_hash ?? 'unknown';
      const seenAt = row.created_at;
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
