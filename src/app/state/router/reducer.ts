import { getSelectors, RouterReducerState } from '@ngrx/router-store';
import { createFeatureSelector } from '@ngrx/store';
import { State } from '../app.reducer';

export interface RouterState extends RouterReducerState<any> {}

export const selectRouter = createFeatureSelector<State, RouterState>('router');

export const {
  selectQueryParams, // select the current route query params
  selectRouteParams, // select the current route params
  selectRouteData, // select the current route data
  selectUrl // select the current url
} = getSelectors(selectRouter);
