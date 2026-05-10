# @vanya2h/utils-rxjs-react

React bindings for RxJS — hooks and components for consuming `Observable<T>` /
`BehaviorSubject<T>` in React without boilerplate.

## Why

The main benefit is **late unwrapping**. Instead of subscribing at the top of
the tree and threading the resolved value through props, pass the
`Observable<T>` down and let it unwrap at the leaf that actually renders it.
Re-renders stay scoped to the components that consume the value — parents and
siblings don't repaint when the data changes. In practice this turns
"everything re-renders when the store updates" into "only the cell that reads
this field re-renders," which adds up across a real-world React app.

## Install

```sh
pnpm add @vanya2h/utils-rxjs-react react rxjs
```

Peer deps: `react ^18 || ^19`, `rxjs ^7`.

## API

### `useObservable(observable$, initialValue)`

Concurrent-safe subscription built on `useSyncExternalStore`. Returns
`initialValue` until the first emission, then the latest emitted value. Single
subscription per mount; re-subscribes when the observable identity changes.

```tsx
const count = useObservable(count$, 0);
```

### `usePending(source$, getDefaultValue?)`

Wraps any `ObservableLike<T>` (an `Observable<T>` or a plain `T`) into a
`{ status: "pending" | "fulfilled" | "rejected" }` state machine. The
`rejected` shape exposes `onReload` for retry.

```tsx
const status = usePending(user$);

if (status.status === "pending") return <Spinner />;
if (status.status === "rejected") {
  return <button onClick={status.onReload}>Retry</button>;
}
return <div>{status.value.name}</div>;
```

### `<Pending value$={...}>`

Component sugar over `usePending`. Picks one of the `pending` / `rejected` /
`children` render-props based on the current status.

```tsx
<Pending
  value$={user$}
  pending={<Spinner />}
  rejected={({ error, onReload }) => <ErrorView error={error} onRetry={onReload} />}
>
  {(user) => <UserCard user={user} />}
</Pending>
```

### `<BehaviorSubjectRender value$={...}>`

Subscribes to a `BehaviorSubject<T>` and re-renders children with the latest
value. Skips the initial buffered emission (already used as initial state) and
deduplicates with `distinctUntilChanged`.

```tsx
<BehaviorSubjectRender value$={counter$}>
  {(n) => <span>{n}</span>}
</BehaviorSubjectRender>
```

### `<OnlyIfTruthy value$={...}>`

Renders the child only when the resolved value is truthy. The render-prop
receives the value narrowed to `TruthyTypesOf<T>`.

```tsx
<OnlyIfTruthy value$={maybeUser$}>
  {(user) => <UserCard user={user} />}
</OnlyIfTruthy>
```

### `render(data, renderable)`

Low-level helper used by the components above: invokes a function renderable
with `data`, or returns the static `ReactNode`.
