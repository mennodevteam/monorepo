import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface LocalNotification {
  title?: string;
  contents?: string[];
  actions?: {
    text?: string;
    color?: string;
    icon?: string;
    tooltip?: string;
  }[],
  lifetime?: number;
  createdAt?: Date;
  soundIndex?: number;
  onAction?: Observable<number>;
  onClosed?: Promise<void>;
  disabled?: boolean;
  close?: () => void;
}

const SOUNDS = [
  'assets/sounds/notification_simple-01.ogg',
  'assets/sounds/notification_simple-02.ogg'
]

@Injectable({
  providedIn: 'root'
})
export class LocalNotificationsService {
  private _notifications: LocalNotification[] = [];
  private _notifications$ = new BehaviorSubject<LocalNotification[]>([]);
  private _prevSoundTime = [0, 0];
  private _onRemove = new Subject<LocalNotification>();
  private _onAction = new Subject<[LocalNotification, number]>();
  
  constructor() { }

  add(notif: LocalNotification): LocalNotification {
    this._notifications.push(notif);
    this._notifications$.next(this._notifications);
    if (!notif.createdAt) notif.createdAt = new Date();
    if (notif.soundIndex != undefined) this.playSound(notif.soundIndex);
    if (notif.lifetime) {
      setTimeout(() => {
        this.remove(notif);
      }, notif.lifetime);
    }
    notif.onAction = this._onAction.pipe(filter(x => x[0] === notif)).pipe(map(x => x[1]));
    notif.onClosed = this._onRemove.pipe(filter(x => x[0] === notif)).pipe(map(x => undefined)).toPromise();
    notif.close = () => {
      this.remove(notif);
    }
    return notif;
  }

  remove(notif: LocalNotification) {
    this._notifications.splice(this._notifications.indexOf(notif), 1);
    this._notifications$.next(this._notifications);
    this._onRemove.next(notif);
  }

  actionClick(notif: LocalNotification, action: number) {
    this._onAction.next([notif, action]);
  }

  private playSound(index: number) {
    if (this._prevSoundTime[index] + 5000 < Date.now()) {
      let audio = new Audio();
      audio.src = SOUNDS[index];
      audio.load();
      audio.play();
      this._prevSoundTime[index] = Date.now();
    }
  }

  get notifications(): Observable<LocalNotification[]> {
    return new Observable((fn) => this._notifications$.subscribe(fn));
  }
}
