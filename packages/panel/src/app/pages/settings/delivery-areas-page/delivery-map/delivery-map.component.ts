import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DeliveryArea } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';
import { ShopService } from 'packages/panel/src/app/core/services/shop.service';

@Component({
  selector: 'app-delivery-map',
  templateUrl: './delivery-map.component.html',
  styleUrls: ['./delivery-map.component.scss'],
})
export class DeliveryMapComponent implements OnInit {
  @Input() deliveryAreas: DeliveryArea[];
  @Output() onAdd = new EventEmitter<[number, number][]>();
  @Output() onEdit = new EventEmitter<{ [key: number]: [number, number][] }>();

  options = {
    layers: [
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoom: 14,
    center:
      this.shop.latitude &&
      this.shop.latitude &&
      this.shop.longitude
        ? L.latLng(this.shop.latitude, this.shop.longitude)
        : L.latLng(36.274171699242515, 59.60280418395997),
  };
  drawItems: L.FeatureGroup = L.featureGroup();

  drawOptions: any = {
    position: 'topright',
    draw: {
      marker: false,
      polyline: false,
      circle: false,
      rectangle: false,
      circlemarker: false,
      polygon: {
        allowIntersection: false, // Restricts shapes to simple polygons
        drawError: {
          color: '#c62828', // Color the shape will turn when intersects
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

  constructor(private translate: TranslateService, private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop!;
  }

  ngOnInit(): void {
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

      L.drawLocal.edit.handlers.edit.tooltip.text = "drawLocal.edit.handlers.edit.tooltip.text";
      L.drawLocal.edit.handlers.edit.tooltip.subtext = "drawLocal.edit.handlers.edit.tooltip.subtext";

      L.drawLocal.edit.handlers.remove.tooltip.text = this.translate.instant('deliveryArea.removeTooltip');
      L.drawLocal.draw.handlers.polygon.tooltip = {
        cont: this.translate.instant('deliveryArea.drawPolygonTooltipCont'),
        start: this.translate.instant('deliveryArea.drawPolygonTooltipStart'),
        end: this.translate.instant('deliveryArea.drawPolygonTooltipEnd'),
      };
    }, 1000);

    for (const area of this.deliveryAreas) {
      const layer = L.polygon(<any>area.polygon);
      layer.bindTooltip(area.title);
      const x = this.drawItems.addLayer(layer);
    }
  }

  onDrawCreated(e: any) {
    const layer: any = (e as L.DrawEvents.Created).layer;
    this.onAdd.emit(layer.getLatLngs()[0].map((x: any) => [x.lat, x.lng]));
  }

  onDrawEdited(e: any) {
    const layers: any = (e as L.DrawEvents.Edited).layers.getLayers();
    console.log(layers);
    console.log();
    let res: any = {};
    for (const l of layers) {
      res[this.drawItems.getLayers().indexOf(l)] = l.getLatLngs()[0].map((x: any) => [x.lat, x.lng]);
    }
    this.onEdit.emit(res);
  }

  onDrawDeleted(e: any) {
    console.log(e);
    const layers: any = (e as L.DrawEvents.Edited).layers.getLayers();
    console.log(layers);
    console.log();
    let res: any = {};
    for (const l of layers) {
      res[this.drawItems.getLayers().indexOf(l)] = l.getLatLngs()[0].map((x: any) => [x.lat, x.lng]);
    }
    console.log(res);
  }
}
