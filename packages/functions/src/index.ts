import admin from 'firebase-admin';
import crypto from 'crypto';
import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { sendMail } from './utils/email.js';
import { getConfig } from './config.js';

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all functions
// Enforce App Check for all callable functions to prevent abuse
setGlobalOptions({
  region: 'europe-north1',
  enforceAppCheck: true,
});

// Constants for validation
const MAX_ACL_SIZE = 50; // Maximum members per list
const MAX_INVITES_PER_BATCH = 10; // Maximum invites per request
const INVITE_EXPIRY_DAYS = 7; // Days until invite expires
const SOFT_DELETE_RETENTION_DAYS = 30; // Days to keep soft-deleted items
const SIGN_IN_LINK_THROTTLE_SECONDS = 60; // Minimum seconds between sign-in link emails per invite

interface InviteData {
  to: string;
  toEmailNormalized: string;
  listId: string;
  listName?: string;
  userName?: string;
  createdAt?: admin.firestore.Timestamp;
  expiresAt?: admin.firestore.Timestamp;
  lastLinkSentAt?: admin.firestore.Timestamp;
}

interface ListData {
  name: string;
  acl: string[];
  owner: string;
  modified?: admin.firestore.Timestamp;
}

interface MemberInfo {
  email: string;
  displayName?: string;
  photoURL?: string | null;
  joinedAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// Firestore trigger for /invites collection
export const sendInviteEmail = onDocumentCreated(
  {
    document: 'invites/{inviteId}',
  },
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

    const config = getConfig();

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
          baseDomain: config.baseDomain,
          sharePath: 'home/invite',
          shareToken: event.params.inviteId,
        },
      );
      console.log(`Invite email sent to ${inviteData.to}`);
    } catch (error) {
      console.error('Failed to send invite email:', error);
      throw error;
    }
  },
);

/**
 * Normalize email for consistent comparison.
 * Uses lowercase ASCII normalization to avoid Unicode inconsistencies.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Generate SHA-256 hash for deduplication lookup.
 * This is stored as a field, NOT used as the document ID.
 */
function generateInviteHash(listId: string, email: string): string {
  const normalized = `${listId}:${normalizeEmail(email)}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

interface CreateInviteRequest {
  listId: string;
  emails: string[];
}

interface CreateInviteResult {
  success: boolean;
  created: string[];
  alreadyInvited: string[];
  alreadyMembers: string[];
  failed: string[];
}

// Callable function to create invites (replaces direct Firestore writes)
export const createInvite = onCall(async (request): Promise<CreateInviteResult> => {
  const db = admin.firestore();

  // 1. Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to send invites');
  }

  const currentUserId = request.auth.uid;
  const currentUserEmail = request.auth.token.email;
  const currentUserName = request.auth.token.name || currentUserEmail;

  // 2. Validate request data
  const { listId, emails } = request.data as CreateInviteRequest;

  if (typeof listId !== 'string' || !listId) {
    throw new HttpsError('invalid-argument', 'listId is required');
  }

  if (!Array.isArray(emails) || emails.length === 0) {
    throw new HttpsError('invalid-argument', 'emails array is required and must not be empty');
  }

  if (emails.length > MAX_INVITES_PER_BATCH) {
    throw new HttpsError('invalid-argument', `Maximum ${MAX_INVITES_PER_BATCH} invites per request`);
  }

  // Validate all emails are strings and non-empty
  for (const email of emails) {
    if (typeof email !== 'string' || !email.trim()) {
      throw new HttpsError('invalid-argument', 'All emails must be non-empty strings');
    }
  }

  // 3. Get the list and verify permissions
  const listRef = db.collection('lists').doc(listId);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    throw new HttpsError('not-found', 'List not found');
  }

  const listData = listDoc.data() as ListData;

  if (!listData.acl.includes(currentUserId)) {
    throw new HttpsError('permission-denied', 'You do not have access to this list');
  }

  // 4. Process invites
  const results: CreateInviteResult = {
    success: true,
    created: [],
    alreadyInvited: [],
    alreadyMembers: [],
    failed: [],
  };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  for (const email of emails) {
    const normalizedEmail = normalizeEmail(email);

    // Skip self-invites
    if (currentUserEmail && normalizeEmail(currentUserEmail) === normalizedEmail) {
      results.failed.push(email);
      continue;
    }

    // Check if email belongs to existing member (by checking members subcollection)
    const membersSnapshot = await db
      .collection(`lists/${listId}/members`)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!membersSnapshot.empty) {
      results.alreadyMembers.push(email);
      continue;
    }

    // Check for existing pending invite using hash
    const inviteHash = generateInviteHash(listId, email);
    const existingInvite = await db.collection('invites').where('inviteHash', '==', inviteHash).limit(1).get();

    if (!existingInvite.empty) {
      results.alreadyInvited.push(email);
      continue;
    }

    try {
      // Create invite with random ID (secure, unpredictable)
      const inviteRef = db.collection('invites').doc();
      await inviteRef.set({
        listId,
        to: email,
        toEmailNormalized: normalizedEmail,
        inviteHash, // For deduplication queries
        listName: listData.name || '',
        userName: currentUserName || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      });

      results.created.push(email);
    } catch (error) {
      console.error(`Failed to create invite for ${email}:`, error);
      results.failed.push(email);
    }
  }

  console.log(`User ${currentUserId} created ${results.created.length} invites for list ${listId}`);

  return results;
});

// Public (unauthenticated) callable to fetch a minimal, non-PII preview of an
// invite so the acceptance page can show "X invited you to <list>" BEFORE the
// recipient signs in. Returns only listName + inviterName, never the invitee
// email. The inviteId is an unguessable random document id, so exposing this
// preview does not leak who was invited.
export const getInvitePreview = onCall(async (request) => {
  const db = admin.firestore();

  const { inviteId } = request.data as { inviteId: unknown };

  if (typeof inviteId !== 'string' || !inviteId) {
    throw new HttpsError('invalid-argument', 'inviteId is required and must be a string');
  }

  const inviteDoc = await db.collection('invites').doc(inviteId).get();

  if (!inviteDoc.exists) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  const inviteData = inviteDoc.data() as InviteData;

  // Treat expired invites as not found
  if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  return {
    listName: inviteData.listName ?? '',
    inviterName: inviteData.userName ?? '',
  };
});

// Public (unauthenticated) callable that emails a passwordless sign-in link to
// the address the invite was sent to. Because the recipient is fixed to
// invite.to on the server, the invitee can authenticate with the exact email
// the invite targets (eliminating the "wrong email" dead-end) and an attacker
// cannot redirect the link to a different address.
export const requestInviteSignInLink = onCall(async (request) => {
  const db = admin.firestore();

  const { inviteId } = request.data as { inviteId: unknown };

  if (typeof inviteId !== 'string' || !inviteId) {
    throw new HttpsError('invalid-argument', 'inviteId is required and must be a string');
  }

  const inviteRef = db.collection('invites').doc(inviteId);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  const inviteData = inviteDoc.data() as InviteData;

  // Treat expired invites as not found
  if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  // Lightweight throttle: avoid sending repeated link emails for the same invite
  if (inviteData.lastLinkSentAt) {
    const secondsSinceLast = (Date.now() - inviteData.lastLinkSentAt.toDate().getTime()) / 1000;
    if (secondsSinceLast < SIGN_IN_LINK_THROTTLE_SECONDS) {
      throw new HttpsError(
        'resource-exhausted',
        'A sign-in link was just sent. Please check your inbox or try again shortly.',
      );
    }
  }

  const config = getConfig();

  // Continue URL the user returns to after clicking the link. The inviteEmail
  // query param lets the client complete sign-in without re-prompting; it is
  // only ever present in the recipient's own private email.
  const continueUrl = `${config.baseDomain}/home/invite/${inviteId}?inviteEmail=${encodeURIComponent(
    inviteData.to,
  )}`;

  let signInLink: string;
  try {
    signInLink = await admin.auth().generateSignInWithEmailLink(inviteData.to, {
      url: continueUrl,
      handleCodeInApp: true,
    });
  } catch (error) {
    console.error('Failed to generate sign-in link:', error);
    throw new HttpsError('internal', 'Failed to generate sign-in link');
  }

  try {
    await sendMail(
      {
        from: '"Groceries List" <info@groceries-list.com>',
        to: inviteData.to,
        subject: 'Sinu sisselogimise link',
      },
      'signin-link',
      {
        userName: inviteData.userName || 'Keegi',
        listName: inviteData.listName || 'nimekiri',
        signInLink,
      },
    );
  } catch (error) {
    console.error('Failed to send sign-in link email:', error);
    throw new HttpsError('internal', 'Failed to send sign-in link email');
  }

  await inviteRef.update({
    lastLinkSentAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Sent sign-in link for invite ${inviteId}`);

  return { success: true };
});

// Callable function to fetch invite details for the acceptance page.
// Returns only non-PII fields and never exposes the invitee email. Access is
// restricted to the user the invite was addressed to.
export const getInvite = onCall(async (request) => {
  const db = admin.firestore();

  // 1. Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to view an invite');
  }

  const userEmail = request.auth.token.email;

  if (!userEmail) {
    throw new HttpsError('failed-precondition', 'User must have a verified email address');
  }

  // 2. Get inviteId from request data with type validation
  const { inviteId } = request.data as { inviteId: unknown };

  if (typeof inviteId !== 'string' || !inviteId) {
    throw new HttpsError('invalid-argument', 'inviteId is required and must be a string');
  }

  // 3. Load the invite document
  const inviteDoc = await db.collection('invites').doc(inviteId).get();

  if (!inviteDoc.exists) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  const inviteData = inviteDoc.data() as InviteData;

  // 4. Treat expired invites as not found
  if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  // 5. Only the addressed recipient may view the invite details.
  // Do not include the invitee email in the error to avoid exposing PII.
  if (normalizeEmail(inviteData.to) !== normalizeEmail(userEmail)) {
    throw new HttpsError(
      'permission-denied',
      'This invite was sent to a different email address. Please sign in with the correct account.',
    );
  }

  // 6. Return only non-PII fields (no email, no toEmailNormalized)
  return {
    listName: inviteData.listName ?? '',
    userName: inviteData.userName ?? '',
  };
});

// Callable function to accept an invite
export const acceptInvite = onCall(async (request) => {
  const db = admin.firestore();

  // 1. Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to accept an invite');
  }

  const userEmail = request.auth.token.email;
  const userId = request.auth.uid;
  const userName = request.auth.token.name;

  if (!userEmail) {
    throw new HttpsError('failed-precondition', 'User must have a verified email address');
  }

  // 2. Get inviteId from request data with type validation
  const { inviteId } = request.data as { inviteId: unknown };

  if (typeof inviteId !== 'string' || !inviteId) {
    throw new HttpsError('invalid-argument', 'inviteId is required and must be a string');
  }

  // 3. Get invite document first (outside transaction to validate early)
  const inviteRef = db.collection('invites').doc(inviteId);
  const inviteDoc = await inviteRef.get();

  if (!inviteDoc.exists) {
    throw new HttpsError('not-found', 'Invite not found or has already been used');
  }

  const inviteData = inviteDoc.data() as InviteData;

  // 4. Validate user email matches invite.to (case-insensitive using consistent normalization)
  if (normalizeEmail(inviteData.to) !== normalizeEmail(userEmail)) {
    throw new HttpsError(
      'permission-denied',
      'This invite was sent to a different email address. Please sign in with the correct account.',
    );
  }

  // 5. Check if invite has expired
  if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
    // Delete expired invite
    await inviteRef.delete();
    throw new HttpsError('deadline-exceeded', 'This invite has expired');
  }

  // Use a transaction to ensure atomic updates
  const result = await db.runTransaction(async (transaction) => {
    // 6. Get the list and verify it exists
    // NOTE: Firestore transactions require ALL reads to happen before ANY writes,
    // so the userProfiles read must be performed here, before updating the list.
    const listRef = db.collection('lists').doc(inviteData.listId);
    const userProfileRef = db.collection('userProfiles').doc(userId);
    const [listDoc, userProfileDoc] = await Promise.all([
      transaction.get(listRef),
      transaction.get(userProfileRef),
    ]);

    if (!listDoc.exists) {
      // Clean up orphaned invite (can't do in transaction, will do after)
      return { listExists: false };
    }

    const listData = listDoc.data();

    // 7. Check if user is already in the ACL
    if (listData?.acl?.includes(userId)) {
      // User already has access, just delete the invite
      transaction.delete(inviteRef);
      return {
        listExists: true,
        alreadyMember: true,
        listId: inviteData.listId,
      };
    }

    // 8. Check ACL size limit
    const currentAcl = listData?.acl || [];
    if (currentAcl.length >= MAX_ACL_SIZE) {
      throw new HttpsError('resource-exhausted', `This list has reached the maximum of ${MAX_ACL_SIZE} members`);
    }

    // 9. Add user to list's ACL
    const newAcl = [...currentAcl, userId];
    transaction.update(listRef, {
      acl: newAcl,
      modified: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 10. Store member info for display purposes
    // First try to get from userProfiles (single source of truth, read above), fall back to auth token
    const userProfileData = userProfileDoc.data() as UserProfile | undefined;

    const memberInfoRef = db.collection(`lists/${inviteData.listId}/members`).doc(userId);
    const memberInfo: MemberInfo = {
      email: userProfileData?.email || userEmail,
      displayName: userProfileData?.displayName || userName || undefined,
      photoURL: userProfileData?.photoURL || null,
      joinedAt: admin.firestore.Timestamp.now(),
    };
    transaction.set(memberInfoRef, memberInfo);

    // 10. Delete the invite document
    transaction.delete(inviteRef);

    return {
      listExists: true,
      alreadyMember: false,
      listId: inviteData.listId,
      listName: inviteData.listName,
    };
  });

  // Handle list not existing case (cleanup outside transaction)
  if (!result.listExists) {
    await inviteRef.delete();
    throw new HttpsError('not-found', 'The list no longer exists');
  }

  if (result.alreadyMember) {
    return {
      success: true,
      listId: result.listId,
      message: 'You already have access to this list',
    };
  }

  console.log(`User ${userId} (${userEmail}) accepted invite to list ${inviteData.listId}`);

  return {
    success: true,
    listId: result.listId,
    listName: result.listName,
  };
});

// Callable function to remove a member from a list
export const removeMember = onCall(async (request) => {
  const db = admin.firestore();

  // 1. Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const currentUserId = request.auth.uid;

  // 2. Validate request data with proper type checking
  const { listId, memberUid } = request.data as { listId: unknown; memberUid: unknown };

  if (typeof listId !== 'string' || typeof memberUid !== 'string') {
    throw new HttpsError('invalid-argument', 'listId and memberUid must be strings');
  }

  if (!listId || !memberUid) {
    throw new HttpsError('invalid-argument', 'listId and memberUid are required');
  }

  // Use a transaction to ensure atomic updates
  const result = await db.runTransaction(async (transaction) => {
    // 3. Get the list document
    const listRef = db.collection('lists').doc(listId);
    const listDoc = await transaction.get(listRef);

    if (!listDoc.exists) {
      throw new HttpsError('not-found', 'List not found');
    }

    const listData = listDoc.data() as ListData;
    const acl = listData.acl || [];
    const owner = listData.owner || acl[0]; // Fallback to first ACL member if no owner field

    // 4. Verify current user is in ACL
    if (!acl.includes(currentUserId)) {
      throw new HttpsError('permission-denied', 'You do not have access to this list');
    }

    // 5. Verify target member is in ACL
    if (!acl.includes(memberUid)) {
      throw new HttpsError('not-found', 'Member not found in list');
    }

    // 6. Authorization checks
    const isOwner = currentUserId === owner;
    const isRemovingSelf = currentUserId === memberUid;
    const isRemovingOwner = memberUid === owner;

    // Cannot remove the owner (owner must transfer ownership first)
    if (isRemovingOwner && !isRemovingSelf) {
      throw new HttpsError('permission-denied', 'Cannot remove the list owner');
    }

    // Only owner can remove other members, non-owners can only remove themselves
    if (!isOwner && !isRemovingSelf) {
      throw new HttpsError('permission-denied', 'Only the list owner can remove other members');
    }

    // Cannot remove yourself if you're the only member
    if (acl.length <= 1) {
      throw new HttpsError('failed-precondition', 'Cannot remove the last member. Delete the list instead.');
    }

    // 7. If owner is leaving, transfer ownership to next member
    let newOwner: string | null = null;
    if (isRemovingSelf && isOwner) {
      newOwner = acl.find((uid) => uid !== memberUid) || null;
      if (!newOwner) {
        throw new HttpsError('failed-precondition', 'Cannot transfer ownership - no other members');
      }
    }

    // 8. Build update data - compute new ACL manually for transaction
    const newAcl = acl.filter((uid) => uid !== memberUid);
    const updateData: Record<string, any> = {
      acl: newAcl,
      modified: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newOwner) {
      updateData.owner = newOwner;
    }

    transaction.update(listRef, updateData);

    // 9. Remove member info document
    const memberInfoRef = db.collection(`lists/${listId}/members`).doc(memberUid);
    transaction.delete(memberInfoRef);

    return {
      isRemovingSelf,
      newOwner,
    };
  });

  console.log(`User ${currentUserId} removed member ${memberUid} from list ${listId}`);

  return {
    success: true,
    removedSelf: result.isRemovingSelf,
    newOwner: result.newOwner,
  };
});

// Helper to delete documents in batches (max 500 per batch)
async function batchDelete(
  db: admin.firestore.Firestore,
  docs: admin.firestore.QueryDocumentSnapshot[],
): Promise<number> {
  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);

    for (const doc of chunk) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

// Scheduled cleanup of soft-deleted items, groups, and expired invites (runs daily at midnight)
export const scheduledCleanup = onSchedule(
  {
    schedule: '0 0 * * *',
    timeoutSeconds: 540, // 9 minutes max for cleanup
    memory: '512MiB',
    // Cloud Scheduler does not support europe-north1; keep this function in europe-west1
    region: 'europe-west1',
  },
  async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const retentionDate = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - SOFT_DELETE_RETENTION_DAYS * 24 * 60 * 60 * 1000),
    );

    console.log('Starting scheduled cleanup tasks');

    // Task 1: Clean up expired invites using paginated batched deletes
    let deletedInvitesCount = 0;
    try {
      const INVITE_PAGE_SIZE = 500;
      let lastDoc: admin.firestore.QueryDocumentSnapshot | null = null;

      while (true) {
        let expiredInvitesQuery = db.collection('invites').where('expiresAt', '<', now).limit(INVITE_PAGE_SIZE);

        if (lastDoc) {
          expiredInvitesQuery = expiredInvitesQuery.startAfter(lastDoc);
        }

        const expiredInvitesSnapshot = await expiredInvitesQuery.get();

        if (expiredInvitesSnapshot.empty) {
          break;
        }

        deletedInvitesCount += await batchDelete(db, expiredInvitesSnapshot.docs);
        lastDoc = expiredInvitesSnapshot.docs[expiredInvitesSnapshot.docs.length - 1];

        // Safety check to prevent infinite loops
        if (expiredInvitesSnapshot.docs.length < INVITE_PAGE_SIZE) {
          break;
        }
      }

      console.log(`Deleted ${deletedInvitesCount} expired invites`);
    } catch (error) {
      console.error('Failed to clean up expired invites:', error);
    }

    // Task 2: Clean up soft-deleted items and groups using paginated list fetching
    let deletedItemsCount = 0;
    let deletedGroupsCount = 0;

    const LISTS_PAGE_SIZE = 100;
    let lastListDoc: admin.firestore.QueryDocumentSnapshot | null = null;

    while (true) {
      let listsQuery = db.collection('lists').limit(LISTS_PAGE_SIZE);

      if (lastListDoc) {
        listsQuery = listsQuery.startAfter(lastListDoc);
      }

      const listsSnapshot = await listsQuery.get();

      if (listsSnapshot.empty) {
        break;
      }

      for (const listDoc of listsSnapshot.docs) {
        const listId = listDoc.id;

        try {
          // Delete old soft-deleted items
          const itemsQuery = db
            .collection(`lists/${listId}/items`)
            .where('deleted', '==', true)
            .where('modified', '<', retentionDate);

          const itemsSnapshot = await itemsQuery.get();
          deletedItemsCount += await batchDelete(db, itemsSnapshot.docs);

          // Delete old soft-deleted groups
          const groupsQuery = db
            .collection(`lists/${listId}/groups`)
            .where('deleted', '==', true)
            .where('modified', '<', retentionDate);

          const groupsSnapshot = await groupsQuery.get();
          deletedGroupsCount += await batchDelete(db, groupsSnapshot.docs);
        } catch (error) {
          console.error(`Failed to clean up list ${listId}:`, error);
        }
      }

      lastListDoc = listsSnapshot.docs[listsSnapshot.docs.length - 1];

      // Safety check to prevent infinite loops
      if (listsSnapshot.docs.length < LISTS_PAGE_SIZE) {
        break;
      }
    }

    console.log(
      `Cleanup complete. Deleted ${deletedItemsCount} items, ${deletedGroupsCount} groups, and ${deletedInvitesCount} invites.`,
    );
  },
);

/**
 * Callable function to ensure a user profile exists.
 * Called from frontend on login to create/update the profile.
 */
export const ensureUserProfile = onCall(async (request) => {
  const db = admin.firestore();

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { uid, token } = request.auth;
  const displayName = token.name || token.email || 'User';
  const email = token.email || '';
  const photoURL = token.picture || null;

  const profileRef = db.collection('userProfiles').doc(uid);
  const profileDoc = await profileRef.get();

  if (!profileDoc.exists) {
    // Create new profile
    await profileRef.set({
      displayName,
      email,
      photoURL,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Created user profile for ${uid}`);
    return { created: true };
  }

  // Profile exists, optionally update email/photo if changed from provider
  const existingData = profileDoc.data() as UserProfile;
  const updates: Record<string, any> = {};

  if (email && existingData.email !== email) {
    updates.email = email;
  }
  if (photoURL && existingData.photoURL !== photoURL) {
    updates.photoURL = photoURL;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await profileRef.update(updates);
    console.log(`Updated user profile for ${uid}`);
  }

  return { created: false };
});

/**
 * Firestore trigger: When a user profile is updated, sync to all lists where they're a member.
 */
export const syncProfileToMembers = onDocumentWritten(
  {
    document: 'userProfiles/{uid}',
  },
  async (event) => {
    const uid = event.params.uid;
    const newData = event.data?.after?.data() as UserProfile | undefined;

    if (!newData) {
      // Profile was deleted, nothing to sync
      console.log(`User profile ${uid} was deleted, skipping sync`);
      return;
    }

    const { displayName, email, photoURL } = newData;
    const db = admin.firestore();

    // Find all lists where user is a member
    const listsSnapshot = await db.collection('lists').where('acl', 'array-contains', uid).get();

    if (listsSnapshot.empty) {
      console.log(`User ${uid} is not a member of any lists, skipping sync`);
      return;
    }

    // Batch update all member documents (max 500 per batch)
    const BATCH_SIZE = 500;
    const docs = listsSnapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = docs.slice(i, i + BATCH_SIZE);

      for (const listDoc of chunk) {
        const memberRef = db.collection(`lists/${listDoc.id}/members`).doc(uid);
        batch.set(
          memberRef,
          {
            email,
            displayName,
            photoURL: photoURL || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ); // merge to preserve joinedAt
      }

      await batch.commit();
    }

    console.log(`Synced profile for user ${uid} to ${docs.length} lists`);
  },
);

/**
 * Firestore trigger: When a list is created, add the creator as a member.
 */
export const onListCreated = onDocumentCreated(
  {
    document: 'lists/{listId}',
  },
  async (event) => {
    const listId = event.params.listId;
    const listData = event.data?.data() as ListData | undefined;

    if (!listData?.acl?.length) {
      console.log(`List ${listId} has no ACL, skipping member creation`);
      return;
    }

    const creatorUid = listData.owner || listData.acl[0];
    const db = admin.firestore();

    // Get creator's profile (if it exists)
    const profileDoc = await db.collection('userProfiles').doc(creatorUid).get();
    const profileData = profileDoc.data() as UserProfile | undefined;

    // Create member document for the creator
    const memberRef = db.collection(`lists/${listId}/members`).doc(creatorUid);
    await memberRef.set({
      email: profileData?.email || '',
      displayName: profileData?.displayName || null,
      photoURL: profileData?.photoURL || null,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Created member document for list creator ${creatorUid} in list ${listId}`);
  },
);

/**
 * One-time migration callable function to backfill:
 * 1. User profiles for all existing Firebase Auth users
 * 2. Member documents for all list ACL members who don't have one
 *
 * This should be called once after deploying the new profile system.
 * It's idempotent and safe to run multiple times.
 */
export const migrateProfiles = onCall(
  {
    timeoutSeconds: 540, // 9 minutes max
    memory: '512MiB',
  },
  async (request) => {
    // Only allow authenticated admin users
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be authenticated');
    }

    // Authorize: must have the `admin` custom claim OR be in the ADMIN_UIDS allowlist
    const isAdminClaim = request.auth.token.admin === true;
    const isAllowlistedUid = getConfig().adminUids.includes(request.auth.uid);
    if (!isAdminClaim && !isAllowlistedUid) {
      throw new HttpsError('permission-denied', 'Only administrators can run this migration');
    }

    const db = admin.firestore();
    const auth = admin.auth();

    let usersCreated = 0;
    let membersCreated = 0;
    let errors: string[] = [];

    // Phase 1: Create user profiles for all Firebase Auth users
    console.log('Phase 1: Creating user profiles...');
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);

      const batch = db.batch();
      for (const userRecord of listUsersResult.users) {
        const profileRef = db.collection('userProfiles').doc(userRecord.uid);

        batch.set(
          profileRef,
          {
            displayName: userRecord.displayName || userRecord.email || 'User',
            email: userRecord.email || '',
            photoURL: userRecord.photoURL || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        usersCreated++;
      }

      await batch.commit();
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`Created/updated ${usersCreated} user profiles`);

    // Phase 2: Backfill missing member documents
    console.log('Phase 2: Backfilling member documents...');
    const LISTS_PAGE_SIZE = 100;
    let lastListDoc: admin.firestore.QueryDocumentSnapshot | null = null;

    while (true) {
      let listsQuery = db.collection('lists').limit(LISTS_PAGE_SIZE);

      if (lastListDoc) {
        listsQuery = listsQuery.startAfter(lastListDoc);
      }

      const listsSnapshot = await listsQuery.get();

      if (listsSnapshot.empty) {
        break;
      }

      for (const listDoc of listsSnapshot.docs) {
        const listData = listDoc.data() as ListData;
        const acl = listData.acl || [];

        for (const uid of acl) {
          try {
            const memberRef = db.collection(`lists/${listDoc.id}/members`).doc(uid);
            const memberDoc = await memberRef.get();

            if (!memberDoc.exists) {
              // Get from userProfiles
              const profileDoc = await db.collection('userProfiles').doc(uid).get();
              const profileData = profileDoc.data() as UserProfile | undefined;

              await memberRef.set({
                email: profileData?.email || '',
                displayName: profileData?.displayName || null,
                photoURL: profileData?.photoURL || null,
                joinedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              membersCreated++;
            }
          } catch (err: any) {
            errors.push(`Failed to create member ${uid} in list ${listDoc.id}: ${err.message}`);
          }
        }
      }

      lastListDoc = listsSnapshot.docs[listsSnapshot.docs.length - 1];

      if (listsSnapshot.docs.length < LISTS_PAGE_SIZE) {
        break;
      }
    }

    console.log(`Created ${membersCreated} member documents`);
    console.log(`Migration complete with ${errors.length} errors`);

    return {
      success: true,
      usersCreated,
      membersCreated,
      errors: errors.slice(0, 100), // Limit error output
    };
  },
);
