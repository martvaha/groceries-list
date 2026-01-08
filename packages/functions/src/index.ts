import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
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

// Scheduled cleanup of soft-deleted items and groups (runs daily at midnight)
// Note: Can add more cleanup tasks here to share the scheduler
export const cleanupDeletedItems = onSchedule('0 0 * * *', async () => {
  const db = admin.firestore();
  const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  console.log('Starting cleanup of soft-deleted items older than 30 days');

  // Get all lists
  const listsSnapshot = await db.collection('lists').get();
  let deletedItemsCount = 0;
  let deletedGroupsCount = 0;

  for (const listDoc of listsSnapshot.docs) {
    const listId = listDoc.id;

    // Delete old soft-deleted items
    const itemsQuery = db
      .collection(`lists/${listId}/items`)
      .where('deleted', '==', true)
      .where('modified', '<', thirtyDaysAgo);

    const itemsSnapshot = await itemsQuery.get();
    for (const itemDoc of itemsSnapshot.docs) {
      await itemDoc.ref.delete();
      deletedItemsCount++;
    }

    // Delete old soft-deleted groups
    const groupsQuery = db
      .collection(`lists/${listId}/groups`)
      .where('deleted', '==', true)
      .where('modified', '<', thirtyDaysAgo);

    const groupsSnapshot = await groupsQuery.get();
    for (const groupDoc of groupsSnapshot.docs) {
      await groupDoc.ref.delete();
      deletedGroupsCount++;
    }
  }

  console.log(`Cleanup complete. Deleted ${deletedItemsCount} items and ${deletedGroupsCount} groups.`);
});
