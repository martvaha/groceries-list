// node_modules/.pnpm/@angular+cdk@21.0.5_@angular+common@21.0.6_@angular+core@21.0.6_@angular+compiler@21.0._a6a89b22bdc48301626f5fedaf4faad0/node_modules/@angular/cdk/fesm2022/_passive-listeners-chunk.mjs
var supportsPassiveEvents;
function supportsPassiveEventListeners() {
  if (supportsPassiveEvents == null && typeof window !== "undefined") {
    try {
      window.addEventListener("test", null, Object.defineProperty({}, "passive", {
        get: () => supportsPassiveEvents = true
      }));
    } finally {
      supportsPassiveEvents = supportsPassiveEvents || false;
    }
  }
  return supportsPassiveEvents;
}
function normalizePassiveListenerOptions(options) {
  return supportsPassiveEventListeners() ? options : !!options.capture;
}

export {
  normalizePassiveListenerOptions
};
//# sourceMappingURL=chunk-BIGTZG4Z.js.map
