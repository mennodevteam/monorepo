import { Shop } from './shop';
import { Image } from './image';

export enum HomeSectionType {
  Banner = 'Banner',
  ProductList = 'ProductList',
  CategoryList = 'CategoryList',
}

export enum BannerAspectRatio {
  OneToOne = 'OneToOne',
  ThreeToOne = 'ThreeToOne',
  ThreeToTwo = 'ThreeToTwo',
  TwoToThree = 'TwoToThree',
  OneToThree = 'OneToThree',
}

export enum ProductListViewType {
  Grid = 'Grid',
  Carousel = 'Carousel',
}

export enum CategoryListViewType {
  Grid = 'Grid',
  Carousel = 'Carousel',
  Button = 'Button',
}

export enum BannerLinkType {
  Category = 'Category',
  Product = 'Product',
  External = 'External',
}

export interface BannerLink {
  type: BannerLinkType;
  categoryId?: number;
  productId?: string;
  externalUrl?: string;
}

export interface BannerConfig {
  images: Image[];
  aspectRatio: BannerAspectRatio;
  fullWidth: boolean;
  links?: BannerLink[];
}

export interface ProductListConfig {
  viewType: ProductListViewType;
  productIds: string[];
  title?: string;
  gridCols?: number;
  carouselRows?: number;
}

export interface CategoryListConfig {
  viewType: CategoryListViewType;
  categoryIds: number[];
  title?: string;
  gridCols?: number;
  carouselRows?: number;
  showAll?: boolean;
}

export class HomeSection {
  id: string;
  shop: Shop;
  type: HomeSectionType;
  position: number;
  isVisible: boolean;
  config: BannerConfig | ProductListConfig | CategoryListConfig;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

