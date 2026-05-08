---
"@vanya2h/store": minor
"@vanya2h/utils-rxjs": minor
---

Add new `@vanya2h/utils-rxjs` package (`batcher`, `createCache`, `persistBehaviorSubject` helpers built on `localStorage`/`getStubTransport`/`getPersistorFactory`/`getBehaviorSubjectPersistor`/`toArrayPersistor`, and `wrapped` status helpers `createIdle`/`createPending`/`createFulfilled`/`createRejected`/`createWrappedPromise`).

Add new `@vanya2h/store` package built on top of `@vanya2h/utils-rxjs` exposing `createGlobalStore`, `createStoreDescriptor`, `fromFetcher`, and the `IStore`/`IGlobalStore`/`IStoreFetcher`/`IStoreDescriptor` types.
