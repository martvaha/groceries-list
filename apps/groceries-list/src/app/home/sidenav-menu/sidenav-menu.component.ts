import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
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
  @Input() user?: User | null;
  @Input() pinnedLists?: List[] | null;
  @Output() closeSidenav = new EventEmitter();
  version = environment.version;

  closeSidenavOnMobile() {
    this.closeSidenav.emit();
  }


}
