export type ISerializer<T> = {
  parse: (val: string) => unknown;
  stringify: (val: T) => string;
};

export type JsonPrimitive = string | number | boolean | null | bigint | Date;

export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export type JsonArray = JsonValue[] | readonly JsonValue[];

const customReplacer = (_key: string, value: any) => {
  if (typeof value === "bigint") {
    return { type: "bigint", value: value.toString() };
  } else if (value instanceof Date) {
    return { type: "date", value: value.toISOString() };
  }
  return value;
};

// Custom reviver function for JSON.parse
const customReviver = (_key: string, value: any) => {
  if (typeof value === "object" && value !== null) {
    if (value.type === "bigint") {
      return BigInt(value.value);
    } else if (value.type === "date") {
      return new Date(value.value);
    }
  }
  return value;
};

export type JsonObject = {
  [Key in string]: JsonValue;
} & {
  [Key in string]?: JsonValue | undefined;
};

export const jsonSerializer: ISerializer<JsonValue> = {
  parse: (str: string) => JSON.parse(str, customReviver),
  stringify: (val: JsonValue): string => JSON.stringify(val, customReplacer),
};
