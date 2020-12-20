import { Injectable, NgZone } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { filter, map, mapTo, take, tap } from 'rxjs/operators';
import { selectUser } from '../state/user/user.reducer';

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private store: Store, private router: Router) {}

  canActivateChild = this.canActivate;

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // return true;

    return this.store.select(selectUser).pipe(
      tap((data) => console.log(data)),
      // mapTo(true)
      filter((user) => user !== undefined),
      take(1),
      map((user) => !!user?.uid)
    );
    // return this.store.select(selectUser).pipe(
    //   filter((user) => user !== undefined),
    //   map((user) => {
    //     const loggedIn = !!user?.uid;
    //     if (!loggedIn) this.ngZone.run(() => this.router.navigate(['home', 'login'])).then();
    //     return loggedIn;
    //   })
    // );
  }
}
