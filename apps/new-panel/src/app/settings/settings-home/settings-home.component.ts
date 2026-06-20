import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxShopOutline,
  saxColorfilterOutline,
  saxReceiptItemOutline,
  saxCpuOutline,
  saxSmsOutline,
  saxMapOutline,
  saxUserSquareOutline,
  saxComponentOutline,
  saxCodeOutline,
  saxArrowLeft2Outline,
  saxSetting2Outline,
  saxLinkOutline
} from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-settings-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SHARED,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    NgIcon
  ],
  providers: [
    provideIcons({
      saxShopOutline,
      saxColorfilterOutline,
      saxReceiptItemOutline,
      saxCpuOutline,
      saxSmsOutline,
      saxMapOutline,
      saxUserSquareOutline,
      saxComponentOutline,
      saxCodeOutline,
      saxArrowLeft2Outline,
      saxSetting2Outline,
      saxLinkOutline
    })
  ],
  templateUrl: './settings-home.component.html',
  styleUrl: './settings-home.component.scss'
})
export class SettingsHomeComponent {
  private readonly router = inject(Router);

  settingsItems = [
    {
      title: 'settings.shop',
      subtitle: 'تنظیم نام، توضیحات، آدرس، لوگو و اطلاعات تماس مجموعه',
      route: 'shop',
      icon: 'saxShopOutline',
      colorClass: 'blue'
    },
    {
      title: 'settings.domain',
      subtitle: 'تنظیم آدرس اینترنتی، ساب‌دامنه shottt.ir و اتصال دامنه اختصاصی',
      route: 'domain',
      icon: 'saxLinkOutline',
      colorClass: 'purple'
    },
    {
      title: 'settings.appConfig',
      subtitle: 'شخصی‌سازی ظاهر، تم رنگی دکمه‌ها و نحوه نمایش محصولات منو',
      route: 'app-config',
      icon: 'saxColorfilterOutline',
      colorClass: 'pink'
    },
    {
      title: 'settings.orderConfig',
      subtitle: 'تنظیمات ثبت سفارش، ساعت کاری، روش‌های پرداخت و مدیریت سفارش‌گیری',
      route: 'order-config',
      icon: 'saxReceiptItemOutline',
      colorClass: 'green'
    },
    {
      title: 'settings.aiChatbot',
      subtitle: 'پشتیبانی خودکار و پاسخ‌گویی به سوالات مشتریان با هوش مصنوعی در بله و اپلیکیشن',
      route: 'ai-chatbot',
      icon: 'saxCpuOutline',
      colorClass: 'ai',
      isAi: true
    },
    {
      title: 'settings.welcomeMessage',
      subtitle: 'نمایش پیام دلخواه یا راهنما در بدو ورود مشتریان به وب‌سایت',
      route: 'welcome-message',
      icon: 'saxSmsOutline',
      colorClass: 'purple'
    },
    {
      title: 'orderMessagesSetting.title',
      subtitle: 'تنظیم متن و زمان ارسال پیامک‌های اطلاع‌رسانی خودکار وضعیت سفارش به مشتری',
      route: 'sms',
      icon: 'saxSmsOutline',
      colorClass: 'orange'
    },
    {
      title: 'settings.deliveryAreas',
      subtitle: 'تعیین محدوده‌های پیک، هزینه ارسال سفارشات و حداقل مبلغ خرید هر محدوده',
      route: 'delivery-area',
      icon: 'saxMapOutline',
      colorClass: 'teal'
    },
    {
      title: 'settings.users',
      subtitle: 'تعریف پرسنل، مدیران و تعیین سطوح دسترسی مختلف برای بخش‌های پنل',
      route: 'users',
      icon: 'saxUserSquareOutline',
      colorClass: 'sky'
    },
    {
      title: 'settings.thirdParties',
      subtitle: 'اتصال درگاه‌های پرداخت آنلاین (زرین‌پال، زیبال، سیزپی) و سرویس‌های پیک (الوپیک)',
      route: 'third-parties',
      icon: 'saxComponentOutline',
      colorClass: 'gray'
    },
    {
      title: 'settings.webScripts',
      subtitle: 'افزودن کدهای اختصاصی مانند گوگل آنالیتیکس و ابزارهای رهگیری به وب‌سایت',
      route: 'web-scripts',
      icon: 'saxCodeOutline',
      colorClass: 'cyan'
    },
    {
      title: 'settings.developerApi',
      subtitle: 'دسترسی به کلید‌های توسعه‌دهندگان، مستندات API و تنظیمات پیشرفته',
      route: 'developer-api',
      icon: 'saxCodeOutline',
      colorClass: 'cyan'
    }
  ];

  navigateTo(route: string) {
    this.router.navigate(['/admin/settings', route]);
  }
}
