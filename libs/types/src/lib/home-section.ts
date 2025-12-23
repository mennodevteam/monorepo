import { Shop } from './shop';
import { Image } from './image';

export enum HomeSectionType {
  Banner = 'Banner',
  ProductList = 'ProductList',
}

export enum BannerAspectRatio {
  OneToOne = 'OneToOne',
  ThreeToOne = 'ThreeToOne',
}

export enum ProductListViewType {
  Grid = 'Grid',
  Carousel = 'Carousel',
}

export interface BannerConfig {
  images: Image[];
  aspectRatio: BannerAspectRatio;
  fullWidth: boolean;
  links?: string[];
}

export interface ProductListConfig {
  viewType: ProductListViewType;
  productIds: string[];
  title?: string;
  gridCols?: number;
}

export class HomeSection {
  id: string;
  shop: Shop;
  type: HomeSectionType;
  position: number;
  isVisible: boolean;
  config: BannerConfig | ProductListConfig;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

