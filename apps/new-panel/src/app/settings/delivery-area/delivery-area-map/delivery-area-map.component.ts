import { Component, input, output, OnInit, inject, effect } from '@angular/core';
import { DeliveryArea } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../shop/shop.service';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { LeafletDrawModule } from '@asymmetrik/ngx-leaflet-draw';
import { SHARED } from '../../../shared';
import * as L from 'leaflet';

@Component({
  selector: 'app-delivery-area-map',
  standalone: true,
  imports: [
    SHARED,
    LeafletModule,
    LeafletDrawModule,
  ],
  templateUrl: './delivery-area-map.component.html',
  styleUrl: './delivery-area-map.component.scss',
})
export class DeliveryAreaMapComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly shopService = inject(ShopService);

  deliveryAreas = input<DeliveryArea[]>([]);
  isEmpty = input<boolean>(false);

  polygonCreated = output<[number, number][]>();
  polygonEdited = output<{ [key: number]: [number, number][] }>();
  polygonDeleted = output<{ [key: number]: [number, number][] }>();

  options: L.MapOptions;
  drawItems: L.FeatureGroup = L.featureGroup();
  drawOptions: any;

  ngOnInit(): void {
    this.initializeMap();
  }

  constructor() {
    // Watch for changes in delivery areas and update map
    effect(() => {
      const areas = this.deliveryAreas();
      if (areas) {
        setTimeout(() => this.updateMapLayers(), 100);
      }
    });
  }

  private initializeMap() {
    const shop = this.shopService.data();
    this.options = {
      layers: [
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
          maxZoom: 18, 
          attribution: '...' 
        }),
      ],
      zoom: 14,
      center: shop?.latitude && shop?.longitude
        ? L.latLng(shop.latitude, shop.longitude)
        : L.latLng(36.274171699242515, 59.60280418395997),
    };

    this.drawOptions = {
      position: 'topright',
      draw: {
        marker: false,
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#c62828',
            message: '',
          },
          shapeOptions: {
            color: '#1a237e',
          },
        },
      },
      edit: {
        featureGroup: this.drawItems,
      },
    };

    // Set up map translations
    setTimeout(() => {
      this.drawOptions.draw.polygon.drawError.message = this.translate.instant(
        'deliveryArea.drawPolygonErrorTooltip'
      );

      L.drawLocal.draw.toolbar.actions.text = this.translate.instant('app.cancel');
      L.drawLocal.draw.toolbar.actions.title = this.translate.instant('app.cancel');
      L.drawLocal.draw.toolbar.finish.title = this.translate.instant('app.save');
      L.drawLocal.draw.toolbar.finish.text = this.translate.instant('app.save');
      L.drawLocal.draw.toolbar.undo.title = this.translate.instant('deliveryArea.undo');
      L.drawLocal.draw.toolbar.undo.text = this.translate.instant('deliveryArea.undo');
      L.drawLocal.edit.toolbar.actions.save.text = this.translate.instant('app.save');
      L.drawLocal.edit.toolbar.actions.save.title = this.translate.instant('app.save');
      L.drawLocal.edit.toolbar.actions.cancel.text = this.translate.instant('app.cancel');
      L.drawLocal.edit.toolbar.actions.cancel.title = this.translate.instant('app.cancel');
      L.drawLocal.edit.toolbar.actions.clearAll.text = this.translate.instant('deliveryArea.clearAll');
      L.drawLocal.edit.toolbar.actions.clearAll.title = this.translate.instant('deliveryArea.clearAll');
      L.drawLocal.edit.handlers.remove.tooltip.text = this.translate.instant('deliveryArea.removeTooltip');
      L.drawLocal.draw.handlers.polygon.tooltip = {
        cont: this.translate.instant('deliveryArea.drawPolygonTooltipCont'),
        start: this.translate.instant('deliveryArea.drawPolygonTooltipStart'),
        end: this.translate.instant('deliveryArea.drawPolygonTooltipEnd'),
      };
    }, 1000);
  }

  onDrawCreated(e: any) {
    const layer: any = (e as L.DrawEvents.Created).layer;
    this.polygonCreated.emit(layer.getLatLngs()[0].map((x: any) => [x.lat, x.lng]));
  }

  onDrawEdited(e: any) {
    const layers: any = (e as L.DrawEvents.Edited).layers.getLayers();
    let res: any = {};
    for (const l of layers) {
      const index = this.drawItems.getLayers().indexOf(l);
      if (index >= 0 && this.deliveryAreas()[index]) {
        res[index] = l.getLatLngs()[0].map((x: any) => [x.lat, x.lng]);
      }
    }
    this.polygonEdited.emit(res);
  }

  onDrawDeleted(e: any) {
    const layers: any = (e as L.DrawEvents.Edited).layers.getLayers();
    let res: any = {};
    for (const l of layers) {
      const index = this.drawItems.getLayers().indexOf(l);
      if (index >= 0 && this.deliveryAreas()[index]) {
        res[index] = l.getLatLngs()[0].map((x: any) => [x.lat, x.lng]);
      }
    }
    this.polygonDeleted.emit(res);
  }

  private updateMapLayers() {
    this.drawItems.clearLayers();
    for (const area of this.deliveryAreas()) {
      if (area.polygon && area.polygon.length > 0) {
        const layer = L.polygon(area.polygon as any);
        layer.bindTooltip(area.title);
        this.drawItems.addLayer(layer);
      }
    }
  }
} 