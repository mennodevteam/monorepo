import { MenuStat } from '@menno/types';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import * as pd from 'persian-date';

@EventSubscriber()
export class MenuStatsSubscriber implements EntitySubscriberInterface<MenuStat> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return MenuStat;
  }

  /**
   * Populates Persian calendar date components from createdAt timestamp
   */
  private populatePersianDateFields(menuStat: MenuStat) {
    if (!menuStat.createdAt) return;

    // Convert to Tehran timezone and get Persian date
    const persianDate = new pd(new Date(menuStat.createdAt));

    // Format date as YYYY-MM-DD
    const year = persianDate.year();
    const month = String(persianDate.month()).padStart(2, '0');
    const day = String(persianDate.date()).padStart(2, '0');
    menuStat.createdAtLocalDate = `${year}-${month}-${day}`;

    // Format time as HH:mm:ss
    const hour = String(persianDate.hour()).padStart(2, '0');
    const minute = String(persianDate.minute()).padStart(2, '0');
    const second = String(persianDate.second()).padStart(2, '0');
    menuStat.createdAtLocalTime = `${hour}:${minute}:${second}`;

    menuStat.createdAtLocalDayOfWeek = persianDate.day();
  }

  async beforeInsert(event: InsertEvent<MenuStat>) {
    const menuStat = event.entity;
    // Populate Persian date fields
    this.populatePersianDateFields(menuStat);
  }

  async beforeUpdate(event: UpdateEvent<MenuStat>) {
    // If createdAt is being updated, recalculate Persian date fields
    if (event.entity.createdAt !== undefined) {
      this.populatePersianDateFields(event.entity as MenuStat);
    }
  }
}

