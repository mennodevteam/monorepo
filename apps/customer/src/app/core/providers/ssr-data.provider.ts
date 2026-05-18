import {
  PLATFORM_ID,
  REQUEST,
  TransferState,
  inject,
  makeStateKey,
  provideAppInitializer,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { HomeSection, Menu, Shop } from '@menno/types';
import { getRequestHost } from '../functions/request-host';
import { resolveShopUsername } from '../functions';
import { ssrLog } from '../functions/ssr-logger';
import { prepareMenuForApp } from '../utils/prepare-menu';
import { serializeCircularForTransfer, serializeForTransfer } from '../utils/serialize-for-transfer';
import { shopTransferKey, menuTransferKey } from '../transfer-state/shop-transfer.keys';
import { homeSectionsTransferKey } from '../transfer-state/home-sections-transfer.keys';
import { SeoService } from '../services/seo.service';
import { prefetchShopData } from './ssr-prefetch';

const MENU_QUERY_KEY = (username: string) => ['menu', username] as const;
const SHOP_QUERY_KEY = (username: string) => ['shop', username] as const;
const HOME_SECTIONS_QUERY_KEY = (username: string) => ['homeSections', username] as const;

const SSR_PREFETCH_DONE = makeStateKey<boolean>('ssrPrefetchDone');

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
    const requestHost = getRequestHost(request);
    const username = resolveShopUsername(
      requestHost ?? (typeof window !== 'undefined' ? window.location.hostname : undefined),
    );

    if (isPlatformServer(platformId)) {
      if (!requestHost) {
        ssrLog.prefetchSkip('unknown', 'missing request host');
        return;
      }

      return prefetchShopData(http, requestHost)
        .then((result) => {
          if (!result) {
            ssrLog.prefetchSkip(
              requestHost,
              'set SSR_API_URL to your internal backend URL',
            );
            return;
          }

          const { username: cacheUsername, shop, menu, homeSections } = result;

          transferState.set(shopTransferKey(cacheUsername), serializeForTransfer(shop));
          if (menu) {
            const menuForApp = prepareMenuForApp(menu);
            transferState.set(menuTransferKey(cacheUsername), serializeCircularForTransfer(menuForApp));
            queryClient.setQueryData(MENU_QUERY_KEY(cacheUsername), menuForApp);
          }
          if (homeSections) {
            transferState.set(homeSectionsTransferKey(cacheUsername), serializeForTransfer(homeSections));
            queryClient.setQueryData(HOME_SECTIONS_QUERY_KEY(cacheUsername), homeSections);
          }
          transferState.set(SSR_PREFETCH_DONE, true);
          queryClient.setQueryData(SHOP_QUERY_KEY(cacheUsername), shop);

          seo.applyShopDefaults(shop);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          ssrLog.warn('prefetch error', { host: requestHost, error: message });
        });
    }

    if (transferState.hasKey(SSR_PREFETCH_DONE)) {
      const hydrated = {
        shop: transferState.hasKey(shopTransferKey(username)),
        menu: transferState.hasKey(menuTransferKey(username)),
        homeSections: transferState.hasKey(homeSectionsTransferKey(username)),
      };
      transferState.remove(SSR_PREFETCH_DONE);
      hydrateQueryCache(queryClient, transferState, username);
      ssrLog.hydrate(username, hydrated);
      const shop = queryClient.getQueryData<Shop>(SHOP_QUERY_KEY(username));
      if (shop) {
        seo.applyShopDefaults(shop);
      }
    }

    return undefined;
  });
}
