import { useState } from "react";
import { BehaviorSubject } from "rxjs";

/**
 * Create a stable BehaviorSubject seeded with `defaultSeed`.
 * Push new seed values via `.next(...)`; the form will react.
 */
export function useFormSeed<TSeed>(defaultSeed: TSeed) {
  const [seed] = useState(() => new BehaviorSubject(defaultSeed));
  return seed;
}
