import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of, timer } from 'rxjs';
import { catchError, timeout, retry, map, delay } from 'rxjs/operators';
import { Product } from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = 'https://fakestoreapi.com'; // ✅ تم إصلاح المسافات الزائدة

  // GET: Get all products
  getAllProducts(limit?: number): Observable<Product[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http
      .get<Product[]>(`${this.baseUrl}/products`, { params })
      .pipe(
        timeout(10000),
        retry({
          count: 2,
          delay: (error, retryCount) => timer(retryCount * 1000),
        }),
        catchError((error) =>
          this.handleError('Failed to load products', error, [])
        )
      );
  }

  // GET: Get a single product
  getProductById(id: number): Observable<Product> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    return this.http.get<Product>(`${this.baseUrl}/products/${id}`).pipe(
      timeout(5000),
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000),
      }),
      catchError((error) => this.handleError('Failed to load product', error))
    );
  }

  // GET: Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    if (!category.trim()) {
      return throwError(() => new Error('Category is required'));
    }

    return this.http
      .get<Product[]>(`${this.baseUrl}/products/category/${category}`)
      .pipe(
        timeout(10000),
        retry({
          count: 2,
          delay: (error, retryCount) => timer(retryCount * 1000),
        }),
        catchError((error) =>
          this.handleError('Failed to load products by category', error, [])
        )
      );
  }

  // GET: Get all categories
  getAllCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/products/categories`).pipe(
      timeout(5000),
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000),
      }),
      catchError((error) =>
        this.handleError('Failed to load categories', error, [])
      )
    );
  }

  // POST: Add a new product (⚠️ Not supported in free tier)
  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    if (!this.isValidProduct(product)) {
      return throwError(() => new Error('Invalid product data'));
    }

    console.warn(
      '⚠️ Note: FakeStoreAPI free tier does not support adding products.'
    );

    return this.http.post<Product>(`${this.baseUrl}/products`, product).pipe(
      timeout(5000),
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000),
      }),
      catchError((error) => {
        const msg =
          '❌ Failed to add product. FakeStoreAPI free tier does not support POST /products.';
        console.error(msg, error);
        return throwError(() => new Error(msg));
      })
    );
  }

  // PUT: Update a product (⚠️ Not supported in free tier)
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    console.warn(
      '⚠️ Note: FakeStoreAPI free tier does not support updating products.'
    );

    return this.http
      .put<Product>(`${this.baseUrl}/products/${id}`, product)
      .pipe(
        timeout(5000),
        retry({
          count: 2,
          delay: (error, retryCount) => timer(retryCount * 1000),
        }),
        catchError((error) =>
          this.handleError('Failed to update product', error)
        )
      );
  }

  // DELETE: Delete a product (⚠️ Not supported in free tier)
  deleteProduct(id: number): Observable<Product> {
    // ✅ تغيير النوع إلى Product
    if (!id || id <= 0) {
      return throwError(() => new Error('Invalid product ID'));
    }

    console.warn(
      '⚠️ Note: FakeStoreAPI free tier does not support deleting products.'
    );

    return this.http.delete<Product>(`${this.baseUrl}/products/${id}`).pipe(
      timeout(5000),
      retry({
        count: 2,
        delay: (error, retryCount) => timer(retryCount * 1000),
      }),
      catchError((error) => this.handleError('Failed to delete product', error))
    );
  }

  // ⚠️ إزالة patchProduct لأنها غير مستخدمة في FakeStoreAPI

  // البحث في المنتجات (عميل)
  searchProducts(products: Product[], query: string): Product[] {
    if (!query.trim()) {
      return products;
    }

    const searchTerm = query.toLowerCase();
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
  }

  // ترتيب المنتجات (عميل)
  sortProducts(
    products: Product[],
    sortBy: keyof Product,
    ascending: boolean = true
  ): Product[] {
    return [...products].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue == null || bValue == null) return 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return ascending
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return ascending ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }

  // الحصول على إحصائيات
  getProductStats(products: Product[]): {
    total: number;
    categoriesCount: number;
    averagePrice: number;
    highestPrice: number;
    lowestPrice: number;
    totalValue: number;
  } {
    if (products.length === 0) {
      return {
        total: 0,
        categoriesCount: 0,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        totalValue: 0,
      };
    }

    const categories = new Set(products.map((p) => p.category));
    const prices = products.map((p) => p.price);
    const totalValue = prices.reduce((sum, price) => sum + price, 0);

    return {
      total: products.length,
      categoriesCount: categories.size,
      averagePrice: Number((totalValue / products.length).toFixed(2)),
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
      totalValue: Number(totalValue.toFixed(2)),
    };
  }

  // استخراج التصنيفات
  extractCategories(products: Product[]): string[] {
    const categories = products.map((p) => p.category);
    return [...new Set(categories)].sort();
  }

  // التحقق من صحة بيانات المنتج
  private isValidProduct(product: Omit<Product, 'id'>): boolean {
    return !!(
      product.title?.trim() &&
      product.description?.trim() &&
      product.category?.trim() &&
      product.image?.trim() &&
      product.price > 0
    );
  }

  // معالجة الأخطاء محسنة
  private handleError(
    message: string,
    error: any,
    fallbackValue?: any
  ): Observable<any> {
    console.error('ProductService Error:', error);

    let errorMessage = message;

    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 0:
          errorMessage += ': Network error - Please check your connection';
          break;
        case 404:
          errorMessage += ': Resource not found';
          break;
        case 500:
          errorMessage += ': Server error - Please try again later';
          break;
        default:
          errorMessage += `: ${error.status} - ${error.message}`;
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage += ': Request timeout - Please try again';
    } else {
      errorMessage += `: ${error.message || 'Unknown error'}`;
    }

    // إذا كان هناك قيمة بديلة، ارجعها بدلاً من خطأ
    if (fallbackValue !== undefined) {
      console.warn('Returning fallback value due to error:', errorMessage);
      return of(fallbackValue);
    }

    return throwError(() => new Error(errorMessage));
  }
}
