// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  debug: true,
  firebase: {
    apiKey: 'AIzaSyDBbFnIp47jkWOjooqLPHSzWwpGl5lcbT0',
    authDomain: 'groceries-list-dev.firebaseapp.com',
    databaseURL: 'https://groceries-list-dev.firebaseio.com',
    projectId: 'groceries-list-dev',
    storageBucket: 'groceries-list-dev.appspot.com',
    messagingSenderId: '639630018107',
    appId: '1:639630018107:web:1b6abd03eac9a3dfbefe1e',
    measurementId: 'G-PV5T849VVX',
  },
  sentry: { dsn: '' },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error'; // Included with Angular CLI.
