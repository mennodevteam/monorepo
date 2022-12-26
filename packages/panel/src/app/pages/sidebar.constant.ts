export type SidebarItem = {
  title: string,
  icon?: string,
  route?: string,
  children?: SidebarItem[],
}

export const ITEMS: SidebarItem[] = [
  {
    title: 'menu',
    icon: 'fa-book-open',
    route: 'menu'
  },
  {
    title: 'orders',
    icon: 'fa-utensils'
  },
  {
    title: 'settings',
    icon: 'fa-setting',
    route: 'settings'
  },
]