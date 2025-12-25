import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';
import { State } from '../app.reducer';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RouterState extends RouterReducerState<any> {}

export const selectRouter = createFeatureSelector<State, RouterState>('router');

export const {
  selectQueryParams, // select the current route query params
  selectRouteParams, // select the current route params
  selectRouteData, // select the current route data
  selectUrl // select the current url
} = getRouterSelectors(selectRouter);
