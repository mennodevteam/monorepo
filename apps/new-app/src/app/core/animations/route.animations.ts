import { animate, animateChild, group, query, style, transition, trigger } from '@angular/animations';
const coreQuery = query(
  ':enter, :leave',
  [
    style({
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      minHeight: '100%',
      opacity: 1,
      backgroundColor: 'var(--sys-background)',
    }),
  ],
  { optional: true },
);

const coreChilde = query('@*', [], { optional: true });

const coreLeaveTime = '300ms ease-out';
const coreEnterTime = '300ms ease-out';

const slideInFromLeft = [
  coreQuery,
  query(':enter', [style({ transform: 'translateX(-100%)' })], { optional: true }),
  query(':leave', [], { optional: true }),
  group([
    query(':leave', [animate(coreLeaveTime, style({ transform: 'translateX(100%)', opacity: 0 }))], {
      optional: true,
    }),
    query(':enter', [animate(coreEnterTime, style({ transform: 'translateX(0)' }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const slideOutToLeft = [
  coreQuery,
  query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], { optional: true }),
  query(':leave', [], { optional: true }),
  group([
    query(':leave', [animate(coreLeaveTime, style({ transform: 'translateX(-100%)' }))], {
      optional: true,
    }),
    query(':enter', [animate(coreEnterTime, style({ transform: 'translateX(0)', opacity: 1 }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const slideInFromRight = [
  coreQuery,
  query(':enter', [style({ transform: 'translateX(100%)' })], { optional: true }),
  query(':leave', [], { optional: true }),
  group([
    query(':leave', [animate(coreLeaveTime, style({ transform: 'translateX(-100%)', opacity: 0 }))], {
      optional: true,
    }),
    query(':enter', [animate(coreEnterTime, style({ transform: 'translateX(0)' }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const slideOutToRight = [
  coreQuery,
  query(':enter', [style({ transform: 'translateX(-100%)', opacity: 0 })], { optional: true }),
  query(':leave', [], { optional: true }),
  group([
    query(':leave', [animate(coreLeaveTime, style({ transform: 'translateX(100%)' }))], {
      optional: true,
    }),
    query(':enter', [animate(coreEnterTime, style({ transform: 'translateX(0)', opacity: 1 }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const slideInFromBottom = [
  coreQuery,
  query(':enter', [style({ transform: 'translateY(100%)' })], { optional: true }),
  group([
    query(':enter', [animate(coreEnterTime, style({ transform: 'translateY(0)' }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const slideOutToBottom = [
  coreQuery,
  query(':leave', [style({ zIndex: '100000' })], { optional: true }),
  group([
    query(':leave', [animate(coreLeaveTime, style({ transform: 'translateY(100%)' }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

const fadeInOut = [
  coreQuery,
  query(':enter', [style({ opacity: 0 })], { optional: true }),
  group([
    query(':leave', [animate(`300ms`, style({ opacity: 0 }))], {
      optional: true,
    }),
    query(':enter', [animate(`300ms 100ms`, style({ opacity: 1 }))], {
      optional: true,
    }),
    coreChilde,
  ]),
];

export const routeAnimations = trigger('routeAnimations', [
  transition('mainMenu => *', slideOutToLeft),
  transition('* => mainMenu', slideInFromLeft),
  transition('menu => productDetails', slideInFromRight),
  transition('productDetails => menu', slideOutToRight),
  transition('payment => cart', slideOutToRight),
  transition('cart => payment', slideOutToLeft),
  transition('* => cart', slideInFromRight),
  transition('cart => *', slideOutToRight),
  transition('welcome <=> menu', fadeInOut),
  transition('login => otp', slideInFromRight),
  transition('otp => login', slideOutToRight),
  transition('* => register', slideInFromRight),
  transition('register => *', slideOutToRight),
  transition('* => info', slideInFromRight),
  transition('info => *', slideOutToRight),
]);
