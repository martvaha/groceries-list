import { Injectable } from '@angular/core';
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

  private userSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public user = this.userSubject.asObservable();

  constructor(private fireAuth: AngularFireAuth, private router: Router) {
    this.handleRedirect();
    this.registerAuthStateObserver();
  }

  async signInWithFacebook(redirect: string) {
    this.fireAuth.auth.useDeviceLanguage();
    const provider = new firebase.auth.FacebookAuthProvider();
    await this.fireAuth.auth.signInWithPopup(provider);
    return this.router.navigate([redirect]);
  }

  signOut() {
    return this.fireAuth.auth
      .signOut()
      .then(() => this.userSubject.next(null))
      .catch(err => console.log(err));
  }

  private registerAuthStateObserver() {
    this.fireAuth.auth.onAuthStateChanged(data => {
      if (!data) return this.userSubject.next(null);
      const uid = data.uid;
      const providerData = data.providerData[0];
      if (providerData) {
        const { displayName, photoURL, email } = providerData;
        // Update photo URL and display name when they change
        if (this.fireAuth.auth.currentUser && (data.photoURL !== photoURL || data.displayName !== displayName)) {
          this.fireAuth.auth.currentUser.updateProfile({ displayName, photoURL });
        }
        console.log(providerData);
        this.userSubject.next({ uid, photoURL, displayName, email });
      } else {
        console.log('auth state change without data');
      }
    });
  }

  private handleRedirect() {
    this.fireAuth.auth
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
