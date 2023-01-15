import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSidenav } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from '../auth/auth.service';
import { LoadingService } from '../shared/loading-service';
import { List } from '../shared/models';
import { TitleService } from '../shared/title.service';
import { State } from '../state/app.reducer';
import { loadLists } from '../state/list/list.actions';
import { selectAllLists } from '../state/list/list.reducer';
import { selectUser } from '../state/user/user.reducer';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('nav') sidenav?: MatSidenav;
  public mobileQuery!: MediaQueryList;
  public opened = true;
  public user$!: Observable<User | null | undefined>;
  public title$!: Observable<string>;
  public lists$!: Observable<List[]>;
  private mediaListener = () => this.toggleSidenav(this.shouldSidenavBeOpen());

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private store: Store<State>,
    public loading: LoadingService,
    private icons: MatIconRegistry,
    private sanitizer: DomSanitizer,
    private titleService: TitleService
  ) {
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

    this.lists$ = this.store.select(selectAllLists);
  }

  private shouldSidenavBeOpen() {
    return !this.mobileQuery.matches;
  }

  toggleSidenav(isOpen?: boolean) {
    this.opened = isOpen || !this.opened;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (typeof this.mobileQuery.removeEventListener === 'function') {
      this.mobileQuery.removeEventListener('change', this.mediaListener);
    }
    delete (this as any).mobileQuery;
  }
}
