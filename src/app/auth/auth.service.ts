import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { FirebaseAuth, UserInfo } from '@firebase/auth-types';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

export interface User {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

@Injectable()
export class AuthService {
  // public auth: FirebaseAuth;

  private _user = new BehaviorSubject<User | null>(null);
  public user = this._user.asObservable();

  constructor(private firebase: AngularFireAuth) {
    this.handleRedirect();
    this.registerAuthStateObserver();
  }

  signInWithFacebook() {
    this.firebase.auth.useDeviceLanguage();
    const provider = new firebase.auth.FacebookAuthProvider();
    this.firebase.auth.signInWithPopup(provider);
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
        this._user.next({ uid, photoURL, displayName, email });
      } else {
      }
    });
  }

  private handleRedirect() {
    this.firebase.auth
      .getRedirectResult()
      .then(function(result) {
        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          const token = result.credential.accessToken;
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
