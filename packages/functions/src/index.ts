import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { sendMail } from './utils/email.js';
import { CONFIG } from './config.js';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({ region: 'europe-west1' });

interface InviteData {
  to: string;
  listId: string;
  listName?: string;
  userName?: string;
}

// Firestore trigger for /invites collection
export const sendInviteEmail = onDocumentCreated(
  'invites/{inviteId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const inviteData = snapshot.data() as InviteData;
    console.log('New invite created:', inviteData);

    if (!inviteData?.to) {
      console.log('No recipient email provided');
      return;
    }

    try {
      await sendMail(
        {
          from: '"Groceries List" <info@groceries-list.com>',
          to: inviteData.to,
          subject: 'Sinuga jagati nimekirja',
        },
        'share',
        {
          userName: inviteData.userName || 'Keegi',
          listName: inviteData.listName || 'nimekiri',
          baseDomain: CONFIG.baseDomain,
          sharePath: 'share',
          shareToken: event.params.inviteId,
        }
      );
      console.log(`Invite email sent to ${inviteData.to}`);
    } catch (error) {
      console.error('Failed to send invite email:', error);
      throw error;
    }
  }
);
