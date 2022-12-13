import { trigger, transition, style, animate, state, query, animateChild } from '@angular/animations';

export function flyInOutFromRight(timing = '0.2s') {
    return trigger('flyInOutFromRight', [
        state('void', style({ transform: 'translateX(100%)' })),
        transition('void => *, * => void', [animate(`${timing}`)]),
    ]);
}

export function flyInFromRight(timing = '0.2s') {
    return trigger('flyInFromRight', [
        state('void', style({ transform: 'translateX(100%)' })),
        transition('void => *', [animate(`${timing}`)]),
    ]);
}

export function flyOutFromRight(timing = '0.2s') {
    return trigger('flyOutFromRight', [
        state('void', style({ transform: 'translateX(100%)' })),
        transition('* => void', [animate(`${timing}`)]),
    ]);
}



export function flyInOutFromLeft(timing = '0.2s') {
    return trigger('flyInOutFromLeft', [
        state('void', style({ transform: 'translateX(-100%)' })),
        transition('void => *, * => void', [animate(`${timing}`)]),
    ]);
}

export function flyInFromLeft(timing = '0.2s') {
    return trigger('flyInFromLeft', [
        state('void', style({ transform: 'translateX(-100%)' })),
        transition('void => *', [animate(`${timing}`)]),
    ]);
}

export function flyOutFromLeft(timing = '0.2s') {
    return trigger('flyOutFromLeft', [
        state('void', style({ transform: 'translateX(-100%)' })),
        transition('* => void', [animate(`${timing}`)]),
    ]);
}



export function flyInOutFromDown(timing = '0.2s') {
    return trigger('flyInOutFromDown', [
        state('void', style({ transform: 'translateY(100%)' })),
        transition('void => *, * => void', [animate(`${timing}`)]),
    ]);
}

export function flyInFromDown(timing = '0.2s') {
    return trigger('flyInFromDown', [
        state('void', style({ transform: 'translateY(100%)' })),
        transition('void => *', [animate(`${timing}`)]),
    ]);
}

export function flyOutFromDown(timing = '0.2s') {
    return trigger('flyOutFromDown', [
        state('void', style({ transform: 'translateY(100%)' })),
        transition('* => void', [animate(`${timing}`)]),
    ]);
}



export function flyInOutFromTop(timing = '0.2s') {
    return trigger('flyInOutFromTop', [
        state('void', style({ transform: 'translateY(-100%)' })),
        transition('void => *, * => void', [animate(`${timing}`)]),
    ]);
}

export function flyInFromTop(timing = '0.2s') {
    return trigger('flyInFromTop', [
        state('void', style({ transform: 'translateY(-100%)' })),
        transition('void => *', [animate(`${timing}`)]),
    ]);
}

export function flyOutFromTop(timing = '0.2s') {
    return trigger('flyOutFromTop', [
        state('void', style({ transform: 'translateY(-100%)' })),
        transition('* => void', [animate(`${timing}`)]),
    ]);
}
