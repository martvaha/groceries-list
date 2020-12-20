import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../auth/auth.service';

@Component({
  selector: 'app-sidenav-menu',
  templateUrl: './sidenav-menu.component.html',
  styleUrls: ['./sidenav-menu.component.scss'],
})
export class SidenavMenuComponent {
  @Input() user?: User | null;
  @Output() closeSidenav = new EventEmitter();

  closeSidenavOnMobile() {
    this.closeSidenav.emit();
  }
}
