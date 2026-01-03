import { ChangeDetectionStrategy, Component, Input, output, input } from '@angular/core';
import { environment } from '../../../environments/environment';
import { User } from '../../auth/auth.service';
import { List } from '../../shared/models';

@Component({
  standalone: false,
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
