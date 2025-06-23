import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss'
})
export class NotFoundPageComponent {
  public title = 'Page Not Found';
  public message = 'The page you are looking for does not exist.';

  constructor(private location: Location) {}

  public goBack(): void {
    this.location.back();
  }
}
