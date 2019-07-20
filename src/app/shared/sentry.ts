import * as Sentry from '@sentry/browser';
import { ErrorHandler } from '@angular/core';

import { environment } from '../../environments/environment';
import cloneDeep from 'clone-deep';
import * as jsondiffpatch from 'jsondiffpatch';
import { ActionReducer } from '@ngrx/store';
import { State } from '../state/app.reducer';

const SENTRY_MAX_SIZE = 90000;

let sentryInit = false;

export function sentryReducer(reducer: ActionReducer<State, any>): ActionReducer<State, any> {
  return function(state, action): State {
    let nextState: State | null = null;
    try {
      nextState = reducer(state, action);
    } finally {
      const { type, ...payload } = action;
      Sentry.addBreadcrumb({
        category: 'ngrx',
        message: action.type,
        data: {
          payload,
          nextState
        }
      });
    }
    return nextState;
  };
}

if (environment.sentry.dsn) {
  Sentry.init({
    dsn: environment.sentry.dsn,
    // Sending full history of ngrx actions and state is too large for Sentry.
    // Delete data from all but NGRX_MAX_DATA latest ngrx breadcrumbs.
    beforeSend: d => {
      if (!d.breadcrumbs) return d;
      const data = cloneDeep(d);
      const ngrxBreadcrumbs: any[] = data.breadcrumbs.filter((crumb: Sentry.Breadcrumb) => crumb.category === 'ngrx');
      console.log(ngrxBreadcrumbs);
      for (let i = ngrxBreadcrumbs.length - 1; i > 0; i--) {
        const prevState = ngrxBreadcrumbs[i - 1].data.nextState;
        const nextState = ngrxBreadcrumbs[i].data.nextState;
        let stateDiff;
        if (prevState === undefined && nextState !== undefined) {
          stateDiff = 'initialized';
        } else if (prevState !== undefined && nextState === undefined) {
          stateDiff = 'cleared';
        } else {
          const diffPatcher = new jsondiffpatch.DiffPatcher();
          stateDiff = diffPatcher.diff(prevState, nextState);
        }
        ngrxBreadcrumbs[i].data.stateDiff = stateDiff;
        ngrxBreadcrumbs[i].data.nextState = undefined;
        removeUndefinedData(ngrxBreadcrumbs[i]);
        if (i === 1) {
          ngrxBreadcrumbs[i - 1].data.nextState = undefined;
          removeUndefinedData(ngrxBreadcrumbs[i - 1]);
        }
      }
      for (let i = 0; i < ngrxBreadcrumbs.length; i++) {
        if (ngrxBreadcrumbs[i].message.substr(0, 18) === '@ngrx/router-store') {
          delete ngrxBreadcrumbs[i].data;
        }
      }
      const totalSize = lengthInUtf8Bytes(JSON.stringify(data));
      let oversize = totalSize - SENTRY_MAX_SIZE;
      for (let i = 0; i < ngrxBreadcrumbs.length; i++) {
        if (oversize <= 0) {
          break;
        }
        const dataSize = lengthInUtf8Bytes(JSON.stringify(ngrxBreadcrumbs[i].data));
        delete ngrxBreadcrumbs[i].data;
        oversize = oversize - dataSize;
      }
      return data;
    }
  });
  sentryInit = true;
}

export function captureException(error: string | Error | ErrorEvent) {
  return sentryInit ? Sentry.captureException(error) : console.log(error);
}

export class SentryErrorHandler implements ErrorHandler {
  handleError(err: any): void {
    captureException(err);
  }
}

function removeUndefinedData(obj: { data: any }) {
  Object.keys(obj.data).forEach(prop => {
    if (obj.data[prop] === undefined) {
      delete obj.data[prop];
    }
  });
  if (Object.keys(obj.data).length === 0) {
    delete obj.data;
  }
}

function lengthInUtf8Bytes(str) {
  const m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

export const sentryInstrumentation = environment.sentry.dsn
  ? [{ provide: ErrorHandler, useClass: SentryErrorHandler }]
  : [];
