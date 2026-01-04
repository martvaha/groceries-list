import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../environments/environment';
import { User } from '../../auth/auth.service';
import { List } from '../../shared/models';
import { FavoriteButtonComponent } from '../../shared/favorite-button/favorite-button.component';

@Component({
  standalone: true,
  imports: [RouterLink, MatListModule, MatDividerModule, FavoriteButtonComponent],
  selector: 'app-sidenav-menu',
  templateUrl: './sidenav-menu.component.html',
  styleUrls: ['./sidenav-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavMenuComponent {
  readonly user = input<User | null>();
  pinnedLists = input<List[] | null>();
  readonly closeSidenav = output();
  version = environment.version;

  closeSidenavOnMobile() {
    this.closeSidenav.emit();
  }
}
