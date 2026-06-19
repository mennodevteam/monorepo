export const FA_TO_ICONSAX_MAP: { [key: string]: string } = {
  // Common Category Icons
  'mug-hot': 'saxCoffeeOutline',
  'coffee': 'saxCoffeeOutline',
  'utensils': 'saxCupOutline',
  'hamburger': 'saxCupOutline',
  'pizza-slice': 'saxCupOutline',
  'burger': 'saxCupOutline',
  'sandwich': 'saxCupOutline',
  'hotdog': 'saxCupOutline',
  'dumbbell': 'saxActivityOutline',
  'gym': 'saxActivityOutline',
  'cookie': 'saxCakeOutline',
  'cake': 'saxCakeOutline',
  'gamepad': 'saxGameOutline',
  'game': 'saxGameOutline',
  'ice-cream': 'saxCupOutline',
  'leaf': 'saxAwardOutline',
  'seedling': 'saxAwardOutline',
  'apple-whole': 'saxCupOutline',
  'store': 'saxShopOutline',
  'shop': 'saxShopOutline',
  
  // Standard UI Icons
  'plus': 'saxAddOutline',
  'plus-circle': 'saxAddCircleOutline',
  'minus-circle': 'saxMinusCircleOutline',
  'trash': 'saxTrashOutline',
  'trash-alt': 'saxTrashOutline',
  'trash-can': 'saxTrashOutline',
  'edit': 'saxEditOutline',
  'edit-alt': 'saxEditOutline',
  'pen-to-square': 'saxEditOutline',
  'pencil': 'saxEditOutline',
  'pencil-alt': 'saxEditOutline',
  'arrow-left': 'saxArrowLeftOutline',
  'arrow-right': 'saxArrowRightOutline',
  'arrow-down': 'saxArrowDownOutline',
  'arrow-up': 'saxArrowUpOutline',
  'arrow-trend-up': 'saxTrendUpOutline',
  'badge-percent': 'saxDiscountShapeOutline',
  'circle-dollar': 'saxDiscountShapeOutline',
  'ban': 'saxForbiddenOutline',
  'bell': 'saxNotificationOutline',
  'box': 'saxBoxOutline',
  'box-check': 'saxBoxTickOutline',
  'box-open': 'saxBoxOutline',
  'calculator': 'saxCalculatorOutline',
  'calendar': 'saxCalendarOutline',
  'calendar-alt': 'saxCalendarOutline',
  'calendar-heart': 'saxCalendarOutline',
  'cart-shopping': 'saxShoppingCartOutline',
  'check': 'saxTickCircleOutline',
  'check-circle': 'saxTickCircleOutline',
  'circle': 'saxCloseCircleOutline',
  'circle-check': 'saxTickCircleOutline',
  'circle-exclamation': 'saxDangerOutline',
  'circle-info': 'saxInfoCircleOutline',
  'info-circle': 'saxInfoCircleOutline',
  'circle-plus': 'saxAddCircleOutline',
  'circle-xmark': 'saxCloseCircleOutline',
  'times-circle': 'saxCloseCircleOutline',
  'xmark-circle': 'saxCloseCircleOutline',
  'clock': 'saxClockOutline',
  'close': 'saxCloseCircleOutline',
  'xmark': 'saxCloseCircleOutline',
  'code': 'saxCodeOutline',
  'cog': 'saxSetting2Outline',
  'gear': 'saxSetting2Outline',
  'comments': 'saxMessageOutline',
  'copy': 'saxCopyOutline',
  'download': 'saxDocumentDownloadOutline',
  'ellipsis-vertical': 'saxMoreOutline',
  'exclamation-triangle': 'saxDangerOutline',
  'triangle-exclamation': 'saxDangerOutline',
  'warning': 'saxDangerOutline',
  'square-exclamation': 'saxDangerOutline',
  'eye': 'saxEyeOutline',
  'eye-slash': 'saxEyeSlashOutline',
  'file-code': 'saxDocumentCodeOutline',
  'file-csv': 'saxDocumentTextOutline',
  'file-export': 'saxDocumentUploadOutline',
  'file-lines': 'saxDocumentTextOutline',
  'flask': 'saxGlassOutline',
  'grip-vertical': 'saxRowVerticalOutline',
  'hourglass-half': 'saxTimerOutline',
  'key': 'saxKeyOutline',
  'link': 'saxLinkOutline',
  'location-dot': 'saxLocationOutline',
  'map-marker-alt': 'saxLocationOutline',
  'message': 'saxMessageOutline',
  'message-lines': 'saxMessageOutline',
  'sms': 'saxMessageOutline',
  'mobile-signal': 'saxCallOutline',
  'moped': 'saxTruckOutline',
  'motorcycle': 'saxTruckOutline',
  'truck-fast': 'saxTruckFastOutline',
  'palette': 'saxColorfilterOutline',
  'paper-plane-top': 'saxSendOutline',
  'print': 'saxPrinterOutline',
  'question': 'saxInfoCircleOutline',
  'receipt': 'saxReceipt2Outline',
  'robot': 'saxCpuOutline',
  'sliders': 'saxSetting5Outline',
  'sort': 'saxSortOutline',
  'sparkles': 'saxMagicpenOutline',
  'wand-magic-sparkles': 'saxMagicpenOutline',
  'spinner': 'saxRotateRightOutline',
  'spinner-third': 'saxRotateRightOutline',
  'star': 'saxStarOutline',
  'up-right-from-square': 'saxExportOutline',
  'upload': 'saxExportOutline',
  'user': 'saxUserOutline',
  'users': 'saxPeopleOutline',
  'wallet': 'saxWalletOutline',
  
  // Empty states / other custom legacy inputs
  'image': 'saxImageOutline',
  'layer-group': 'saxCategoryOutline',
  'folder-open': 'saxFolderOpenOutline',
  'folder': 'saxFolderOutline',
  'bullseye-arrow': 'saxAwardOutline',
};

export function mapFaIcon(faIcon: string | undefined): string {
  if (!faIcon) return 'saxBoxOutline';
  
  // Clean prefix if present
  let cleanName = faIcon.trim().toLowerCase();
  
  // Remove common prefixes
  const prefixes = ['fa-regular', 'fa-solid', 'fa-light', 'fa-thin', 'fa-duotone', 'fa-brands', 'fas', 'far', 'fal', 'fat', 'fad', 'fab'];
  prefixes.forEach(p => {
    if (cleanName.startsWith(p + ' ')) {
      cleanName = cleanName.substring(p.length + 1);
    }
  });
  
  if (cleanName.startsWith('fa-')) {
    cleanName = cleanName.substring(3);
  }
  
  const mapped = FA_TO_ICONSAX_MAP[cleanName];
  if (mapped) return mapped;
  
  // Fuzzy fallback check
  if (cleanName.includes('pizza') || cleanName.includes('burger') || cleanName.includes('food') || cleanName.includes('meat') || cleanName.includes('eat')) {
    return 'saxCupOutline';
  }
  if (cleanName.includes('coffee') || cleanName.includes('tea') || cleanName.includes('cafe') || cleanName.includes('drink')) {
    return 'saxCoffeeOutline';
  }
  if (cleanName.includes('trash')) {
    return 'saxTrashOutline';
  }
  if (cleanName.includes('edit') || cleanName.includes('pen')) {
    return 'saxEditOutline';
  }
  if (cleanName.includes('arrow')) {
    return 'saxArrowLeftOutline';
  }
  
  return 'saxBoxOutline'; // Default fallback
}
