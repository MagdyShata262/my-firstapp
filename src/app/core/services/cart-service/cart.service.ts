import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { CartResponse } from '../../../shared/models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor() {}

  private http = inject(HttpClient);
  private baseUrl = 'https://fakestoreapi.com';

  // GET: Get all carts
  getAllCarts(): Observable<CartResponse[]> {
    return this.http.get<CartResponse[]>(`${this.baseUrl}/carts`);
  }

  // GET: Get cart by user ID
  getCartByUserId(userId: number): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.baseUrl}/carts/user/${userId}`);
  }

  // POST: Add a new cart
  addCart(cart: Omit<CartResponse, 'id'>): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.baseUrl}/carts`, cart);
  }

  // PUT: Update a cart
  updateCart(
    id: number,
    cart: Partial<CartResponse>
  ): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.baseUrl}/carts/${id}`, cart);
  }

  // DELETE: Delete a cart
  deleteCart(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/carts/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
