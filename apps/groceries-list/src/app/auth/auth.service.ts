import { Inject, Injectable, PLATFORM_ID, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Auth, user, onAuthStateChanged, signInWithPopup, signOut, getRedirectResult, FacebookAuthProvider, GoogleAuthProvider, updateProfile, updateEmail, User as FirebaseUser } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { captureException } from '../shared/sentry';
import { distinctUntilChanged } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';
import { DialogService } from '../shared/dialog-service/dialog.service';

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  private auth: Auth = inject(Auth);
  private injector = inject(EnvironmentInjector);

  constructor(
    private router: Router,
    private dialog: DialogService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    if (isPlatformServer(this.platformId)) return;
    this.handleRedirect();
    this.registerAuthStateObserver();
  }

  signInWithProvider(provider: 'facebook' | 'google', redirect?: string | string[]) {
    return runInInjectionContext(this.injector, () => {
      this.auth.useDeviceLanguage();
      const providerInstance =
        provider === 'facebook' ? new FacebookAuthProvider() : new GoogleAuthProvider();
      return signInWithPopup(this.auth, providerInstance)
        .then(() => {
          if (redirect) return this.redirect(redirect);
          return true;
        })
        .catch((error: any) => {
          if (error?.code === 'auth/account-exists-with-different-credential') {
            const otherProvider = error?.customData?._tokenResponse?.providerId === 'facebook.com' ? 'Google' : 'Facebook';
            this.dialog.info({
              data: {
                title: $localize`Account already exists`,
                message: $localize`Account with email ${error.customData?.email} already exists. Try logging in with ${otherProvider} instead.`,
              },
            });
          } else {
            captureException(error as unknown as Error);
          }
        });
    });
  }

  signOut(redirect?: string | string[]) {
    this.userSubject.next(null);
    return runInInjectionContext(this.injector, () => {
      if (redirect) {
        return this.redirect(redirect).then(() => signOut(this.auth));
      } else {
        return signOut(this.auth);
      }
    });
  }

  getUser() {
    return this.userSubject.asObservable().pipe(distinctUntilChanged());
  }

  private redirect(redirect: string | string[]) {
    const commands = typeof redirect === 'string' ? [redirect] : redirect;
    return this.router.navigate(commands);
  }

  private registerAuthStateObserver() {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        if (!user) return this.userSubject.next(null);
        const providerData = user.providerData?.[0];
        this.userSubject.next(this.minimalUser(user));
        if (providerData) this.updateProfileFromProvider(user, providerData);
      });
    });
  }

  /**
   * Update photo URL and display name when they change
   * @param user
   * @param providerData
   */
  private updateProfileFromProvider(user: FirebaseUser, providerData: any) {
    console.log('providerData', providerData, user);
    const { displayName, photoURL, email } = providerData;
    runInInjectionContext(this.injector, () => {
      if (user.photoURL !== photoURL || user.displayName !== displayName) {
        updateProfile(user, {
          displayName,
          photoURL,
        });
      }
      if (email && user.email !== email) {
        updateEmail(user, email);
      }
    });
  }

  private minimalUser(user: FirebaseUser): User {
    const { uid, photoURL, displayName, email } = user;
    return {
      uid,
      photoURL,
      displayName,
      email,
    };
  }

  private handleRedirect() {
    runInInjectionContext(this.injector, () => {
      getRedirectResult(this.auth)
        .then((result) => {
          if (!result) return;
          // The signed-in user info.
          const user = result.user;
        })
        .catch((error: any) => {
          if (error?.code === 'auth/account-exists-with-different-credential') {
            const otherProvider = error?.customData?._tokenResponse?.providerId === 'facebook.com' ? 'Google' : 'Facebook';
            this.dialog.info({
              data: {
                title: $localize`Account already exists`,
                message: $localize`Account with email ${error.customData?.email} already exists. Try logging in with ${otherProvider} instead.`,
              },
            });
          } else {
            captureException(error as unknown as Error);
          }
        });
    });
  }
}
