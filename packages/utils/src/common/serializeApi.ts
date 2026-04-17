export function serializeApi(obj: Record<string, unknown>): string {
  const sorted = sortObjectEntries(obj);
  return JSON.stringify(sorted, replacer, 2);
}

function sortObjectEntries<T extends Record<string, unknown>>(obj: T): [string, T[keyof T]][] {
  const entries = Object.entries(obj) as [string, T[keyof T]][];
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries;
}

function isZodSchema(value: unknown): value is Record<string, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    "def" in value &&
    typeof (value as Record<string, unknown>).def === "object" &&
    (value as Record<string, unknown>).def !== null &&
    "type" in ((value as Record<string, unknown>).def as Record<string, unknown>) &&
    typeof (value as Record<string, unknown>).parse === "function"
  );
}

function compactZodSchema(schema: Record<string, any>): string {
  const type: string | undefined = schema.def?.type;
  if (!type) return "ZodUnknown";

  switch (type) {
    case "object": {
      const shape = schema.def.shape;
      if (!shape || typeof shape !== "object") return "ZodObject";
      const fields = Object.entries(shape)
        .map(([key, val]) => {
          if (isZodSchema(val)) return `${key}: ${compactZodSchema(val)}`;
          return key;
        })
        .join(", ");
      return `ZodObject { ${fields} }`;
    }
    case "string":
      return "ZodString";
    case "number":
      return "ZodNumber";
    case "boolean":
      return "ZodBoolean";
    case "bigint":
      return "ZodBigInt";
    case "any":
      return "ZodAny";
    case "unknown":
      return "ZodUnknown";
    case "void":
      return "ZodVoid";
    case "null":
      return "ZodNull";
    case "undefined":
      return "ZodUndefined";
    case "never":
      return "ZodNever";
    case "array": {
      const element = schema.def.element;
      if (isZodSchema(element)) return `ZodArray<${compactZodSchema(element)}>`;
      return "ZodArray";
    }
    case "pipe": {
      const parts: string[] = [];
      if (isZodSchema(schema.def.in)) parts.push(compactZodSchema(schema.def.in));
      if (isZodSchema(schema.def.out)) parts.push(compactZodSchema(schema.def.out));
      return parts.length ? `ZodPipe<${parts.join(", ")}>` : "ZodPipe";
    }
    case "optional": {
      const inner = schema.def.innerType;
      if (isZodSchema(inner)) return `ZodOptional<${compactZodSchema(inner)}>`;
      return "ZodOptional";
    }
    case "nullable": {
      const inner = schema.def.innerType;
      if (isZodSchema(inner)) return `ZodNullable<${compactZodSchema(inner)}>`;
      return "ZodNullable";
    }
    case "union": {
      const options = schema.def.options;
      if (Array.isArray(options)) {
        const opts = options.filter(isZodSchema).map(compactZodSchema);
        if (opts.length) return `ZodUnion<${opts.join(" | ")}>`;
      }
      return "ZodUnion";
    }
    case "intersection": {
      const parts: string[] = [];
      if (isZodSchema(schema.def.left)) parts.push(compactZodSchema(schema.def.left));
      if (isZodSchema(schema.def.right)) parts.push(compactZodSchema(schema.def.right));
      return parts.length ? `ZodIntersection<${parts.join(" & ")}>` : "ZodIntersection";
    }
    case "enum": {
      const values = schema.def.entries;
      if (Array.isArray(values)) return `ZodEnum<${values.join(" | ")}>`;
      if (typeof values === "object" && values !== null) return `ZodEnum<${Object.keys(values).join(" | ")}>`;
      return "ZodEnum";
    }
    case "literal": {
      return `ZodLiteral<${JSON.stringify(schema.def.value)}>`;
    }
    case "tuple": {
      const items = schema.def.items;
      if (Array.isArray(items)) {
        const compacted = items.filter(isZodSchema).map(compactZodSchema);
        return `ZodTuple<[${compacted.join(", ")}]>`;
      }
      return "ZodTuple";
    }
    case "record": {
      const valueType = schema.def.valueType;
      if (isZodSchema(valueType)) return `ZodRecord<${compactZodSchema(valueType)}>`;
      return "ZodRecord";
    }
    case "transform":
      return "ZodTransform";
    case "preprocess":
      return "ZodPreprocess";
    case "default": {
      const inner = schema.def.innerType;
      if (isZodSchema(inner)) return `ZodDefault<${compactZodSchema(inner)}>`;
      return "ZodDefault";
    }
    case "catch": {
      const inner = schema.def.innerType;
      if (isZodSchema(inner)) return `ZodCatch<${compactZodSchema(inner)}>`;
      return "ZodCatch";
    }
    default:
      return `Zod(${type})`;
  }
}

function replacer(_key: string, value: unknown): unknown {
  if (isZodSchema(value)) {
    return compactZodSchema(value);
  }
  if (typeof value === "function") {
    const fnName = value.name || "anonymous";
    return `[Function: ${fnName}]`;
  }
  return value;
}
