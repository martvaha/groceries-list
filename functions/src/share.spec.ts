const config = require('./test.json');

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as functionsTestFactory from 'firebase-functions-test';

const databaseURL = 'https://com-groceries-list.firebaseio.com';
const projectId = 'com-groceries-list';
const storageBucket = 'com-groceries-list.appspot.com';

const functionsTest = functionsTestFactory({
  databaseURL,
  storageBucket,
  projectId
});
import { sendEmail } from './share';
import { FeaturesList } from 'firebase-functions-test/lib/features';


afterAll(() => {
  // Do cleanup tasks.
  functionsTest.cleanup();
  // Reset the database.
  // admin
  //   .database()
  //   .ref('messages')
  //   .remove();
});

test('makeUpperCase', () => {
  // Test Case: setting messages/11111/original to 'input' should cause 'INPUT' to be written to
  // messages/11111/uppercase
});

test('should log input', () => {
  const test2 = require('./share');
  // [START assertOnline]
  // Create a DataSnapshot with the value 'input' and the reference path 'messages/11111/original'.

  // const snap = functionsTest.firestore.exampleDocumentSnapshot()
  const snap = functionsTest.firestore.makeDocumentSnapshot({ from: 'martvaha@gmail.com', to: 'martvaha@gmail.com' }, '/invites/1111');

  // Wrap the makeUppercase function
  const wrapped = functionsTest.wrap(test2.sendEmail);
  // Call the wrapped function with the snapshot you constructed.
  return wrapped(snap).then(async () => {
    // Read the value of the data at messages/11111/uppercase. Because `admin.initializeApp()` is
    // called in functions/index.js, there's already a Firebase app initialized. Otherwise, add
    // `admin.initializeApp()` before this line.
    admin.initializeApp();
    const firestore = admin.firestore();
    const data = await firestore.collection('invites').get();
    console.log(data.docs);
    return data;
  });
  // [END assertOnline]
});
