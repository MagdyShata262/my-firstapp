import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
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
