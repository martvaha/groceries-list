import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { AuthService, User } from '../auth/auth.service';
import { Observable, Subscription } from 'rxjs';
import { LoadingService } from '../shared/loading-service';
import { delay } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { State } from '../state/app.reducer';
import { selectUser } from '../state/user/user.reducer';
import { clearState } from '../state/app.actions';

@Component({
  selector: 'gl-home',
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
    public loading: LoadingService
  ) {}

  ngOnInit() {
    this.mobileQuery = this.media.matchMedia('(max-width: 600px)');
    this.opened = !this.mobileQuery.matches;
    this._mobileQueryListener = () => this.changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.user = this.store.select(selectUser);
    this._userChangeSubscription = this.user.pipe(delay(0)).subscribe(() => this.changeDetectorRef.detectChanges());
  }

  reload() {
    this.store.dispatch(clearState());
  }

  ngOnDestroy() {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    this._userChangeSubscription.unsubscribe();
  }
}
