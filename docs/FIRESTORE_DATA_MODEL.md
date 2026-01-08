# Firestore Data Model

This document describes the Firestore database structure for the Groceries List application.

## Collection Structure

```
├── users/{uid}                     # User profiles
├── lists/{listId}                  # Shopping lists
│   ├── items/{itemId}              # Items in the list (subcollection)
│   └── groups/{groupId}            # Categories/groups (subcollection)
└── invites/{inviteId}              # List sharing invitations
```

## Collections

### users

Stores user profile information.

**Path:** `/users/{uid}`

| Field | Type | Description |
|-------|------|-------------|
| (custom fields) | - | User-specific metadata |

**Access:** Users can only read/write their own document.

---

### lists

Stores shopping list documents.

**Path:** `/lists/{listId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Document ID |
| `name` | `string` | List name |
| `acl` | `string[]` | Array of user UIDs with access |
| `shared` | `boolean` | `true` if `acl.length > 1` |
| `favorites` | `string[]` | UIDs of users who favorited this list |
| `groupsOrder` | `string[]` | Ordered array of group IDs |
| `modified` | `Timestamp` | Last modification time |

**Access:** Users can only access lists where their UID is in the `acl` array.

---

### lists/{listId}/items

Stores individual items within a shopping list.

**Path:** `/lists/{listId}/items/{itemId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Document ID |
| `name` | `string` | Item name |
| `displayName` | `string?` | Optional display name |
| `description` | `string \| null` | Item description |
| `active` | `boolean` | `true` = todo, `false` = done |
| `groupId` | `string` | Reference to parent group |
| `modified` | `Timestamp` | Last modification time |
| `deleted` | `boolean?` | Soft delete flag for sync (see [Soft Delete Pattern](#soft-delete-pattern)) |

**Access:** Inherited from parent list's `acl`.

---

### lists/{listId}/groups

Stores category/group definitions for organizing items.

**Path:** `/lists/{listId}/groups/{groupId}`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Document ID (slugified name) |
| `name` | `string` | Group display name |
| `modified` | `Timestamp` | Last modification time |
| `deleted` | `boolean?` | Soft delete flag for sync (see [Soft Delete Pattern](#soft-delete-pattern)) |

**Notes:**
- Group IDs are generated as slugs from the group name
- Groups are referenced by items via `groupId`
- Display order is controlled by `groupsOrder` in the parent list

**Access:** Inherited from parent list's `acl`.

---

### invites

Stores pending list sharing invitations.

**Path:** `/invites/{inviteId}`

| Field | Type | Description |
|-------|------|-------------|
| `to` | `string` | Recipient email address |
| `listId` | `string` | ID of the list being shared |
| `listName` | `string` | Name of the list |
| `userName` | `string` | Name of the user sending the invite |

**Notes:**
- Creating an invite triggers a Cloud Function that s endsan email
- The `inviteId` serves as the share token

**Access:** Any signed-in user can read/write.

---

## Entity Relationships

```
┌─────────────┐
│    User     │
│   (users)   │
└──────┬──────┘
       │ uid in acl[]
       ▼
┌─────────────┐       ┌─────────────┐
│    List     │◄──────│   Invite    │
│   (lists)   │listId │  (invites)  │
└──────┬──────┘       └─────────────┘
       │
       ├─── groupsOrder[] ───┐
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│    Item     │──────►│    Group    │
│   (items)   │groupId│  (groups)   │
└─────────────┘       └─────────────┘
```

## Access Control Model

The application uses an **ACL-based** (Access Control List) security model:

1. **List-level ACL:** Each list has an `acl` array containing user UIDs
2. **Inherited access:** Items and groups inherit access from their parent list
3. **Query filtering:** Users only see lists where their UID is in the `acl`

### Security Rules Summary

```javascript
// Users: own document only
match /users/{uid} {
  allow read, write: if request.auth.uid == uid;
}

// Lists: ACL-based
match /lists/{listId} {
  allow create: if signedIn();
  allow read, write: if request.auth.uid in resource.data.acl;
}

// Items & Groups: inherit from parent list
match /lists/{listId}/items/{item} {
  allow read, write: if request.auth.uid in
    get(/databases/$(database)/documents/lists/$(listId)).data.acl;
}
```

## Data Patterns

### Real-time Synchronization

The app uses Firestore real-time listeners with timestamp-based filtering:

```typescript
// Only fetch items modified after the last known timestamp
where('modified', '>', maxModified)
```

### Array Operations

ACL and favorites use atomic array operations:

```typescript
// Add user to ACL
updateDoc(listRef, { acl: arrayUnion(userId) });

// Remove from favorites
updateDoc(listRef, { favorites: arrayRemove(userId) });
```

### Server Timestamps

All `modified` fields use server timestamps for consistency:

```typescript
setDoc(ref, { ...data, modified: serverTimestamp() });
```

### Soft Delete Pattern

Items and groups use **soft delete** to enable real-time sync of deletions across shared lists.

**Problem:** Timestamp-based filtering (`where('modified', '>', maxModified)`) can't detect when documents are deleted because deleted documents don't exist to match the query.

**Solution:** Instead of hard-deleting, documents are marked with `deleted: true` and `modified` is updated. This allows other users' timestamp queries to pick up the change.

```typescript
// Soft delete an item
updateDoc(itemRef, {
  deleted: true,
  modified: serverTimestamp()
});
```

**Cleanup Strategy:**
- **30 days (backend):** Daily Cloud Function permanently deletes all soft-deleted documents older than 30 days

## Cloud Functions

### sendInviteEmail

**Trigger:** `onDocumentCreated('invites/{inviteId}')`

When an invite document is created, this function:
1. Reads the invite data (to, listId, listName, userName)
2. Sends an email to the recipient with the share link
3. The inviteId serves as the share token in the URL

### cleanupDeletedItems

**Trigger:** `onSchedule('0 0 * * *')` (daily at midnight)

Scheduled cleanup function that permanently deletes soft-deleted items and groups older than 30 days:
1. Iterates through all lists
2. Queries items/groups where `deleted == true` and `modified < 30 days ago`
3. Permanently deletes matching documents

## TypeScript Interfaces

```typescript
interface List {
  id: string;
  name: string;
  acl: string[];
  shared: boolean;
  favorites: string[];
  groupsOrder: string[];
  modified: Date;
}

interface Item {
  id: string;
  name: string;
  displayName?: string;
  description: string | null;
  active: boolean;
  groupId: string;
  modified: Date;
  deleted?: boolean;
}

interface Group {
  id: string;
  name: string;
  modified: Date;
  deleted?: boolean;
}

interface Invite {
  to: string;
  listId: string;
  listName?: string;
  userName?: string;
}
```

## Key Files

| File | Description |
|------|-------------|
| [models.ts](../packages/frontend/src/app/shared/models.ts) | TypeScript interfaces |
| [list.service.ts](../packages/frontend/src/app/state/list/list.service.ts) | List CRUD operations |
| [item.service.ts](../packages/frontend/src/app/state/item/item.service.ts) | Item CRUD operations |
| [group.service.ts](../packages/frontend/src/app/state/group/group.service.ts) | Group operations |
| [firestore.rules](../firestore.rules) | Security rules |
| [functions/src/index.ts](../packages/functions/src/index.ts) | Cloud Functions |
