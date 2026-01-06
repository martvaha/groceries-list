import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, viewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MediaMatcher } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconRegistry, MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../auth/auth.service';
import { LoadingService } from '../shared/loading-service';
import { State } from '../state/app.reducer';
import { selectUser } from '../state/user/user.reducer';
import { loadLists, toggleFavorite } from '../state/list/list.actions';
import { TitleService } from '../shared/title.service';
import { selectFavoriteLists } from '../state/list/list.reducer';
import { List } from '../shared/models';
import { UserAvatarComponent } from '../user/user-avatar/user-avatar.component';
import { SidenavMenuComponent } from './sidenav-menu/sidenav-menu.component';

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    UserAvatarComponent,
    SidenavMenuComponent,
  ],
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private changeDetectorRef = inject(ChangeDetectorRef);
  private media = inject(MediaMatcher);
  private store = inject<Store<State>>(Store);
  loading = inject(LoadingService);
  private icons = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private titleService = inject(TitleService);

  readonly sidenav = viewChild<MatSidenav>('nav');
  public mobileQuery!: MediaQueryList;
  public opened = true;
  public user$!: Observable<User | null | undefined>;
  public title$!: Observable<string>;
  public lists$!: Observable<List[]>;
  private mediaListener = () => this.toggleSidenav(this.shouldSidenavBeOpen());

  constructor() {
    this.icons.addSvgIcon('flogo', this.sanitizer.bypassSecurityTrustResourceUrl('assets/flogo.svg'));
  }

  ngOnInit() {
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    if (typeof this.mobileQuery.addEventListener === 'function') {
      this.mobileQuery.addEventListener('change', this.mediaListener);
    } else if (typeof this.mobileQuery.addListener === 'function') {
      this.mobileQuery.addListener(this.mediaListener);
    }
    this.opened = this.shouldSidenavBeOpen();
    this.user$ = this.store.select(selectUser);
    this.store.dispatch(loadLists());
    this.title$ = this.titleService.title$;

    this.lists$ = this.store.select(selectFavoriteLists);
  }

  onUnfavorite(list: List) {
    this.store.dispatch(toggleFavorite({ listId: list.id, isFavorite: true }));
  }

  private shouldSidenavBeOpen() {
    return !this.mobileQuery.matches;
  }

  toggleSidenav(isOpen?: boolean) {
    this.opened = isOpen || !this.opened;
    this.changeDetectorRef.markForCheck();
  }

  ngOnDestroy() {
    if (typeof this.mobileQuery.removeEventListener === 'function') {
      this.mobileQuery.removeEventListener('change', this.mediaListener);
    }
    delete (this as any).mobileQuery;
  }
}
