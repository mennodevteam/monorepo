import { trigger, transition, style, animate, state } from '@angular/animations';

export function bounceInOut(timing = '0.2s') {
  return trigger('bounceInOut', [
    state('void', style({ opacity: 0, transform: 'scale(0)' })),
    transition('void => *, * => void', [animate(`${timing}`)]),
  ]);
}

export function bounceIn(timing = '0.2s') {
  return trigger('bounceIn', [
    state('void', style({ opacity: 0, transform: 'scale(0)' })),
    transition('void => *', [animate(`${timing}`)]),
  ]);
}

export function bounceOut(timing = '0.2s') {
  return trigger('bounceOut', [
    state('void', style({ opacity: 0, transform: 'scale(0)' })),
    transition('* => void', [animate(`${timing}`)]),
  ]);
}
