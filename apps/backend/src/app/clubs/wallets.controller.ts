import { Member, UserRole, Wallet, WalletLog, WalletLogType } from '@menno/types';
import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Roles } from '../auth/roles.decorators';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@Roles(UserRole.Panel)
export class WalletsController {
  constructor(
    private auth: AuthService,
    private walletsService: WalletsService,
    @InjectRepository(Member)
    private membersRepo: Repository<Member>,
    @InjectRepository(Wallet)
    private repo: Repository<Wallet>,
  ) {}

  @Post('charge')
  async charge(
    @LoginUser() user: AuthPayload,
    @Body() dto: { amount: number; memberId: string },
  ): Promise<Wallet> {
    const shop = await this.auth.getPanelUserShop(user, ['club']);
    const member = await this.membersRepo.findOne({
      where: { id: dto.memberId, club: { id: shop.club.id } },
      relations: ['wallet'],
    });
    if (!member.wallet) {
      const newWalletDto = {
        charge: 0,
        member: { id: member.id },
      } as Wallet;
      const newWallet = await this.repo.save(newWalletDto);
      member.wallet = newWallet;
    }

    return this.walletsService.updateWalletAmount(
      {
        amount: dto.amount,
        type: WalletLogType.ManualCharge,
        wallet: member.wallet,
        user: { id: user.id },
      } as WalletLog,
      shop.id,
    );
  }

  @Post('groupCharge')
  async groupCharge(
    @LoginUser() user: AuthPayload,
    @Body() dto: { amount: number; memberIds: string[] },
  ): Promise<{ success: Wallet[]; failed: { memberId: string; error: string }[] }> {
    // Validation
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    if (!dto.memberIds || !Array.isArray(dto.memberIds) || dto.memberIds.length === 0) {
      throw new BadRequestException('MemberIds must be a non-empty array');
    }
    if (dto.memberIds.length > 100) {
      throw new BadRequestException('Cannot charge more than 100 members at once');
    }

    const shop = await this.auth.getPanelUserShop(user, ['club']);

    // Validate that all members belong to the same club
    const members = await this.membersRepo.find({
      where: {
        id: In(dto.memberIds),
        club: { id: shop.club.id },
      },
      relations: ['wallet'],
    });

    if (members.length !== dto.memberIds.length) {
      throw new BadRequestException('Some members do not belong to this club');
    }

    return this.walletsService.groupChargeMembers(dto, shop.id, user.id);
  }
}
