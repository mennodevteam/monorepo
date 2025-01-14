import { Get, Injectable, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ThirdParty, ThirdPartyApp } from '@menno/types';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class OauthService {
  constructor(
    @InjectRepository(ThirdParty)
    private readonly thirdPartiesRepo: Repository<ThirdParty>,
    private http: HttpService,
  ) {}

  @Public()
  @Get()
  async getOauth(shopId: string) {
    return this.thirdPartiesRepo.findOne({ where: { shop: { id: shopId }, app: ThirdPartyApp.Basalam } });
  }

  async callback(code: string, @Query('state') state: string) {
    const oauth = await this.getOauth(state);
    const tokenResponse = await this.http
      .post<any>('https://auth.basalam.com/oauth/token', {
        grant_type: 'authorization_code',
        client_id: '660',
        client_secret: 'sciJzLMsGxk0Oa09K6QK7sgbbuGDv7dwNDb6Fxb4',
        redirect_uri: 'http://localhost:3000/basalam/auth',
        code: code,
      })
      .toPromise();

    const data = tokenResponse.data;
    const dto: Partial<ThirdParty> = {
      id: oauth?.id,
      keys: {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        refreshToken: data.refresh_token,
      },
      shop: { id: state } as Shop,
      app: ThirdPartyApp.Basalam,
    };
    
    console.log(dto, oauth, data)

    if (!oauth?.token) {
      const meResponse = await this.http
        .get<any>('https://core.basalam.com/v3/users/me', {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        })
        .toPromise();

      dto.token = meResponse.data.vendor.id.toString();
    }

    return this.thirdPartiesRepo.save(dto);
  }

  getAuthorizationHeader(shopId: string) {
    return this.getOauth(shopId).then((oauth) => ({
      Authorization: `Bearer ${oauth.keys.accessToken}`,
    }));
  }
}
