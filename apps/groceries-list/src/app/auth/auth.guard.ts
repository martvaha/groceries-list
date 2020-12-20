import { Injectable, NgZone } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { selectUser } from '../state/user/user.reducer';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private store: Store,
    private router: Router,
    private ngZone: NgZone
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.store.select(selectUser).pipe(
      filter((user) => user !== undefined),
      map((user) => {
        const loggedIn = !!user?.uid;
        if (!loggedIn)
          this.ngZone.run(() => this.router.navigate(['home', 'login'])).then();
        return loggedIn;
      })
    );
  }

  canActivateChild = this.canActivate;
}
