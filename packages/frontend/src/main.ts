import { bootstrapApplication } from '@angular/platform-browser';
import { enableProdMode } from '@angular/core';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

function disableConsole() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
}

if (environment.production) {
  disableConsole();
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
