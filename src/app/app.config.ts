import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routerReducer, provideRouterStore } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { routes } from './app.routes';
import { productsReducer } from './store/products.reducer';
import { ProductsEffects } from './store/products.effects';
import { cartReducer } from './store/cart-state/cart.reducer';
import { CartEffects } from './store/cart-state/cart.effects';
import { provideAnimations } from '@angular/platform-browser/animations';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch()),

    // ✅ NgRx Store
    provideStore({
      products: productsReducer,
      cart: cartReducer,
      router: routerReducer, // مفتاح "router" ضروري لـ Router Store
    }),

    // ✅ Effects
    provideEffects([ProductsEffects, CartEffects]),
    provideAnimations(),
    // ✅ Router Store (يجب أن يأتي بعد provideStore)
    provideRouterStore(),

    // ✅ DevTools
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
      autoPause: true,
      trace: false,
      traceLimit: 75,
      connectInZone: true,
    }),
  ],
};
