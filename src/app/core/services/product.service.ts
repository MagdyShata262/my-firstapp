import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout, retry, map } from 'rxjs/operators';
import { Product } from '../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = 'https://fakestoreapi.com';

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
        retry(2),
        catchError((error) =>
          this.handleError('Failed to load products', error)
        )
      );
  }

  // GET: Get a single product
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`).pipe(
      timeout(5000),
      retry(2),
      catchError((error) => this.handleError('Failed to load product', error))
    );
  }

  // GET: Get products by category
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${this.baseUrl}/products/category/${category}`)
      .pipe(
        timeout(10000),
        catchError((error) =>
          this.handleError('Failed to load products by category', error)
        )
      );
  }

  // GET: Get all categories
  getAllCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/products/categories`).pipe(
      timeout(5000),
      retry(2),
      catchError((error) =>
        this.handleError('Failed to load categories', error, [])
      )
    );
  }

  // POST: Add a new product
  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, product).pipe(
      timeout(5000),
      catchError((error) => this.handleError('Failed to add product', error))
    );
  }

  // PUT: Update a product
  updateProduct(id: number, product: Partial<Product>): Observable<Product> {
    return this.http
      .put<Product>(`${this.baseUrl}/products/${id}`, product)
      .pipe(
        timeout(5000),
        catchError((error) =>
          this.handleError('Failed to update product', error)
        )
      );
  }

  // DELETE: Delete a product
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`).pipe(
      timeout(5000),
      catchError((error) => this.handleError('Failed to delete product', error))
    );
  }

  // البحث في المنتجات (عميل)
  searchProducts(products: Product[], query: string): Product[] {
    if (!query.trim()) {
      return products;
    }

    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
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
  } {
    if (products.length === 0) {
      return {
        total: 0,
        categoriesCount: 0,
        averagePrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
      };
    }

    const categories = new Set(products.map((p) => p.category));
    const prices = products.map((p) => p.price);

    return {
      total: products.length,
      categoriesCount: categories.size,
      averagePrice:
        prices.reduce((sum, price) => sum + price, 0) / products.length,
      highestPrice: Math.max(...prices),
      lowestPrice: Math.min(...prices),
    };
  }

  // استخراج التصنيفات
  extractCategories(products: Product[]): string[] {
    const categories = products.map((p) => p.category);
    return [...new Set(categories)].sort();
  }

  // معالجة الأخطاء
  private handleError(
    message: string,
    error: any,
    fallbackValue?: any
  ): Observable<never> {
    console.error('ProductService Error:', error);

    let errorMessage = message;
    if (error instanceof HttpErrorResponse) {
      errorMessage += `: ${error.status} - ${error.message}`;
    } else if (error.name === 'TimeoutError') {
      errorMessage += ': Request timeout';
    }

    return throwError(() => new Error(errorMessage));
  }
}
