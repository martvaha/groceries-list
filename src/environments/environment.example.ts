// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: '******',
    authDomain: 'com-groceries-list.firebaseapp.com',
    databaseURL: 'https://com-groceries-list.firebaseio.com',
    projectId: 'com-groceries-list',
    storageBucket: 'com-groceries-list.appspot.com',
    messagingSenderId: '*******'
  }
};
