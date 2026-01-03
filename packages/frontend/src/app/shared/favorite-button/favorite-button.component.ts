import { Component, input } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-favorite-button',
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss'],
})
export class FavoriteButtonComponent {
  readonly favorite = input(false);
}
