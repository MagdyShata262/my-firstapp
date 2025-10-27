// src/app/animations/route-animations.ts
import {
  trigger,
  animate,
  transition,
  style,
  query,
  group,
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          opacity: 1,
        }),
      ],
      { optional: true }
    ),

    query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], {
      optional: true,
    }),

    group([
      query(
        ':leave',
        [
          animate(
            '400ms ease-in',
            style({ transform: 'translateX(-100%)', opacity: 0 })
          ),
        ],
        { optional: true }
      ),
      query(
        ':enter',
        [
          animate(
            '400ms ease-out',
            style({ transform: 'translateX(0)', opacity: 1 })
          ),
        ],
        { optional: true }
      ),
    ]),
  ]),
]);
