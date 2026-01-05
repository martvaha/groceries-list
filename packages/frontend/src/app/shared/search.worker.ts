/// <reference lib="webworker" />
import Fuse from 'fuse.js';

let fuse: Fuse<any>;

addEventListener<'message'>('message', ({ data }) => {
  const { action, payload, searchId, collectionId } = data;
  if (action === 'setCollection') {
    const { docs, options } = payload;
    fuse = new Fuse(docs, options);
    // Acknowledge that the collection is set
    postMessage({ action: 'collectionSet', collectionId });
  } else if (action === 'search') {
    if (!fuse) throw new Error('Fuse not initialized!');
    const response = fuse.search(payload);
    postMessage({ searchId, response });
  }
});
