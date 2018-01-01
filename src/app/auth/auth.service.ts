import { Injectable } from '@angular/core';
import { FirebaseNamespace } from '@firebase/app-types';
const firebase = require('firebase');
require('firebase/auth');

import { environment } from '../../environments/environment';
import { FirebaseAuth } from '@firebase/auth-types';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class AuthService {
  public firebase: FirebaseNamespace;
  public auth: FirebaseAuth;

  public user: Observable<any>;
  private _user: BehaviorSubject<any>;

  constructor() {
    this.firebase = firebase;
    this.firebase.initializeApp(environment.firebase);
    this.auth = this.firebase.auth();
    this.handleRedirect();
    this.registerAuthStateObserver();
    this._user = new BehaviorSubject(undefined);
    this.user = this._user.asObservable();
  }

  signInWithFacebook() {
    firebase.auth().useDeviceLanguage();
    const provider = new this.firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithRedirect(provider);
  }

  private registerAuthStateObserver() {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this._user.next({
          photoURL: user.photoURL,
          displayName: user.displayName,
          email: user.email
        });
      } else {
        this._user.next(undefined);
      }
    });
  }

  private handleRedirect() {
    this.firebase.auth().getRedirectResult().then(function (result) {
      if (result.credential) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        const token = result.credential.accessToken;
        console.log(token);
      }
      // The signed-in user info.
      const user = result.user;
    }).catch(function (error) {
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
