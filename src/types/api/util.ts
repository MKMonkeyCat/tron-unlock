type Trim<S extends string> = S extends ` ${infer T}`
  ? Trim<T>
  : S extends `${infer T} `
    ? Trim<T>
    : S;

type CleanPercent20<S extends string> = S extends `${infer L}%20${infer R}`
  ? CleanPercent20<`${L}${R}`>
  : S;

// Parse "department(id,name)" into { key: "department", sub: "id,name" }
type ParseNested<S extends string> =
  S extends `${infer Key}(${infer Sub})${infer Rest}`
    ? [{ key: Trim<Key>; sub: Sub }, ...ParseNested<Rest>]
    : S extends `${infer Key},${infer Rest}`
      ? [{ key: Trim<Key>; sub: true }, ...ParseNested<Rest>]
      : S extends ''
        ? []
        : [{ key: Trim<S>; sub: true }];

type ConstructResponse<Parts extends any[], Model> = {
  [P in Parts[number] as P['key'] & keyof Model]: P['sub'] extends true
    ? Model[P['key']] // If sub is true, return the type of this key
    : Model[P['key']] extends Array<infer Item>
      ? Array<FieldsToResponse<P['sub'], Item>> // If it's an array, apply FieldsToResponse to the item type
      : FieldsToResponse<P['sub'], Model[P['key']]>; // Otherwise, recursively construct the response for the nested fields
};

export type FieldsToResponse<F extends string, Model> = string extends F
  ? Model // If F is just string, we can't parse it, so return the whole model
  : ConstructResponse<ParseNested<CleanPercent20<F>>, Model>;

export type Nullable<T> = T | null;
