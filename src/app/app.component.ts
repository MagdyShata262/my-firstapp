import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { ProductsListComponent } from './features/products/products-list/products-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProductsListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'my-firstapp';
  constructor(private store: Store) {
    // يمكنك الآن استخدام Store هنا
    console.log('NgRx Store جاهز للاستخدام!');
  }
}
