import { MenuStatsController } from './menu-stats.controller';
import { MenuStat, MenuStatDto, StatAction, UserRole } from '@menno/types';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';

describe('MenuStatsController (UTM & Guest Tracking)', () => {
  let controller: MenuStatsController;
  let repo: Partial<Repository<MenuStat>>;
  let shopsRepo: any;
  let campaignsRepo: any;
  let authService: Partial<AuthService>;

  beforeEach(() => {
    repo = {
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'stat-uuid', ...entity })),
    };
    shopsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    campaignsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
    };
    authService = {
      getUserFromHeader: jest.fn().mockReturnValue(null),
    };

    controller = new MenuStatsController(
      repo as Repository<MenuStat>,
      shopsRepo,
      campaignsRepo,
      authService as AuthService,
    );
  });

  it('1. should record loadMenu for guest visitors without requiring authentication', async () => {
    const req = { headers: {} } as any;

    await controller.loadMenu(
      'menu-123',
      req,
      'https://instagram.com',
      'special_campaign',
      'instagram',
      'story',
      'spring_fest',
      'promo_code',
      'banner1',
      'guest-xyz',
    );

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: StatAction.LoadMenu,
        menu: { id: 'menu-123' },
        referrer: 'https://instagram.com',
        campaign: 'special_campaign',
        utmSource: 'instagram',
        utmMedium: 'story',
        utmCampaign: 'spring_fest',
        utmTerm: 'promo_code',
        utmContent: 'banner1',
        guestId: 'guest-xyz',
        user: undefined,
      }),
    );
  });

  it('2. should attach authenticated user when valid token is present', async () => {
    authService.getUserFromHeader = jest.fn().mockReturnValue({ id: 'user-789', role: UserRole.App });
    const req = { headers: { authorization: 'Bearer token123' } } as any;

    const dto: MenuStatDto = {
      action: StatAction.ClickProduct,
      menuId: 'menu-123',
      productId: 'prod-456',
      utmSource: 'telegram',
      utmCampaign: 'winter_sale',
      guestId: 'guest-xyz',
    };

    await controller.save(dto, req);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: StatAction.ClickProduct,
        menu: { id: 'menu-123' },
        product: { id: 'prod-456' },
        utmSource: 'telegram',
        utmCampaign: 'winter_sale',
        guestId: 'guest-xyz',
        user: { id: 'user-789' },
      }),
    );
  });

  it('3. should preserve existing campaign param alongside UTM parameters', async () => {
    const req = { headers: {} } as any;
    const dto: MenuStatDto = {
      action: StatAction.AddToCart,
      menuId: 'menu-123',
      productId: 'prod-456',
      campaign: 'internal_promo_2026',
      utmSource: 'sms_blast',
      utmCampaign: 'eid_offer',
    };

    await controller.save(dto, req);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: StatAction.AddToCart,
        campaign: 'internal_promo_2026',
        utmSource: 'sms_blast',
        utmCampaign: 'eid_offer',
      }),
    );
  });
});
