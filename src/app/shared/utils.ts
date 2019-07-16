import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export const highlight = function(text: string, indices: number[][]) {
  let result = '';
  let prev: number[] | null = null;
  indices.forEach((cur, index) => {
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
  return observable.pipe(take(1)).toPromise();
}

export function takeValue<T>(observable: Observable<T>): T {
  let value: any;
  observable.pipe(take(1)).subscribe(data => (value = data));
  return value;
}
