import { makeStateKey } from '@angular/core';
import { Menu, Shop } from '@menno/types';

export const shopTransferKey = (username: string) => makeStateKey<Shop>(`shop:${username}`);
export const menuTransferKey = (username: string) => makeStateKey<Menu>(`menu:${username}`);
