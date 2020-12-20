import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import { Router } from '@angular/router';
import { captureException } from '../shared/sentry';
import { distinctUntilChanged } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';

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
  private test = new BehaviorSubject<User | null | undefined>(undefined);

  constructor(private fireAuth: AngularFireAuth, private router: Router, @Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformServer(this.platformId)) return;
    this.handleRedirect();
    this.registerAuthStateObserver();
  }

  signInWithFacebook(redirect?: string | string[]) {
    this.fireAuth.useDeviceLanguage();
    const provider = new firebase.auth.FacebookAuthProvider();
    return this.fireAuth.signInWithPopup(provider).then(() => {
      if (redirect) return this.redirect(redirect);
      return true;
    });
  }

  signOut(redirect?: string | string[]) {
    this.userSubject.next(null);
    if (redirect) {
      return this.redirect(redirect).then(() => this.fireAuth.signOut());
    } else {
      return this.fireAuth.signOut();
    }
  }

  getUser() {
    setTimeout(() => {
      this.test.next({
        displayName: 'Märt Vaha',
        email: 'martvaha@gmail.com',
        photoURL: 'https://graph.facebook.com/1498477000200703/picture',
        uid: '60QOc9NE97V5C7ZlLmN4LVre8eG2',
      });
    }, 2000);
    setTimeout(() => {
      this.test.next({
        displayName: 'Märt Vaha',
        email: 'martvaha@gmail.com',
        photoURL: 'https://graph.facebook.com/1498477000200703/picture',
        uid: '60QOc9NE97V5C7ZlLmN4LVre8eG2',
      });
    }, 1000);
    // return this.test.asObservable().pipe(distinctUntilChanged());
    return this.userSubject.asObservable().pipe();
  }

  private redirect(redirect: string | string[]) {
    const commands = typeof redirect === 'string' ? [redirect] : redirect;
    return this.router.navigate(commands);
  }

  private registerAuthStateObserver() {
    this.fireAuth.onAuthStateChanged((user) => {
      if (!user) return this.userSubject.next(null);
      const providerData = user.providerData?.[0];
      this.userSubject.next(this.minimalUser(user));
      if (providerData) this.updateProfileFromProvider(user, providerData);
    });
  }

  /**
   * Update photo URL and display name when they change
   * @param user
   * @param providerData
   */
  private updateProfileFromProvider(user: firebase.User, providerData: firebase.UserInfo) {
    const { displayName, photoURL, email } = providerData;
    if (user.photoURL !== photoURL || user.displayName !== displayName) {
      user.updateProfile({
        displayName,
        photoURL,
      });
    }
    if (email && user.email !== email) {
      user.updateEmail(email);
    }
  }

  private minimalUser(user: firebase.User): User {
    return {
      displayName: 'Märt Vaha',
      email: 'martvaha@gmail.com',
      photoURL: 'https://graph.facebook.com/1498477000200703/picture',
      uid: '60QOc9NE97V5C7ZlLmN4LVre8eG2',
    };
    const { uid, photoURL, displayName, email } = user;
    return {
      uid,
      photoURL,
      displayName,
      email,
    };
  }

  private handleRedirect() {
    this.fireAuth
      .getRedirectResult()
      .then(function (result) {
        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          // const token = result.credential.accessToken;
        }
        // The signed-in user info.
        const user = result.user;
      })
      .catch(function (error: { code: any; message: string; email: string; credential: string }) {
        captureException((error as unknown) as Error);
      });
  }
}
