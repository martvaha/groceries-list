import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import firebase from 'firebase/app';

// Angular Material dependency
import 'hammerjs';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  if (window) {
    window.console.log = function() {};
  }
}

if (!environment.production && environment.debug) {
  firebase.firestore.setLogLevel('debug');
}

document.addEventListener('DOMContentLoaded', () => {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.log(err));
});
