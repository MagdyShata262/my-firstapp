import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, switchMap, of, catchError } from 'rxjs';
import { Product } from '../../../shared/models';
import * as ProductsActions from '../../../store/products.actions';
import * as ProductsSelectors from '../../../store/products.selectors';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);

  // Signals
  productId = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Observables from store
  product$: Observable<Product | null> = this.store.select(
    ProductsSelectors.selectSelectedProduct
  );
  loading$: Observable<boolean> = this.store.select(
    ProductsSelectors.selectLoading
  );
  error$: Observable<string | null> = this.store.select(
    ProductsSelectors.selectError
  );

  ngOnInit() {
    // اشترك في معلمة المسار (id)
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          if (!id || isNaN(id)) {
            this.router.navigate(['/products']);
            return of(null);
          }

          this.productId.set(id);
          this.store.dispatch(ProductsActions.loadProduct({ id }));
          return of(id);
        })
      )
      .subscribe();
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  // دوال مساعدة للنجوم (يمكن تحسينها لاحقًا)
  getStars(
    rating: number
  ): { type: 'full' | 'half' | 'empty'; index: number }[] {
    const stars: { type: 'full' | 'half' | 'empty'; index: number }[] = [];
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < full; i++) stars.push({ type: 'full', index: i });
    if (hasHalf) stars.push({ type: 'half', index: full });
    while (stars.length < 5) stars.push({ type: 'empty', index: stars.length });

    return stars.slice(0, 5);
  }

  getStarClass(type: 'full' | 'half' | 'empty'): string {
    return type === 'empty' ? 'text-gray-300' : 'text-yellow-400';
  }

  getStarIcon(type: 'full' | 'half' | 'empty'): string {
    return type === 'full' ? '★' : type === 'half' ? '½' : '☆';
  }
}
