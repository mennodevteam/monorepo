/**
 * Deep-clones JSON-serializable data for TransferState (no circular refs).
 */
export function serializeForTransfer<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Clones an object graph that may contain circular references (e.g. menu after setRefsAndSort).
 * Back-references are omitted so the result can be stored in TransferState.
 */
export function serializeCircularForTransfer<T>(value: T): T {
  const seen = new WeakSet<object>();
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return undefined;
        }
        seen.add(val);
      }
      return val;
    }),
  ) as T;
}
