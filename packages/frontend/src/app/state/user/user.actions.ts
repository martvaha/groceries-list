import { createAction, props } from '@ngrx/store';
import { User } from '../../auth/auth.service';

export const getUser = createAction('[User] get');
export const getUserSuccess = createAction('[User] get success', props<{ user: User | null | undefined }>());

export const login = createAction(
  '[User] login',
  (config: { redirect?: string | string[]; provider: 'google' | 'facebook' }) => config
);
export const loginSuccess = createAction('[User] login success', props<{ user: User }>());

export const logout = createAction('[User] logout');
