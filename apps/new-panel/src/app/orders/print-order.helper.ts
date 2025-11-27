import { Order, Shop, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

export function printOrder(
  order: Order,
  shop: Shop,
  translate: TranslateService,
  type: 'customer' | 'shop' = 'customer',
) {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const title = translate.instant('app.title');
  const count = translate.instant('app.count');
  const price = translate.instant('app.price');
  const total = translate.instant('app.total');
  const dateLabel = translate.instant('app.date');
  const timeLabel = translate.instant('app.time');
  const customerLabel = translate.instant('order.customer');
  const rowLabel = translate.instant('app.index');
  const shopTitle = shop.title || '';
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('fa-IR');
  const timeStr = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const customerName = order.customer ? User.fullName(order.customer) : '';
  const customerPhone = order.customer?.mobilePhone || '';
  const address = order.address ? order.address.description : '';
  const logoUrl = shop.logo ? `${environment.bucketUrl}/${shop.logo}` : '';

  let rowCounter = 0;
  const itemsHtml = order.items
    .filter((item) => type === 'customer' || !item.isAbstract)
    .map((item) => {
      if (item.isAbstract) {
        return `
        <tr>
          <td></td>
          <td colspan="${type === 'shop' ? 1 : 3}" style="text-align: right;">${item.title}</td>
          ${type === 'shop' ? '' : `<td>${item.price.toLocaleString()}</td>`}
        </tr>
      `;
      } else {
        rowCounter++;
        return `
        <tr>
          <td>${rowCounter}</td>
          <td style="text-align: right;">${item.title}</td>
          <td>${item.quantity}</td>
          ${
            type === 'shop'
              ? ''
              : `<td>${item.price.toLocaleString()}</td>
          <td>${(item.quantity * item.price).toLocaleString()}</td>`
          }
        </tr>
      `;
      }
    })
    .join('');

  const totalQuantity = order.items
    .filter((i) => !i.isAbstract)
    .reduce((sum, item) => sum + item.quantity, 0);

  printWindow.document.write(`
    <html>
      <head>
        <title>${customerName} - ${dateStr}</title>
        <base href="${window.location.origin}/">
        <style>
          @font-face {
            font-family: 'IRANSans';
            font-style: normal;
            font-weight: normal;
            src: url('fonts/iransans/woff2/IRANSansWeb(FaNum).woff2') format('woff2');
          }
          body { font-family: 'IRANSans', sans-serif; padding: 40px; direction: rtl; font-size: ${type === 'shop' ? '16px' : '12px'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: ${type === 'shop' ? '14px' : '11px'}; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: center; }
          th { background-color: #f2f2f2; }
          .header { margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border-bottom: 2px solid #000; padding-bottom: 15px; }
          .shop-info { display: flex; align-items: center; gap: 15px; }
          .shop-text { display: flex; flex-direction: column; align-items: flex-start; }
          .header img { max-height: 60px; border-radius: 10px; }
          .header h1 { margin: 0; font-size: 20px; }
          .shop-desc { margin: 5px 0 0 0; font-size: 12px; color: #555; }
          .date-section { font-size: 12px; color: #333; display: flex; flex-direction: column; align-items: flex-end; }
          .customer-info { margin-bottom: 20px; padding-bottom: 10px; }
          .customer-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
          .customer-info p { margin: 5px 0; }
          .total-row td { font-weight: bold; background-color: #f9f9f9; }
          @media print {
            @page { size: letter; margin: 1in; }
            body { padding: 0; }
            .header { margin-bottom: 10px; }
            .customer-info { margin-bottom: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-info">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo">` : ''}
            <div class="shop-text">
              <h1>${shopTitle}</h1>
              ${shop.description ? `<p class="shop-desc">${shop.description}</p>` : ''}
            </div>
          </div>
          <div class="date-section">
            <span>${dateLabel}: ${dateStr}</span>
            <span>${timeLabel}: ${timeStr}</span>
          </div>
        </div>
        
        <div class="customer-info">
          <div class="customer-row">
            <span>${customerLabel}: ${customerName} - ${customerPhone}</span>
          </div>
          ${address ? `<p>${translate.instant('shop.addressSection')}: ${order.address?.region?.title ? `${order.address.region.title} - ` : ''}${address}${order.address?.unit ? ` - ${translate.instant('address.unit')}: ${order.address.unit}` : ''}${order.address?.ring ? ` - ${translate.instant('address.ring')}: ${order.address.ring}` : ''}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>${rowLabel}</th>
              <th>${title}</th>
              <th>${count}${type === 'shop' ? ` (${totalQuantity})` : ''}</th>
              ${type === 'shop' ? '' : `<th>${price}</th><th>${total}</th>`}
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            ${
              type === 'shop'
                ? ''
                : `<tr class="total-row">
              <td colspan="4" style="text-align: left;">${total}</td>
              <td>${order.totalPrice.toLocaleString()}</td>
            </tr>`
            }
          </tbody>
        </table>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
