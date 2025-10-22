import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),

    // تكوين NgRx
    provideStore({
      router: routerReducer,
    }),
    provideEffects([]),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25, // يحتفظ بـ 25 إجراء آخر
      logOnly: false, // في production ضعه على true
      autoPause: true,
      trace: false,
      traceLimit: 75,
    }),
  ],
};
