import { Injectable, NgZone, inject } from '@angular/core';
import Fuse, { IFuseOptions, FuseResult } from 'fuse.js';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private ngZone = inject(NgZone);

  worker?: Worker;
  fuse?: Fuse<unknown>;
  options: IFuseOptions<unknown> = {};

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./search.worker', import.meta.url));
    }
  }

  setCollection<T>(docs: T[], options = {} as IFuseOptions<T>) {
    this.options = options as IFuseOptions<unknown>;
    if (this.worker) {
      this.worker.postMessage({
        action: 'setCollection',
        payload: { docs, options },
      });
    } else {
      this.fuse = new Fuse(docs, this.options);
    }
  }

  search<T>(pattern: string) {
    console.log('6057', pattern);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let resolve = (value: FuseResult<T>[] | undefined) => {};
    const promise = new Promise<FuseResult<T>[] | undefined>((res) => {
      resolve = (val) => {
        console.log('8289', val);
        this.ngZone.run(() => res(val));
      };
    });

    if (this.worker) {
      this.worker.onmessage = ({ data }) => {
        const { payload, response } = data;
        if (payload === pattern) resolve(response);
      };
      this.worker?.postMessage({ action: 'search', payload: pattern });
    } else {
      const result = this.fuse?.search<T>(pattern);
      resolve(result);
    }
    return promise;
  }
}
