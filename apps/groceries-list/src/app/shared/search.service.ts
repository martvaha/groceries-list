import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  worker?: Worker;
  fuse?: Fuse<unknown>;
  options: Fuse.IFuseOptions<unknown> = {};

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('./search.worker', { type: 'module' });
    }
  }

  setCollection<T>(docs: T[], options = {} as Fuse.IFuseOptions<T>) {
    this.options = options as Fuse.IFuseOptions<unknown>;
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
    let resolve = (value?: Fuse.FuseResult<T>[] | undefined) => {};
    const promise = new Promise<Fuse.FuseResult<T>[]>((res) => {
      resolve = (val) => {
        console.log('8289', val);
        res(val);
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
