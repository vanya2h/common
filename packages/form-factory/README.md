# @vanya2h/form-factory

Headless schema-driven form factory built on
[react-hook-form](https://react-hook-form.com) + [zod](https://zod.dev).

**Logic-only** — no DOM, no styling, no built-in error UI, no submit button.
Bring your own components.

## Why

Most form libraries either bundle UI (and you fight them) or are so low-level
that every form becomes copy-paste. This package extracts the bits that _don't_
care about your design system:

- A factory pattern for declaring `schema + getDefaultData` once and reusing it
  with different `submitFn` / `seed` / `onResult` per call site
- An async seed (RxJS `Observable`) so forms can defer mounting until upstream
  data is ready
- A submit pipeline that swallows `p-cancelable` `CancelError`, surfaces other
  errors as `root` form errors, and runs `onResult` on success

You provide the layout, the inputs, the buttons, the error display.

## Install

```sh
pnpm add @vanya2h/form-factory react-hook-form rxjs zod
```

Peer deps: `react ^18 || ^19`, `react-hook-form ^7`, `rxjs ^7`, `zod ^4`.

## Usage

```tsx
import { z } from "zod";
import { of } from "rxjs";
import { createFormFactory, Form, useSubmitState, useFormSeed } from "@vanya2h/form-factory";

const schema = z.object({ email: z.string().email() });

const factory = createFormFactory({
  schema,
  getDefaultData: (_seed: { userId: string }) => ({ email: "" }),
});

function MyForm({ userId }: { userId: string }) {
  const seed$ = useFormSeed({ userId });

  const instance = factory.build({
    seed$,
    submitFn: async (value, seed) => {
      await api.updateEmail(seed.userId, value.email);
    },
    onResult: () => toast("Saved!"),
  });

  return (
    <Form instance={instance} pending={<Spinner />}>
      {({ form, handleSubmit, rootError }) => (
        <form onSubmit={handleSubmit}>
          <input {...form.register("email")} />
          {rootError && <p>{rootError.message}</p>}
          <SubmitButton />
        </form>
      )}
    </Form>
  );
}

function SubmitButton() {
  const { disabled } = useSubmitState();
  return (
    <button type="submit" disabled={disabled}>
      Save
    </button>
  );
}
```

## API

### `createFormFactory({ schema, getDefaultData })`

Returns a reusable factory bound to a zod schema and a default-data function.

- `factory.build({ seed$, submitFn, onResult?, ...rhfProps })` — returns an
  `IFormInstance` you pass to `<Form>` or `useFormFactory`.
- `factory.createSubmitFn(fn)` — type helper that infers `(value, seed)` from
  the schema.

### `createFormStubFactory<TSeed>()`

An empty-schema factory, useful for purely action-driven flows.

### `useFormSeed(default)`

Returns a stable `BehaviorSubject` seeded with `default`. Push new seeds with
`.next(...)` and the form re-renders.

### `<Form instance={...}>{...}</Form>`

Subscribes to `instance.seed$`, wires `useFormFactory`, and provides
`FormProvider` context. No DOM is rendered — only the render prop.

Render-prop receives `{ form, seed, instance, handleSubmit, rootError }`.

Optional: `pending` / `rejected` for the seed-observable lifecycle.

### `useFormFactory({ instance, seed, onResult?, parseErrorMessage? })`

The hook behind `<Form>`. Use directly when you've already resolved the seed.

`parseErrorMessage(err)` — customize how thrown submit errors are stringified
into the `root` form error. Defaults to `error.message ?? String(error)`.

### `useSubmitState()`

Reads the nearest `FormProvider` to return `{ isSubmitting, isValidating, disabled }`
for your submit button.

### `useObservableValue(observable$)`

Subscribes and returns `{ status: "pending" | "fulfilled" | "rejected", ... }`.
Synchronous emissions (e.g. `BehaviorSubject`) resolve to `"fulfilled"` on
first render — no flicker.
