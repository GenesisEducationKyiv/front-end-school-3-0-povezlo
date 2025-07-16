import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header-widget.component.html',
  styleUrl: './header-widget.component.scss'
})
export class HeaderWidgetComponent {
  title = 'Music Library';
  isMenuOpen = false;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
