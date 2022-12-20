export type SidebarItem = {
  title: string,
  icon?: string,
  route?: string,
  children?: SidebarItem[],
}

export const ITEMS: SidebarItem[] = [
  {
    title: 'menu',
    icon: 'fa-burger-fries'
  },
  {
    title: 'orders',
    icon: 'fa-utensils'
  },
]