# @vanya2h/store-react

React bindings for [`@vanya2h/store`](../store) — read entries from a global
store with status-aware rendering, built on
[`@vanya2h/utils-rxjs-react`](../utils-rxjs-react).

## Install

```sh
pnpm add @vanya2h/store-react @vanya2h/store @vanya2h/utils-rxjs @vanya2h/utils-rxjs-react react rxjs zod
```

Peer deps: `react ^18 || ^19`, `rxjs ^7`, `zod ^4`.

## API

### `useStoreValue(store, key)`

Subscribes to `store.getValue(key)` and returns an `IPendingStatus<T>` (the
state machine from `@vanya2h/utils-rxjs-react`). Re-renders when the cache
emits a new value (e.g. after `cache.set(...)` or `cache.next()`).

```tsx
const userStore = globalStore.create(userDescriptor, {
  getDefaultValue: (id: string) => api.getUser$(id),
});

function UserCard({ id }: { id: string }) {
  const status = useStoreValue(userStore, id);

  if (status.status === "pending") return <Spinner />;
  if (status.status === "rejected") {
    return <button onClick={status.onReload}>Retry</button>;
  }
  return <div>{status.value.name}</div>;
}
```

### `useStoreCache(store, key)`

Returns the underlying `ICache<T>` for direct access to `set` / `next` /
`fresh` / `value$`. The cache reference is stable across renders for
equivalent keys (the store dedupes by key hash).

```tsx
function RefreshButton({ id }: { id: string }) {
  const cache = useStoreCache(userStore, id);
  return <button onClick={() => cache.next()}>Refresh</button>;
}
```

## Why

Combines `@vanya2h/store`'s schema-keyed caching with `usePending`'s late
unwrap: pass the store + key down the tree and unwrap at the consuming leaf.
Updates from `cache.set(...)` propagate only to the components that actually
read the value.
