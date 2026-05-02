import { Body, Controller, HttpCode, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { BaleBotsService } from './bale-bots.service';

/**
 * Bale sends HTTPS POST with JSON-serialized Update (same shape as Telegram).
 * Webhook URL: `{API_BASE_URL}/webhooks/bale/{shopId}?secret={BALE_WEBHOOK_SECRET}` (setWebhook on Bale).
 * Bale expects HTTPS (ports 443 / 88); `API_BASE_URL` must be https in production.
 */
@Controller('webhooks/bale')
export class BaleWebhookController {
  constructor(private readonly baleBots: BaleBotsService) {}

  @Public()
  @Post(':shopId')
  @HttpCode(200)
  async receive(
    @Param('shopId') shopId: string,
    @Query('secret') secret: string | undefined,
    @Body() body: unknown,
  ): Promise<{ ok: true }> {
    const expected = process.env.BALE_WEBHOOK_SECRET?.trim();
    if (!expected || secret !== expected) {
      throw new UnauthorizedException();
    }
    await this.baleBots.handleIncomingWebhook(shopId, body);
    return { ok: true };
  }
}
