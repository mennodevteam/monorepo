import { trigger, transition, style, animate, state } from '@angular/animations';

export function slideInOut(timing = '0.2s') {
  return trigger('slideInOut', [
    state('void', style({ height: 0, overflow: 'hidden' })),
    transition('void => *, * => void', [animate(`${timing}`)]),
  ]);
}

export function slideIn(timing = '0.2s') {
  return trigger('slideIn', [
    state('void', style({ height: 0, overflow: 'hidden' })),
    transition('void => *', [animate(`${timing}`)]),
  ]);
}

export function slideOut(timing = '0.2s') {
  return trigger('slideOut', [
    state('void', style({ height: 0, overflow: 'hidden' })),
    transition('* => void', [animate(`${timing}`)]),
  ]);
}

export function slideInFromLeft(timing = '0.2s') {
  return trigger('slideInFromLeft', [
    state('void', style({ width: 0 })),
    transition('void => *', [animate(`${timing}`)]),
  ]);
}
