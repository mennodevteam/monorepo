import { HttpClient } from '@angular/common/http';
import {
  PLATFORM_ID,
  REQUEST,
  TransferState,
  inject,
  makeStateKey,
  provideAppInitializer,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { HomeSection, Menu, Shop } from '@menno/types';
import { resolveShopUsername } from '../functions';
import { prepareMenuForApp } from '../utils/prepare-menu';
import { serializeCircularForTransfer, serializeForTransfer } from '../utils/serialize-for-transfer';
import { shopTransferKey, menuTransferKey } from '../transfer-state/shop-transfer.keys';
import { homeSectionsTransferKey } from '../transfer-state/home-sections-transfer.keys';
import { SeoService } from '../services/seo.service';

const MENU_QUERY_KEY = (username: string) => ['menu', username] as const;
const SHOP_QUERY_KEY = (username: string) => ['shop', username] as const;
const HOME_SECTIONS_QUERY_KEY = (username: string) => ['homeSections', username] as const;

const SSR_PREFETCH_DONE = makeStateKey<boolean>('ssrPrefetchDone');

async function fetchShop(http: HttpClient, username: string): Promise<Shop> {
  return firstValueFrom(
    http.get<Shop>(`shops/${username}`, {
      headers: { skipJwt: 'true' },
    }),
  );
}

async function fetchMenu(http: HttpClient, username: string): Promise<Menu> {
  return firstValueFrom(
    http.get<Menu>(`menus/${username}`, {
      headers: { skipJwt: 'true' },
    }),
  );
}

async function fetchHomeSections(http: HttpClient, username: string): Promise<HomeSection[]> {
  return firstValueFrom(
    http.get<HomeSection[]>(`home-sections/${username}`, {
      headers: { skipJwt: 'true' },
    }),
  );
}

function hydrateQueryCache(
  queryClient: QueryClient,
  transferState: TransferState,
  username: string,
): void {
  const shopKey = shopTransferKey(username);
  if (transferState.hasKey(shopKey)) {
    const shop = transferState.get(shopKey, null as unknown as Shop);
    transferState.remove(shopKey);
    queryClient.setQueryData(SHOP_QUERY_KEY(username), shop);
  }

  const menuKey = menuTransferKey(username);
  if (transferState.hasKey(menuKey)) {
    const menu = transferState.get(menuKey, null as unknown as Menu);
    transferState.remove(menuKey);
    const prepared = prepareMenuForApp(menu);
    queryClient.setQueryData(MENU_QUERY_KEY(username), prepared);
  }

  const sectionsKey = homeSectionsTransferKey(username);
  if (transferState.hasKey(sectionsKey)) {
    const sections = transferState.get(sectionsKey, null as unknown as HomeSection[]);
    transferState.remove(sectionsKey);
    queryClient.setQueryData(HOME_SECTIONS_QUERY_KEY(username), sections);
  }
}

export function provideSsrDataTransfer() {
  return provideAppInitializer(() => {
    const platformId = inject(PLATFORM_ID);
    const transferState = inject(TransferState);
    const queryClient = inject(QueryClient);
    const http = inject(HttpClient);
    const seo = inject(SeoService);
    const request = inject(REQUEST, { optional: true }) as Request | null;
    const requestHost = request?.headers?.get('host')?.split(':')[0];
    const username = resolveShopUsername(
      requestHost ?? (typeof window !== 'undefined' ? window.location.hostname : undefined),
    );

    if (isPlatformServer(platformId)) {
      if (!requestHost) {
        return;
      }

      return Promise.all([
        fetchShop(http, username),
        fetchMenu(http, username),
        fetchHomeSections(http, username),
      ]).then(([shop, menu, homeSections]) => {
        const menuForApp = prepareMenuForApp(menu);

        transferState.set(shopTransferKey(username), serializeForTransfer(shop));
        transferState.set(menuTransferKey(username), serializeCircularForTransfer(menuForApp));
        transferState.set(homeSectionsTransferKey(username), serializeForTransfer(homeSections));
        transferState.set(SSR_PREFETCH_DONE, true);

        queryClient.setQueryData(SHOP_QUERY_KEY(username), shop);
        queryClient.setQueryData(MENU_QUERY_KEY(username), menuForApp);
        queryClient.setQueryData(HOME_SECTIONS_QUERY_KEY(username), homeSections);

        seo.applyShopDefaults(shop);
      });
    }

    if (transferState.hasKey(SSR_PREFETCH_DONE)) {
      transferState.remove(SSR_PREFETCH_DONE);
      hydrateQueryCache(queryClient, transferState, username);
      const shop = queryClient.getQueryData<Shop>(SHOP_QUERY_KEY(username));
      if (shop) {
        seo.applyShopDefaults(shop);
      }
    }

    return undefined;
  });
}
