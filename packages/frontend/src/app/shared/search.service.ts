import { Injectable } from '@angular/core';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  worker?: Worker;
  fuse?: Fuse<unknown>;
  options: IFuseOptions<unknown> = {};

  // Track pending search requests by unique ID
  private pendingSearches = new Map<number, (value: FuseResult<unknown>[] | undefined) => void>();
  private searchIdCounter = 0;
  private latestSearchId = 0;

  // Track collection readiness
  private collectionReady: Promise<void> = Promise.resolve();
  private collectionIdCounter = 0;
  private pendingCollections = new Map<number, () => void>();

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./search.worker', import.meta.url));
      // Set up message handler once to avoid race conditions
      this.worker.onmessage = ({ data }) => {
        const { action, searchId, collectionId, response } = data;

        if (action === 'collectionSet') {
          // Resolve the collection ready promise
          const resolver = this.pendingCollections.get(collectionId);
          if (resolver) {
            resolver();
            this.pendingCollections.delete(collectionId);
          }
        } else {
          // Handle search response
          const resolver = this.pendingSearches.get(searchId);
          if (resolver) {
            // Only resolve if this is the latest search (ignore stale results)
            if (searchId === this.latestSearchId) {
              resolver(response);
            }
            this.pendingSearches.delete(searchId);
          }
        }
      };
    }
  }

  setCollection<T>(docs: T[], options = {} as IFuseOptions<T>): Promise<void> {
    this.options = options as IFuseOptions<unknown>;
    const collectionId = ++this.collectionIdCounter;

    if (this.worker) {
      // Create a promise that resolves when the worker acknowledges the collection is set
      this.collectionReady = new Promise<void>((resolve) => {
        this.pendingCollections.set(collectionId, resolve);
      });

      this.worker.postMessage({
        action: 'setCollection',
        payload: { docs, options },
        collectionId,
      });

      return this.collectionReady;
    } else {
      this.fuse = new Fuse(docs, this.options);
      this.collectionReady = Promise.resolve();
      return this.collectionReady;
    }
  }

  async search<T>(pattern: string): Promise<FuseResult<T>[] | undefined> {
    const searchId = ++this.searchIdCounter;
    this.latestSearchId = searchId;

    // Wait for the collection to be ready before searching
    await this.collectionReady;

    // Check if this search is still the latest (might have been superseded while waiting)
    if (searchId !== this.latestSearchId) {
      return undefined;
    }

    return new Promise<FuseResult<T>[] | undefined>((resolve) => {
      if (this.worker) {
        this.pendingSearches.set(searchId, resolve as (value: FuseResult<unknown>[] | undefined) => void);
        this.worker.postMessage({ action: 'search', payload: pattern, searchId });
      } else {
        const result = this.fuse?.search<T>(pattern);
        resolve(result);
      }
    });
  }
}
