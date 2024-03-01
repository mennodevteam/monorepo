import { Member, UserRole, Wallet, WalletLog, WalletLogType } from '@menno/types';
import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private repo: Repository<Wallet>
  ) {}

  @Post('charge')
  async charge(
    @LoginUser() user: AuthPayload,
    @Body() dto: { amount: number; memberId: string }
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
      shop.id
    );
  }
}
