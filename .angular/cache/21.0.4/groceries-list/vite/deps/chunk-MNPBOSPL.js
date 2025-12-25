import {
  ElementRef
} from "./chunk-K553LG5V.js";

// node_modules/.pnpm/@angular+cdk@21.0.5_@angular+common@21.0.6_@angular+core@21.0.6_@angular+compiler@21.0._a6a89b22bdc48301626f5fedaf4faad0/node_modules/@angular/cdk/fesm2022/_element-chunk.mjs
function coerceNumberProperty(value, fallbackValue = 0) {
  if (_isNumberValue(value)) {
    return Number(value);
  }
  return arguments.length === 2 ? fallbackValue : 0;
}
function _isNumberValue(value) {
  return !isNaN(parseFloat(value)) && !isNaN(Number(value));
}
function coerceElement(elementOrRef) {
  return elementOrRef instanceof ElementRef ? elementOrRef.nativeElement : elementOrRef;
}

export {
  coerceNumberProperty,
  coerceElement
};
//# sourceMappingURL=chunk-MNPBOSPL.js.map
