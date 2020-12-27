import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { User } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { LoadingService } from '../shared/loading-service';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { selectUser } from '../state/user/user.reducer';
import { clearState } from '../state/app.actions';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { loadLists } from '../state/list/list.actions';
import { MatSidenav } from '@angular/material/sidenav';
import { TitleService } from '../shared/title.service';

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
    this.icons.addSvgIcon('flogo', this.sanitizer.bypassSecurityTrustResourceUrl('../assets/flogo.svg'));
  }

  ngOnInit() {
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    this.mobileQuery.addEventListener('change', this.mediaListener);
    this.opened = this.shouldSidenavBeOpen();
    this.user$ = this.store.select(selectUser);
    this.store.dispatch(loadLists());
    this.title$ = this.titleService.title$;
  }

  private shouldSidenavBeOpen() {
    return !this.mobileQuery.matches;
  }

  toggleSidenav(isOpen?: boolean) {
    this.opened = isOpen || !this.opened;
    this.changeDetectorRef.detectChanges();
  }

  reload() {
    this.store.dispatch(clearState());
  }

  ngOnDestroy() {
    this.mobileQuery.removeEventListener('change', this.mediaListener);
    delete (this as any).mobileQuery;
  }
}
