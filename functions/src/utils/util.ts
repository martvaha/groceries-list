export function coerceBoolean(value: any) {
    return value === 'false' || value === '0' ? false : !!value;
  }