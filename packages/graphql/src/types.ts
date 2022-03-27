export type Exact<A, B> =
  [A] extends [B]
    ? [B] extends [A]
      ? true
      : false
    : false

export type GetUnderlyingType<A> =
  [Exclude<A, null | undefined>] extends [Promise<infer P>]
    ? [Exclude<P, null | undefined>] extends [Array<infer T>] 
      ? Exclude<T, null | undefined> 
      : Exclude<P, null | undefined>
    : [Exclude<A, null | undefined>] extends [Array<infer T>] 
      ? Exclude<T, null | undefined> 
      : Exclude<A, null | undefined>

export enum ScalarTypes {
  STRING,
  FLOAT,
  INT,
  BOOLEAN
}

export type IsTypeScalar<Type> = 
  [GetUnderlyingType<Type>] extends [string | number | boolean]
    ? true
    : false

export type Constructor<T> = Function & { prototype: T };

export type GetIfArray<I> = I extends Array<infer T> ? T : I; 

export type GetSchemaScalar<Scalar> =
  [GetUnderlyingType<Scalar>] extends [infer Item]
    ? Item extends boolean
      ? ScalarTypes.BOOLEAN
      : Item extends string
        ? ScalarTypes.STRING
        : Item extends number
          ? ScalarTypes.INT | ScalarTypes.FLOAT
          : never
    : "Should not happen"

export type IsSchemaScalar<Item> =
  [GetUnderlyingType<Item>] extends [infer Type]
    ? GetSchemaScalar<Type> extends never
      ? false
      : true
    : "Should not happen"

export type IsNonNullNonArrayTypeScalar<Scalar> =
  [null] extends [Scalar]
    ? false
    : [Scalar] extends [Array<infer X>]
      ? false
      : [IsTypeScalar<Scalar>] extends [true]
        ? true
        : false

export type GetTypeScalar<Scalar> =
  [GetUnderlyingType<Scalar>] extends [infer Item]
    ? Item extends ScalarTypes.BOOLEAN
      ? boolean
      : Item extends ScalarTypes.STRING
        ? string
        : Item extends ScalarTypes.INT
          ? number
          : Item extends ScalarTypes.FLOAT
            ? number
            : "Unknown type scalar"
    : "Should not happen"

export type ArrayTrilean = boolean | "nullable_items" | undefined;
export type CreateSchemaOptions<Item> = 
  [Item] extends [unknown]
    ? [unknown] extends [Item]
      ? {nullable?: unknown, array?: unknown}
      : 
        (
          [null] extends [Item]
            ? { nullable: true }
            : { nullable?: false }
        )
        & 
        (
          [GenerateArrayTrilean<Item>] extends [false]
            ? { array?: false }
            : [GenerateArrayTrilean<Item>] extends ["nullable_items"]
              ? {array: "nullable_items"}
              : {array: true}
        )
    : "asdf"

export type GenerateArrayTrilean<A> = 
  [Exclude<A, null | undefined>] extends [Array<infer I>] 
    ? [null] extends [I] 
      ? "nullable_items"
      : true
    : false

export type CreateTypeFromSchemaOptions<RT, N, A> =
  [A] extends [true]
    ? [N] extends [false | undefined]
      ? Array<RT>
      : Array<RT> | null
    : [A] extends ["nullable_items"] 
      ? [N] extends [false | undefined]
        ? Array<RT | null>
        : Array<RT | null> | null
      : [N] extends [false | undefined]
        ? RT
        : RT | null

export type BooleanOrUndefined = boolean | undefined;

export type RemovePromise<P> =
  [P] extends [Promise<infer T>]
    ? T
    : P

export type TransformResolverToType<Schema> =
  Schema extends {type: infer CompileTimeType, nullable?: infer Nullable, array?: infer IsArray}
    ? CreateTypeFromSchemaOptions<
        (
          IsTypeScalar<CompileTimeType> extends true
            ? GetTypeScalar<CompileTimeType>
            : CompileTimeType extends {fields: infer Fields}
              ? {
                  [Key in keyof Fields]: TransformResolverToType<Fields[Key]>
                }
              : CompileTimeType extends {enum: infer Enum}
                ? Enum
                : CompileTimeType extends {union: infer Union}
                  ? Union extends unknown[]
                    ? TransformObjectSchemaToType<Union[number]>
                    : "Union must be an array"
                  : "Unable to infer type"
          ), 
          Nullable, 
          IsArray
        >
    : IsTypeScalar<Schema> extends true
      ? GetTypeScalar<Schema>
      : "Unable to infer type"

export type TransformObjectSchemaToType<ObjectSchema> =
  ObjectSchema extends {fields: infer Fields}
    ? {
        [Key in keyof Fields]:
          TransformResolverToType<Fields[Key]>
      }
    : "Not an object"