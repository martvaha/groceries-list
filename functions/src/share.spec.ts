import functionsTestFactory from 'firebase-functions-test';
require('dotenv').config();
require('leaked-handles');

const databaseURL = 'https://com-groceries-list.firebaseio.com';
const projectId = 'com-groceries-list';
const storageBucket = 'com-groceries-list.appspot.com';

const functionsTest = functionsTestFactory({
  databaseURL,
  storageBucket,
  projectId,
});
import { sendEmail } from './share';

afterAll(() => {
  // Do cleanup tasks.
  functionsTest.cleanup();
  // Reset the database.
  // admin
  //   .database()
  //   .ref('messages')
  //   .remove();
});

test('should send out email', async () => {
  // [START assertOnline]
  // Create a DataSnapshot with the value 'input' and the reference path 'messages/11111/original'.

  // const snap = functionsTest.firestore.exampleDocumentSnapshot()
  const snap = functionsTest.firestore.makeDocumentSnapshot(
    { from: 'martvaha@gmail.com', to: 'martvaha@gmail.com' },
    '/invites/1111'
  );

  // Wrap the makeUppercase function
  const wrappedSendEmail = functionsTest.wrap(sendEmail);
  try {
    const result = await wrappedSendEmail(snap);
    expect(result).toEqual(true);
  } catch (e) {
    expect(e).not.toBeInstanceOf(Error);
  }
  // Call the wrapped function with the snapshot you constructed.
  // return wrappedSendEmail(snap).then(async (data2: any) => {
  //   console.log(data2);
  //   const firestore = admin.firestore();
  //   const data = await firestore.collection("invites").get();
  //   data.docs.map(d => d.data()).map(d => console.log(d));
  //   return data;
  // });
  // [END assertOnline]
});
