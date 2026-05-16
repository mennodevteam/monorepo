import { Menu } from '@menno/types';
import { serializeForTransfer } from './serialize-for-transfer';

export function isMenuPrepared(menu: Menu): boolean {
  return !!menu.categories?.some((cat) => cat.products?.some((p) => p.category === cat));
}

/** Clone menu and wire category/variant refs (creates circular refs — do not put in TransferState). */
export function prepareMenuForApp(menu: Menu): Menu {
  const cloned = serializeForTransfer(menu);
  Menu.setRefsAndSort(cloned, undefined, false, false);
  return cloned;
}

export function ensureMenuPrepared(menu: Menu): Menu {
  return isMenuPrepared(menu) ? menu : prepareMenuForApp(menu);
}
