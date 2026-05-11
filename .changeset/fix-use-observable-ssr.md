---
"@vanya2h/utils-rxjs-react": patch
---

Fix SSR warning in `useObservable` by passing `getServerSnapshot` to `useSyncExternalStore`; make `initialValue` optional (returns `T | undefined` when omitted).
