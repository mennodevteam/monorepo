import { Status } from './status.enum';
import { Shop } from './shop';
import { Region } from './region';

export class DeliveryArea {
  id: string;
  title: string;
  price: number;
  percentagePrice?: number;
  minOrderPrice?: number;
  minPriceForFree?: number;
  isPost: boolean;
  label?: string;
  polygon?: [number, number][];
  region?: Region;
  state?: string;
  status: Status;
  shop: Shop;

  static isInWitchArea(
    areas: DeliveryArea[],
    point?: [number, number],
    region?: Region,
  ): DeliveryArea | null {
    if (point) {
      for (const area of areas) {
        if (area.status !== Status.Active) continue;
        if (area.polygon && DeliveryArea.isInside(point, area.polygon)) return area;
      }
    } else if (region) {
      const allCountryDeliveryArea = areas.find((area) => area.region === null && area.state === null);
      let area = areas.find((x) => x.status === Status.Active && x.region?.id === region.id);
      if (!area) area = areas.find((x) => x.status === Status.Active && x.state === region.state);
      if (!area && allCountryDeliveryArea) area = allCountryDeliveryArea;
      return area || null;
    }
    return null;
  }

  static sampleArea(area?: DeliveryArea) {
    if (area?.polygon?.length) {
      const lats = area.polygon.map((x) => x[0]);
      const longs = area.polygon.map((x) => x[1]);
      const res = (Math.max(...lats) - Math.min(...lats)) * (Math.max(...longs) - Math.min(...longs));
      return res;
    }
    return 9999999;
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
