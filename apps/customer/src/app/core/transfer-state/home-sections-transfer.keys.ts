import { makeStateKey } from '@angular/core';
import { HomeSection } from '@menno/types';

export const homeSectionsTransferKey = (username: string) =>
  makeStateKey<HomeSection[]>(`homeSections:${username}`);
