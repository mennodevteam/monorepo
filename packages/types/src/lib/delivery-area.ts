import { Status } from './status.enum';
import { Shop } from './shop';

export class DeliveryArea {
  id: string;
  title: string;
  price: number;
  minOrderPrice?: number;
  minPriceForFree?: number;
  polygon: [number, number][];
  status: Status;
  shop: Shop;

  static isInWitchArea(areas: DeliveryArea[], point: [number, number]): DeliveryArea | null {
    try {
      areas.sort((a, b) => a.price - b.price);
      for (const area of areas) {
        if (DeliveryArea.isInside(point, area.polygon)) return area;
      }
    } catch (error) {}
    return null;
  }

  static isInside(point: [number, number], polygon: [number, number][]) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
    const x = point[0],
      y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];

      const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
