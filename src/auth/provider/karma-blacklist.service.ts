import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KarmaBlacklistService {
  private readonly logger = new Logger(KarmaBlacklistService.name);

  constructor(private readonly config: ConfigService) {}

  async assertEmailAllowed(email: string): Promise<void> {
    const status = await this.getEmailBlacklistStatus(email);
    if (status.isBlacklisted) {
      throw new ForbiddenException(
        'User is not eligible for onboarding (blacklisted)',
      );
    }
  }

  async getEmailBlacklistStatus(
    email: string,
  ): Promise<{ isBlacklisted: boolean }> {
    const normalized = email.trim().toLowerCase();
    const result = await this.checkAdjutor(normalized);
    return result;
  }

  private async checkAdjutor(
    email: string,
  ): Promise<{ isBlacklisted: boolean }> {
    const baseUrl =
      this.config.get<string>('KARMA_BASE_URL') ??
      'https://adjutor.lendsqr.com';
    const appId = this.config.get<string>('KARMA_APP_ID');
    const apiKey = this.config.get<string>('KARMA_API_KEY');

    if (!appId || !apiKey) {
      throw new ServiceUnavailableException(
        'Karma integration credentials are not configured',
      );
    }

    const url = `${baseUrl.replace(/\/+$/, '')}/v2/verification/karma/${encodeURIComponent(email)}`;

    try {
      this.logger.log(`Checking karma blacklist for identity: ${email}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'x-app-id': appId,
          appid: appId,
          'Content-Type': 'application/json',
        },
      });

      // Not found is treated as not blacklisted.
      if (response.status === 404) {
        this.logger.log(
          `Karma check passed (no blacklist record) for identity: ${email}`,
        );
        return { isBlacklisted: false };
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'Blacklist provider returned an error',
        );
      }
      const body = (await response.json()) as {
        status?: string;
        data?: {
          karma_identity?: string | null;
        } | null;
      };
      const blocked =
        body.status === 'success' &&
        body.data !== null &&
        body.data !== undefined &&
        !!body.data.karma_identity;

      if (blocked) {
        this.logger.warn(`Karma check failed (identity blacklisted): ${email}`);
        return { isBlacklisted: true };
      }
      this.logger.log(`Karma check passed for identity: ${email}`);
      return { isBlacklisted: false };
    } catch (e) {
      if (
        e instanceof ForbiddenException ||
        e instanceof ServiceUnavailableException
      ) {
        this.logger.error(
          `Karma check error for identity ${email}: ${e.message}`,
        );
        throw e;
      }
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `Karma provider request failed for identity ${email}: ${errorMessage}`,
      );
      throw new ServiceUnavailableException(
        'Blacklist provider request failed',
      );
    }
  }
}
