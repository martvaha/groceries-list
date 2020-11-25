/// <reference lib="webworker" />
import Fuse from 'fuse.js';

let fuse: Fuse<any>;

addEventListener<'message'>('message', ({ data }) => {
  const { action, payload } = data;
  console.log('[worker ' + action, payload);
  if (action === 'setCollection') {
    const { docs, options } = payload;
    fuse = new Fuse(docs, options);
  } else if (action === 'search') {
    if (!fuse) throw new Error('Fuse not initialized!');
    const response = fuse.search(payload);
    postMessage({ payload, response });
  }
});
