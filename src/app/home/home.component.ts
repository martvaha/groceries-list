import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { User } from '../auth/auth.service';
import { Observable, Subscription } from 'rxjs';
import { LoadingService } from '../shared/loading-service';
import { delay } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { selectUser } from '../state/user/user.reducer';
import { clearState } from '../state/app.actions';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { getUser } from '../state/user/user.actions';
import { loadLists } from '../state/list/list.actions';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  public mobileQuery: MediaQueryList;
  public opened: boolean;
  public user: Observable<User | null | undefined>;

  private _mobileQueryListener: () => void;
  private _userChangeSubscription: Subscription;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private store: Store<State>,
    public loading: LoadingService,
    private icons: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    this.opened = !this.mobileQuery.matches;
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.user = this.store.select(selectUser);
    // this._userChangeSubscription = this.user.pipe(delay(0)).subscribe(() => this.changeDetectorRef.detectChanges());
    this.store.dispatch(getUser());
    this.store.dispatch(loadLists());
    this.icons.addSvgIcon('flogo', this.sanitizer.bypassSecurityTrustResourceUrl('../assets/flogo.svg'));
  }

  reload() {
    this.store.dispatch(clearState());
  }

  ngOnDestroy() {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    // this._userChangeSubscription.unsubscribe();
  }
}
