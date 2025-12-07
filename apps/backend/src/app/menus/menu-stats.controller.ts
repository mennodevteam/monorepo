import { MenuStat, MenuStatDto, StatAction, UserRole } from '@menno/types';
import { Body, Controller, Delete, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { Public } from '../auth/public.decorator';
import * as pd from 'persian-date';

@Controller('menuStats')
export class MenuStatsController {
  private readonly logger = new Logger(MenuStatsController.name);

  constructor(
    @InjectRepository(MenuStat)
    private repo: Repository<MenuStat>,
  ) {}

  @Roles(UserRole.App)
  @Post('')
  save(
    @Body() body: MenuStatDto,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: body.action,
      menu: { id: body.menuId },
      product: body.productId ? { id: body.productId } : undefined,
      value: body.value,
      referrer,
      campaign,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('loadMenu/:id')
  loadMenu(
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: StatAction.LoadMenu,
      menu: { id },
      referrer,
      campaign,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('clickProduct/:menuId/:id')
  clickProduct(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: StatAction.ClickProduct,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      user: { id: user.id },
    });
  }

  @Roles(UserRole.App)
  @Get('addToCart/:menuId/:id')
  addToCart(
    @Param('menuId') menuId: string,
    @Param('id') id: string,
    @LoginUser() user: AuthPayload,
    @Query('referrer') referrer?: string,
    @Query('campaign') campaign?: string,
  ) {
    this.repo.save({
      action: StatAction.AddToCart,
      menu: { id: menuId },
      product: { id },
      referrer,
      campaign,
      user: { id: user.id },
    });
  }

  // TEMPORARY: Public endpoint to backfill Persian date fields for existing menu stats
  // TODO: Remove this after backfilling is complete
  @Public()
  @Get('temp/backfill-persian-dates')
  async backfillPersianDates(@Query('batchSize') batchSize = '1000') {
    const BATCH_SIZE = Math.min(Number(batchSize) || 1000, 5000); // Max 5000 per batch
    this.logger.log(`🚀 Starting Persian date fields backfill for MenuStat with batch size: ${BATCH_SIZE}`);

    try {
      // Get count of menu stats that need backfilling
      this.logger.log('📊 Counting menu stats that need backfilling...');
      const totalCount = await this.repo.count({
        where: {
          createdAtLocalDate: null,
        },
      });

      if (totalCount === 0) {
        this.logger.log('✅ All menu stats already have Persian date fields populated!');
        return {
          success: true,
          message: 'All menu stats already have Persian date fields populated!',
          processed: 0,
          total: 0,
        };
      }

      this.logger.log(`📊 Found ${totalCount} menu stats to backfill`);

      let processed = 0;
      let errors = 0;
      const startTime = Date.now();
      let batchNumber = 0;
      const MAX_BATCHES = 10000; // Safety limit to prevent infinite loops
      let lastProcessedCount = 0;
      let stuckCount = 0;

      // Process in batches
      let hasMore = true;
      while (hasMore) {
        batchNumber++;

        // Safety check: prevent infinite loops
        if (batchNumber > MAX_BATCHES) {
          this.logger.error(`❌ Reached maximum batch limit (${MAX_BATCHES}). Stopping to prevent infinite loop.`);
          break;
        }

        const batchStartTime = Date.now();

        this.logger.log(`📦 Fetching batch #${batchNumber}...`);
        const menuStats = await this.repo.find({
          where: {
            createdAtLocalDate: null,
          },
          take: BATCH_SIZE,
          order: {
            createdAt: 'ASC',
          },
        });

        if (menuStats.length === 0) {
          hasMore = false;
          this.logger.log('✅ No more menu stats to process');
          break;
        }

        // Check if we're stuck (processing same menu stats repeatedly)
        if (processed === lastProcessedCount && menuStats.length > 0) {
          stuckCount++;
          this.logger.warn(`⚠️  Possible stuck loop detected (${stuckCount} times). Processed count unchanged.`);
          if (stuckCount >= 3) {
            this.logger.error(`❌ Stuck loop detected. Breaking to prevent infinite loop.`);
            this.logger.error(`   Last batch had ${menuStats.length} menu stats but processed count didn't increase.`);
            this.logger.error(`   This might indicate the update operation is not persisting correctly.`);
            break;
          }
        } else {
          stuckCount = 0; // Reset if we made progress
        }

        this.logger.log(`📦 Processing batch #${batchNumber} with ${menuStats.length} menu stats...`);

        // Calculate Persian date fields for all menu stats
        const menuStatsToUpdate: Array<{ id: string; createdAtLocalDate: string; createdAtLocalTime: string; createdAtLocalDayOfWeek: number }> = [];
        for (const menuStat of menuStats) {
          try {
            if (!menuStat.createdAt) {
              this.logger.warn(`⚠️  MenuStat ${menuStat.id} has no createdAt, skipping...`);
              continue;
            }

            // Convert to Persian date (matching subscriber logic)
            const persianDate = new pd(new Date(menuStat.createdAt));

            // Format date as YYYY-MM-DD
            const year = persianDate.year();
            const month = String(persianDate.month()).padStart(2, '0');
            const day = String(persianDate.date()).padStart(2, '0');
            const localDate = `${year}-${month}-${day}`;

            // Format time as HH:mm:ss
            const hour = String(persianDate.hour()).padStart(2, '0');
            const minute = String(persianDate.minute()).padStart(2, '0');
            const second = String(persianDate.second()).padStart(2, '0');
            const localTime = `${hour}:${minute}:${second}`;

            menuStatsToUpdate.push({
              id: menuStat.id,
              createdAtLocalDate: localDate,
              createdAtLocalTime: localTime,
              createdAtLocalDayOfWeek: persianDate.day(),
            });
          } catch (error) {
            errors++;
            this.logger.error(`❌ Error processing MenuStat ${menuStat.id}: ${error.message}`);
          }
        }

        // Bulk update menu stats using update() instead of save() to avoid subscriber interference
        if (menuStatsToUpdate.length > 0) {
          try {
            const saveStartTime = Date.now();

            // Use update() for each menu stat to ensure persistence
            const updatePromises = menuStatsToUpdate.map((menuStat) =>
              this.repo.update(menuStat.id, {
                createdAtLocalDate: menuStat.createdAtLocalDate,
                createdAtLocalTime: menuStat.createdAtLocalTime,
                createdAtLocalDayOfWeek: menuStat.createdAtLocalDayOfWeek,
              }),
            );

            await Promise.all(updatePromises);
            const saveDuration = ((Date.now() - saveStartTime) / 1000).toFixed(2);

            // Verify the update actually persisted
            const sampleMenuStatId = menuStatsToUpdate[0].id;
            const verifyMenuStat = await this.repo.findOne({
              where: {
                id: sampleMenuStatId,
              },
              select: ['id', 'createdAtLocalDate', 'createdAtLocalTime', 'createdAtLocalDayOfWeek'],
            });

            if (!verifyMenuStat || !verifyMenuStat.createdAtLocalDate) {
              this.logger.error(`❌ Update verification failed! MenuStat ${sampleMenuStatId} still has null createdAtLocalDate after update.`);
              this.logger.error(`   This indicates the update operation may not be working correctly.`);
            }

            lastProcessedCount = processed;
            processed += menuStatsToUpdate.length;

            const batchDuration = ((Date.now() - batchStartTime) / 1000).toFixed(2);
            const progress = totalCount > 0 ? ((processed / totalCount) * 100).toFixed(1) : 'N/A';

            this.logger.log(
              `✅ Batch #${batchNumber} completed: ${menuStatsToUpdate.length} menu stats updated in ${saveDuration}s (batch total: ${batchDuration}s, progress: ${processed}/${totalCount} - ${progress}%)`,
            );
          } catch (error) {
            errors += menuStatsToUpdate.length;
            this.logger.error(`❌ Error bulk updating batch #${batchNumber}: ${error.message}`, error.stack);
          }
        } else {
          this.logger.warn(`⚠️  Batch #${batchNumber} had no valid menu stats to update`);
          // If we keep getting batches with no valid menu stats, we might be stuck
          if (menuStats.length > 0 && menuStatsToUpdate.length === 0) {
            this.logger.warn(`⚠️  All ${menuStats.length} menu stats in batch had issues. This might indicate a data problem.`);
            // Break if we consistently get no valid menu stats
            if (batchNumber > 5) {
              this.logger.error(`❌ Too many batches with no valid menu stats. Breaking loop.`);
              break;
            }
          }
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`📊 Verifying remaining menu stats...`);
      const remaining = await this.repo.count({
        where: {
          createdAtLocalDate: null,
        },
      });

      const result = {
        success: true,
        message: remaining === 0 ? 'All menu stats backfilled successfully!' : 'Batch processed',
        processed,
        errors,
        remaining,
        total: totalCount,
        duration: `${duration}s`,
        completed: remaining === 0,
      };

      if (remaining === 0) {
        this.logger.log(
          `✨ Backfill completed successfully! Processed ${processed} menu stats in ${duration}s (${errors} errors)`,
        );
      } else {
        this.logger.log(
          `📊 Backfill batch completed. Processed ${processed}/${totalCount} menu stats (${remaining} remaining, ${errors} errors) in ${duration}s`,
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`💥 Backfill failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Backfill failed',
        error: error.message,
      };
    }
  }
}
