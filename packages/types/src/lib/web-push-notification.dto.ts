export interface WebPushNotificationOptions {
    dir?: 'ltr' | 'rtl';
    lang?: string;
    badge?: string;
    body?: string;
    tag?: string;
    icon?: string;
    image?: string;
    data?: any;
    vibrate?: any;
    renotify?: boolean;
    requireInteraction?: boolean;
    actions?: {
        action: string,
        title: string,
        icon: string,
    }[];
    silent?: boolean;
}

export class WebPushNotificationDto {
    title: string;
    options: NotificationOptions;
}
