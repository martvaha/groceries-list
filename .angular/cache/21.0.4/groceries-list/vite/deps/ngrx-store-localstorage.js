import {
  __commonJS,
  __spreadValues,
  __toESM
} from "./chunk-TWWAJFRB.js";

// node_modules/.pnpm/deepmerge@4.3.1/node_modules/deepmerge/dist/cjs.js
var require_cjs = __commonJS({
  "node_modules/.pnpm/deepmerge@4.3.1/node_modules/deepmerge/dist/cjs.js"(exports, module) {
    "use strict";
    var isMergeableObject = function isMergeableObject2(value) {
      return isNonNullObject(value) && !isSpecial(value);
    };
    function isNonNullObject(value) {
      return !!value && typeof value === "object";
    }
    function isSpecial(value) {
      var stringValue = Object.prototype.toString.call(value);
      return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
    }
    var canUseSymbol = typeof Symbol === "function" && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
    function isReactElement(value) {
      return value.$$typeof === REACT_ELEMENT_TYPE;
    }
    function emptyTarget(val) {
      return Array.isArray(val) ? [] : {};
    }
    function cloneUnlessOtherwiseSpecified(value, options) {
      return options.clone !== false && options.isMergeableObject(value) ? deepmerge2(emptyTarget(value), value, options) : value;
    }
    function defaultArrayMerge(target, source, options) {
      return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
      });
    }
    function getMergeFunction(key, options) {
      if (!options.customMerge) {
        return deepmerge2;
      }
      var customMerge = options.customMerge(key);
      return typeof customMerge === "function" ? customMerge : deepmerge2;
    }
    function getEnumerableOwnPropertySymbols(target) {
      return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
      }) : [];
    }
    function getKeys(target) {
      return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
    }
    function propertyIsOnObject(object, property) {
      try {
        return property in object;
      } catch (_) {
        return false;
      }
    }
    function propertyIsUnsafe(target, key) {
      return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
    }
    function mergeObject(target, source, options) {
      var destination = {};
      if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function(key) {
          destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
      }
      getKeys(source).forEach(function(key) {
        if (propertyIsUnsafe(target, key)) {
          return;
        }
        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
          destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
          destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
      });
      return destination;
    }
    function deepmerge2(target, source, options) {
      options = options || {};
      options.arrayMerge = options.arrayMerge || defaultArrayMerge;
      options.isMergeableObject = options.isMergeableObject || isMergeableObject;
      options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
      var sourceIsArray = Array.isArray(source);
      var targetIsArray = Array.isArray(target);
      var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
      if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
      } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
      } else {
        return mergeObject(target, source, options);
      }
    }
    deepmerge2.all = function deepmergeAll(array, options) {
      if (!Array.isArray(array)) {
        throw new Error("first argument should be an array");
      }
      return array.reduce(function(prev, next) {
        return deepmerge2(prev, next, options);
      }, {});
    };
    var deepmerge_1 = deepmerge2;
    module.exports = deepmerge_1;
  }
});

// node_modules/.pnpm/ngrx-store-localstorage@19.0.2_@angular+common@21.0.6_@angular+core@21.0.6_@angular+com_70faa3596caef20bf64fb4e67aee0798/node_modules/ngrx-store-localstorage/fesm2022/ngrx-store-localstorage.mjs
var import_deepmerge = __toESM(require_cjs(), 1);
var INIT_ACTION = "@ngrx/store/init";
var UPDATE_ACTION = "@ngrx/store/update-reducers";
var detectDate = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
var dateReviver = (_key, value) => {
  if (typeof value === "string" && detectDate.test(value)) {
    return new Date(value);
  }
  return value;
};
var dummyReviver = (_key, value) => value;
var checkIsBrowserEnv = () => {
  return typeof window !== "undefined";
};
var validateStateKeys = (keys) => {
  return keys.map((key) => {
    let attr = key;
    if (typeof key === "object") {
      attr = Object.keys(key)[0];
    }
    if (typeof attr !== "string") {
      throw new TypeError(`localStorageSync Unknown Parameter Type: Expected type of string, got ${typeof attr}`);
    }
    return key;
  });
};
var rehydrateApplicationState = ({ keys, storage, storageKeySerializer, restoreDates }) => {
  return keys.reduce((acc, curr) => {
    let key = curr;
    let reviver = restoreDates ? dateReviver : dummyReviver;
    let deserialize;
    let decrypt;
    if (typeof key === "object") {
      key = Object.keys(key)[0];
      if (typeof curr[key] === "function") {
        reviver = curr[key];
      } else {
        if (curr[key].reviver) {
          reviver = curr[key].reviver;
        }
        if (curr[key].deserialize) {
          deserialize = curr[key].deserialize;
        }
      }
      if (curr[key].encrypt && curr[key].decrypt) {
        if (typeof curr[key].encrypt === "function" && typeof curr[key].decrypt === "function") {
          decrypt = curr[key].decrypt;
        } else {
          console.error(`Either encrypt or decrypt is not a function on '${curr[key]}' key object.`);
        }
      } else if (curr[key].encrypt || curr[key].decrypt) {
        console.error(`Either encrypt or decrypt function is not present on '${curr[key]}' key object.`);
      }
    }
    if (storage !== void 0) {
      let stateSlice = storage.getItem(storageKeySerializer(key));
      if (stateSlice) {
        if (decrypt) {
          stateSlice = decrypt(stateSlice);
        }
        const isObjectRegex = new RegExp("{|\\[");
        let raw = stateSlice;
        if (stateSlice === "null" || stateSlice === "true" || stateSlice === "false" || isObjectRegex.test(stateSlice.charAt(0))) {
          raw = JSON.parse(stateSlice, reviver);
        }
        return Object.assign({}, acc, {
          [key]: deserialize ? deserialize(raw) : raw
        });
      }
    }
    return acc;
  }, {});
};
function createStateSlice(existingSlice, filter) {
  return filter.reduce((memo, attr) => {
    if (typeof attr === "string" || typeof attr === "number") {
      const value = existingSlice?.[attr];
      if (value !== void 0) {
        memo[attr] = value;
      }
    } else {
      for (const key in attr) {
        if (Object.prototype.hasOwnProperty.call(attr, key)) {
          const element = attr[key];
          memo[key] = createStateSlice(existingSlice[key], element);
        }
      }
    }
    return memo;
  }, {});
}
var syncStateUpdate = ({ state, keys, storage, storageKeySerializer, removeOnUndefined, syncCondition }) => {
  if (syncCondition) {
    try {
      if (syncCondition(state) !== true) {
        return;
      }
    } catch (e) {
      if (e instanceof TypeError) {
        return;
      }
      throw e;
    }
  }
  keys.forEach((key) => {
    let stateSlice = state[key];
    let replacer;
    let space;
    let encrypt;
    if (typeof key === "object") {
      let name = Object.keys(key)[0];
      stateSlice = state[name];
      if (typeof stateSlice !== "undefined" && key[name]) {
        if (key[name].serialize) {
          stateSlice = key[name].serialize(stateSlice);
        } else {
          let filter;
          if (key[name].reduce) {
            filter = key[name];
          } else if (key[name].filter) {
            filter = key[name].filter;
          }
          if (filter) {
            stateSlice = createStateSlice(stateSlice, filter);
          }
          if (key[name].encrypt && key[name].decrypt) {
            if (typeof key[name].encrypt === "function") {
              encrypt = key[name].encrypt;
            }
          } else if (key[name].encrypt || key[name].decrypt) {
            console.error(`Either encrypt or decrypt function is not present on '${key[name]}' key object.`);
          }
        }
        replacer = key[name].replacer;
        space = key[name].space;
      }
      key = name;
    }
    if (typeof stateSlice !== "undefined" && storage !== void 0) {
      try {
        if (encrypt) {
          stateSlice = encrypt(typeof stateSlice === "string" ? stateSlice : JSON.stringify(stateSlice, replacer, space));
        }
        storage.setItem(storageKeySerializer(key), typeof stateSlice === "string" ? stateSlice : JSON.stringify(stateSlice, replacer, space));
      } catch (e) {
        console.warn("Unable to save state to localStorage:", e);
      }
    } else if (typeof stateSlice === "undefined" && removeOnUndefined && storage !== void 0) {
      try {
        storage.removeItem(storageKeySerializer(key));
      } catch (e) {
        console.warn(`Exception on removing/cleaning undefined '${key}' state`, e);
      }
    }
  });
};
var defaultMergeReducer = (state, rehydratedState, action) => {
  if ((action.type === INIT_ACTION || action.type === UPDATE_ACTION) && rehydratedState) {
    const overwriteMerge = (destinationArray, sourceArray, options2) => sourceArray;
    const options = {
      arrayMerge: overwriteMerge
    };
    state = (0, import_deepmerge.default)(state, rehydratedState, options);
  }
  return state;
};
var localStorageSync = (config) => (reducer) => {
  if (config.storage === void 0 && !config.checkStorageAvailability || config.checkStorageAvailability && checkIsBrowserEnv()) {
    config.storage = localStorage || window.localStorage;
  }
  if (config.storageKeySerializer === void 0) {
    config.storageKeySerializer = (key) => key;
  }
  if (config.restoreDates === void 0) {
    config.restoreDates = true;
  }
  let mergeReducer = config.mergeReducer;
  if (mergeReducer === void 0 || typeof mergeReducer !== "function") {
    mergeReducer = defaultMergeReducer;
  }
  const keys = validateStateKeys(config.keys);
  const { storage, storageKeySerializer, restoreDates } = config;
  const rehydratedState = config.rehydrate ? rehydrateApplicationState({
    keys,
    storage,
    storageKeySerializer,
    restoreDates
  }) : void 0;
  return function(state, action) {
    let nextState;
    if (action.type === INIT_ACTION && !state) {
      nextState = reducer(state, action);
    } else {
      nextState = __spreadValues({}, state);
    }
    nextState = mergeReducer(nextState, rehydratedState, action);
    nextState = reducer(nextState, action);
    if (action.type !== INIT_ACTION) {
      const { storage: storage2, storageKeySerializer: storageKeySerializer2, removeOnUndefined, syncCondition } = config;
      syncStateUpdate({
        state: nextState,
        keys,
        storage: storage2,
        storageKeySerializer: storageKeySerializer2,
        removeOnUndefined,
        syncCondition
      });
    }
    return nextState;
  };
};
export {
  dateReviver,
  defaultMergeReducer,
  localStorageSync,
  rehydrateApplicationState,
  syncStateUpdate
};
//# sourceMappingURL=ngrx-store-localstorage.js.map
