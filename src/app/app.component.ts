import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { State } from './state/app.reducer';
import { getUser } from './state/user/user.actions';
import { loadLists } from './state/list/list.actions';

@Component({
  selector: 'gl-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'Groceries List';

  constructor(private icons: MatIconRegistry, private sanitizer: DomSanitizer, private store: Store<State>) {
    this.store.dispatch(getUser());
    this.store.dispatch(loadLists());
    this.icons.addSvgIcon('flogo', this.sanitizer.bypassSecurityTrustResourceUrl('../assets/flogo.svg'));
  }
}
