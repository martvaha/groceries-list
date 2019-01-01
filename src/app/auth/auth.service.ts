import { Injectable } from '@angular/core';

import { FirebaseAuth, UserInfo, FacebookAuthProvider } from '@firebase/auth-types';
import { BehaviorSubject } from 'rxjs';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // public auth: FirebaseAuth;

  private _user = new BehaviorSubject<User | null | undefined>(undefined);
  public user = this._user.asObservable();

  constructor(private firebase: AngularFireAuth, private router: Router) {
    this.handleRedirect();
    this.registerAuthStateObserver();
  }

  async signInWithFacebook(redirect: string) {
    this.firebase.auth.useDeviceLanguage();
    const provider = new firebase.auth.FacebookAuthProvider();
    await this.firebase.auth.signInWithPopup(provider);
    return this.router.navigate([redirect]);
  }

  signOut() {
    return this.firebase.auth
      .signOut()
      .then(() => this._user.next(null))
      .catch(err => console.log);
  }

  private registerAuthStateObserver() {
    this.firebase.auth.onAuthStateChanged(data => {
      if (!data) return this._user.next(null);
      const uid = data.uid;
      const providerData = data.providerData[0];
      if (providerData) {
        const { displayName, photoURL, email } = providerData;
        // Update photo URL and display name when they change
        if (this.firebase.auth.currentUser && (data.photoURL != photoURL || data.displayName != displayName)) {
          this.firebase.auth.currentUser.updateProfile({ displayName, photoURL });
        }
        console.log(providerData);
        this._user.next({ uid, photoURL, displayName, email });
      } else {
        console.log('auth state change without data');
      }
    });
  }

  private handleRedirect() {
    this.firebase.auth
      .getRedirectResult()
      .then(function(result) {
        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          // const token = result.credential.accessToken;
        }
        // The signed-in user info.
        const user = result.user;
      })
      .catch(function(error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        const credential = error.credential;
      });
  }
}
