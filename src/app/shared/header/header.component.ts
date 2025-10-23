import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isActive(path: string): boolean {
    const currentUrl = window.location.pathname;
    if (path === '/') return currentUrl === '/';
    return currentUrl.startsWith(path);
  }
}
