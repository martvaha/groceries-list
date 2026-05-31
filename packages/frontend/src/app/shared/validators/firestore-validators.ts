/**
 * Runtime validators for Firestore document data.
 * These help catch malformed data before it causes runtime errors.
 */

export interface InviteData {
  to: string;
  toEmailNormalized: string;
  listId: string;
  listName?: string;
  userName?: string;
  createdAt?: unknown;
  expiresAt?: unknown;
}

export interface ListData {
  name: string;
  acl: string[];
  owner?: string;
  modified?: unknown;
}

export interface MemberInfoData {
  email: string;
  displayName?: string;
  joinedAt?: unknown;
}

/**
 * Type guard for InviteData
 */
export function isInviteData(data: unknown): data is InviteData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj['to'] === 'string' &&
    typeof obj['toEmailNormalized'] === 'string' &&
    typeof obj['listId'] === 'string' &&
    obj['to'].length > 0 &&
    obj['toEmailNormalized'].length > 0 &&
    obj['listId'].length > 0
  );
}

/**
 * Type guard for ListData
 */
export function isListData(data: unknown): data is ListData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj['name'] === 'string' &&
    Array.isArray(obj['acl']) &&
    obj['acl'].every((item: unknown) => typeof item === 'string')
  );
}

/**
 * Type guard for MemberInfoData
 */
export function isMemberInfoData(data: unknown): data is MemberInfoData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  return typeof obj['email'] === 'string';
}

/**
 * Safely parse invite data with fallback
 */
export function parseInviteData(data: unknown): InviteData | null {
  if (!isInviteData(data)) {
    console.warn('Invalid invite data:', data);
    return null;
  }
  return data;
}

/**
 * Safely parse list data with fallback
 */
export function parseListData(data: unknown, id: string): (ListData & { id: string }) | null {
  if (!isListData(data)) {
    console.warn('Invalid list data:', data);
    return null;
  }
  return { ...data, id };
}

/**
 * Safely parse member info data
 */
export function parseMemberInfoData(data: unknown, uid: string): MemberInfoData & { uid: string } | null {
  if (!isMemberInfoData(data)) {
    console.warn('Invalid member info data:', data);
    return null;
  }
  return { ...data, uid };
}
