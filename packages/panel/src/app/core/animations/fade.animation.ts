import { trigger, transition, style, animate, state, query, animateChild } from '@angular/animations';

export function fadeInOut(timing = '0.2s') {
    return trigger('fadeInOut', [
        state('void', style({ opacity: 0 })),
        transition('void => *, * => void', [animate(`${timing}`)]),
    ]);
}

export function fadeIn(timing = '0.2s') {
    return trigger('fadeIn', [
        state('void', style({ opacity: 0 })),
        transition('void => *', [animate(`${timing}`)]),
    ]);
}

export function fadeOut(timing = '0.2s') {
    return trigger('fadeOut', [
        state('void', style({ opacity: 0 })),
        transition('* => void', [animate(`${timing}`)]),
    ]);
}