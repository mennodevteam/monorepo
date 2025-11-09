import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RootAppBarComponent } from '../../shared/components/root-app-bar/root-app-bar.component';
import { SectionComponent } from '../../shared/components/section/section.component';
import { CategoryListComponent } from '../../shared/components/category-list/category-list.component';
import { Menu, OrderType, ProductCategory, Status } from '@menno/types';

const SAMPLE_MENU: Menu = {
  id: 'sample-menu',
  title: 'منوی نمایشی',
  costs: [],
};

const SAMPLE_CATEGORIES: ProductCategory[] = [
  {
    id: 1,
    title: 'صبحانه ایرانی',
    description: 'ترکیبی از نان تازه، پنیر، سبزیجات، و چای خوش‌عطر.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Takeaway],
    isAbstract: false,
    position: 1,
    menu: SAMPLE_MENU,
  },
  {
    id: 2,
    title: 'کافی‌شاپ',
    description: 'انواع قهوه‌های تخصصی و نوشیدنی‌های گرم و سرد.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Takeaway],
    isAbstract: false,
    position: 2,
    menu: SAMPLE_MENU,
  },
  {
    id: 3,
    title: 'سالاد و پیش‌غذا',
    description: 'سالادهای تازه و پیش‌غذاهای سبک برای شروع.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Delivery],
    isAbstract: false,
    position: 3,
    menu: SAMPLE_MENU,
  },
  {
    id: 4,
    title: 'غذای اصلی',
    description: 'غذاهای ایرانی و فرنگی محبوب برای هر سلیقه‌ای.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Delivery],
    isAbstract: false,
    position: 4,
    menu: SAMPLE_MENU,
  },
  {
    id: 5,
    title: 'پیتزا و فست‌فود',
    description: 'پیتزاهای ایتالیایی، برگرهای دست‌ساز و بیشتر.',
    status: Status.Active,
    orderTypes: [OrderType.Delivery, OrderType.Takeaway],
    isAbstract: false,
    position: 5,
    menu: SAMPLE_MENU,
  },
  {
    id: 6,
    title: 'دسر و شیرینی',
    description: 'انواع دسرهای تازه، کیک و شیرینی‌های خانگی.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Delivery],
    isAbstract: false,
    position: 6,
    menu: SAMPLE_MENU,
  },
  {
    id: 7,
    title: 'نوشیدنی خنک',
    description: 'شیک‌ها، اسموتی‌ها و آب‌میوه‌های طبیعی.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Takeaway],
    isAbstract: false,
    position: 7,
    menu: SAMPLE_MENU,
  },
  {
    id: 8,
    title: 'غذای گیاهی',
    description: 'غذاهای مناسب گیاهخواران با مواد اولیه تازه.',
    status: Status.Active,
    orderTypes: [OrderType.DineIn, OrderType.Delivery],
    isAbstract: false,
    position: 8,
    menu: SAMPLE_MENU,
  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RootAppBarComponent, SectionComponent, CategoryListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  protected readonly sampleCategories = SAMPLE_CATEGORIES;
}

