import { Observable, of, combineLatest, timer, OperatorFunction, firstValueFrom } from 'rxjs';
import { take, switchMap, map } from 'rxjs/operators';
import { MIN_LOADING_DURATION } from './const';

type FirestoreTimestampLike = {
  toDate?: () => unknown;
  seconds?: number;
  nanoseconds?: number;
  _seconds?: number;
  _nanoseconds?: number;
};

/**
 * Converts values found at Firestore and persisted-state boundaries into a
 * valid Date. Legacy caches can contain ISO strings or serialized Firestore
 * Timestamp objects even though the application model declares Date.
 */
export function coerceDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (value && typeof value === 'object') {
    const timestamp = value as FirestoreTimestampLike;
    if (typeof timestamp.toDate === 'function') {
      try {
        return coerceDate(timestamp.toDate());
      } catch {
        return null;
      }
    }

    const seconds = timestamp.seconds ?? timestamp._seconds;
    const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
    if (typeof seconds === 'number' && typeof nanoseconds === 'number') {
      return coerceDate(seconds * 1000 + nanoseconds / 1_000_000);
    }
  }

  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !value.trim()) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const highlight = function (text: string, indices: number[][]) {
  let result = '';
  let prev: number[] | null = null;
  indices.forEach((cur, _) => {
    result +=
      text.substring(prev === null ? 0 : prev[1] + 1, cur[0]) + '<b>' + text.substring(cur[0], cur[1] + 1) + '</b>';
    prev = cur;
  });
  if (prev !== null) {
    result += text.substring(prev[1] + 1);
  }
  return result.replace(/\s/g, '&nbsp;');
};

export function takeAsyncValue<T>(observable: Observable<T>): Promise<T> {
  return firstValueFrom(observable);
}

export function takeValue<T>(observable: Observable<T>): T {
  let value: any;
  observable.pipe(take(1)).subscribe((data) => (value = data));
  return value;
}

export function minLoadingTime(loadingTime = MIN_LOADING_DURATION): OperatorFunction<boolean, boolean> {
  return (source) =>
    source.pipe(
      switchMap((loading) =>
        loading
          ? of(loading)
          : combineLatest([of(loading), timer(loadingTime)]).pipe(map(([delayedLoading]) => delayedLoading)),
      ),
    );
}
