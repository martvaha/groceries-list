import { Injectable, PLATFORM_ID, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Auth, user, onAuthStateChanged, signInWithPopup, signOut, getRedirectResult, FacebookAuthProvider, GoogleAuthProvider, updateProfile, updateEmail, isSignInWithEmailLink, signInWithEmailLink, User as FirebaseUser } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { captureException } from '../shared/sentry';
import { distinctUntilChanged } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';
import { DialogService } from '../shared/dialog-service/dialog.service';
import { UserProfileService } from '../shared/user-profile.service';

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
  private router = inject(Router);
  private dialog = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  private userProfileService = inject(UserProfileService);

  private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  private auth: Auth = inject(Auth);
  private injector = inject(EnvironmentInjector);
  private lastProcessedUid: string | null = null;

  constructor() {
    if (isPlatformServer(this.platformId)) return;
    this.handleRedirect();
    this.completeEmailLinkSignIn();
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
                title: $localize`:@@auth.accountExistsTitle:Account already exists`,
                message: $localize`:@@auth.accountExistsMessage:Account with email ${error.customData?.email} already exists. Try logging in with ${otherProvider} instead.`,
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
        if (!user) {
          this.lastProcessedUid = null;
          return this.userSubject.next(null);
        }

        // Only emit if user data actually changed (Firebase Auth can re-emit with same data)
        const current = this.userSubject.getValue();
        const next = this.minimalUser(user);
        if (!this.usersEqual(current, next)) {
          this.userSubject.next(next);
        }

        // Only run profile sync once per user session to avoid loops
        if (this.lastProcessedUid === user.uid) return;
        this.lastProcessedUid = user.uid;

        const providerData = user.providerData?.[0];
        if (providerData) this.updateProfileFromProvider(user, providerData);
        // Ensure user profile exists in Firestore (for displaying names in shared lists)
        this.userProfileService.ensureProfile().catch((err) => {
          console.error('Failed to ensure user profile:', err);
        });
      });
    });
  }

  private usersEqual(a: User | null | undefined, b: User | null | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    // Use loose equality for optional fields to handle null vs undefined
    return a.uid === b.uid &&
      a.email == b.email &&
      a.displayName == b.displayName &&
      a.photoURL == b.photoURL;
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

  /**
   * Completes a passwordless email-link sign-in when the user returns from the
   * magic link. The invited email is read from the `inviteEmail` query param
   * (embedded server-side in the recipient's private link), falling back to
   * localStorage or a prompt. After signing in, the auth-related query params
   * are stripped so the app proceeds cleanly to the invite route.
   */
  private completeEmailLinkSignIn() {
    return runInInjectionContext(this.injector, async () => {
      const url = window.location.href;
      if (!isSignInWithEmailLink(this.auth, url)) return;

      const params = new URLSearchParams(window.location.search);
      let email =
        params.get('inviteEmail') || window.localStorage.getItem('emailForSignIn') || undefined;

      if (!email) {
        email =
          window.prompt($localize`:@@auth.confirmInviteEmail:Please confirm the email this invitation was sent to`) || undefined;
      }

      if (!email) return;

      try {
        await signInWithEmailLink(this.auth, email, url);
        window.localStorage.removeItem('emailForSignIn');
      } catch (error) {
        captureException(error as unknown as Error);
      } finally {
        this.stripAuthParamsFromUrl();
      }
    });
  }

  /**
   * Removes Firebase email-link and invite query params from the URL without
   * triggering a navigation, preserving the current route (e.g. the invite page).
   */
  private stripAuthParamsFromUrl() {
    const authParams = ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'inviteEmail'];
    const url = new URL(window.location.href);
    let changed = false;
    for (const param of authParams) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    if (changed) {
      const cleaned = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash;
      window.history.replaceState({}, '', cleaned);
    }
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
                title: $localize`:@@auth.accountExistsTitle:Account already exists`,
                message: $localize`:@@auth.accountExistsMessage:Account with email ${error.customData?.email} already exists. Try logging in with ${otherProvider} instead.`,
              },
            });
          } else {
            captureException(error as unknown as Error);
          }
        });
    });
  }
}
