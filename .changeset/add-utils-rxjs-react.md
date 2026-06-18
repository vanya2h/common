---
"@vanya2h/utils-rxjs-react": minor
---

Initial release. React bindings for RxJS: `useObservable` (concurrent-safe `useSyncExternalStore`-based subscription), `usePending` (status state machine with `onReload`), `<Pending>`, `<BehaviorSubjectRender>`, `<OnlyIfTruthy>`, and a small `render` helper. Late-unwraps observables at the leaf to localize re-renders.
