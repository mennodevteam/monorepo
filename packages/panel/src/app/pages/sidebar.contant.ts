export type SidebarItem = {
  title: string,
  icon?: string,
  route?: string,
  children?: SidebarItem[],
}

export const ITEMS: SidebarItem[] = [
  {
    title: 'مدیریت منو',
    icon: 'fa-burger-fries'
  },
  {
    title: 'سفارشات',
    icon: 'fa-utensils'
  },
]