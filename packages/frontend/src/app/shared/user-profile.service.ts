import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docSnapshots, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, map } from 'rxjs';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private firestore = inject(Firestore);
  private functions = inject(Functions);

  /**
   * Ensure user profile exists in Firestore.
   * Should be called after successful authentication.
   */
  async ensureProfile(): Promise<{ created: boolean }> {
    const ensureProfileFn = httpsCallable<void, { created: boolean }>(this.functions, 'ensureUserProfile');
    const result = await ensureProfileFn();
    return result.data;
  }

  /**
   * Get the current user's profile as an observable.
   */
  getMyProfile(uid: string): Observable<UserProfile | null> {
    const profileDoc = doc(this.firestore, `userProfiles/${uid}`);
    return docSnapshots(profileDoc).pipe(map((snap) => (snap.exists() ? (snap.data() as UserProfile) : null)));
  }

  /**
   * Update the user's profile (display name).
   */
  async updateProfile(uid: string, data: Partial<Pick<UserProfile, 'displayName'>>): Promise<void> {
    const profileDoc = doc(this.firestore, `userProfiles/${uid}`);
    await updateDoc(profileDoc, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
