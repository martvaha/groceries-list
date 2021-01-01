import { VERSION } from './version';

export const environment = {
  version: VERSION,
  production: true,
  debug: false,
  firebase: {
    apiKey: 'AIzaSyDJNkBvd-XMmPPOhxOiyEMt9b5X9_TTLKU',
    authDomain: 'com-groceries-list.firebaseapp.com',
    databaseURL: 'https://com-groceries-list.firebaseio.com',
    projectId: 'com-groceries-list',
    storageBucket: 'com-groceries-list.appspot.com',
    messagingSenderId: '1093945067476',
    appId: '1:1093945067476:web:7b84eafb5883bee8',
  },
  sentry: { dsn: 'https://e0ad91b3a5b944eba7624b3fc20a56d5@sentry.io/1508217' },
};
