console.log('MAIN.TS STARTING');
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

function disableConsole() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
}

if (environment.production) {
  disableConsole();
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
