import { VERSION } from './version';

export const environment = {
  version: VERSION,
  appName: $localize`:app name|:Groceries List`,
  production: true,
  debug: false,
  firebase: {
    apiKey: 'AIzaSyAKJAL4vtSCHSU1jdJvMdi4LxBExIELPjs',
    authDomain: 'groceries-list-production.firebaseapp.com',
    databaseURL: 'https://groceries-list-production.firebaseio.com',
    projectId: 'groceries-list-production',
    storageBucket: 'groceries-list-production.appspot.com',
    messagingSenderId: '58050804164',
    appId: '1:58050804164:web:e12ddc51729e4482a48c91',
    measurementId: 'G-RYTGXQRWJ1',
  },
  sentry: { dsn: 'https://e0ad91b3a5b944eba7624b3fc20a56d5@sentry.io/1508217' },
  mockUser: null
};
