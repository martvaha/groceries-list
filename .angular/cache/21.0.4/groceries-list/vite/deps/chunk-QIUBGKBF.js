import {
  MediaMatcher
} from "./chunk-4GEZQRRV.js";
import {
  ANIMATION_MODULE_TYPE,
  InjectionToken,
  inject
} from "./chunk-K553LG5V.js";

// node_modules/.pnpm/@angular+material@21.0.5_fa41ef7fb045ee86255967d043d95fbe/node_modules/@angular/material/fesm2022/_animation-chunk.mjs
var MATERIAL_ANIMATIONS = new InjectionToken("MATERIAL_ANIMATIONS");
var reducedMotion = null;
function _getAnimationsState() {
  if (inject(MATERIAL_ANIMATIONS, {
    optional: true
  })?.animationsDisabled || inject(ANIMATION_MODULE_TYPE, {
    optional: true
  }) === "NoopAnimations") {
    return "di-disabled";
  }
  reducedMotion ??= inject(MediaMatcher).matchMedia("(prefers-reduced-motion)").matches;
  return reducedMotion ? "reduced-motion" : "enabled";
}
function _animationsDisabled() {
  return _getAnimationsState() !== "enabled";
}

export {
  _getAnimationsState,
  _animationsDisabled
};
//# sourceMappingURL=chunk-QIUBGKBF.js.map
