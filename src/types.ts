import { Float, Int } from "type-graphql";
import { InputObject, InputRuntimeTypes } from "./input";

// export class Nullable<T> {
//   clazz: T
//   constructor(clazz: T) {
//     this.clazz = clazz;
//   }
// }

export type AddNull<X> = 
  null extends X ? null : never;

type IsEnum<T> = 
  T extends {[key: string]: string} 
    ? T
    : T extends {[key: number]: string} 
      ? T 
      : never;

export class RegisteredEnum<T> {
  name?: string;
  clazz: T;
  constructor(clazz: T, name?: string) {
    this.clazz = clazz;
    this.name = name;
  }
}

export function registerEnum<T>(clazz: IsEnum<T>, name?: string): RegisteredEnum<T> {
  return new RegisteredEnum(clazz, name);
}

export type ScalarTypes = 
  typeof String | (typeof Float | typeof Int) | typeof Date | typeof Boolean;


// export type NullOrNotNull<X, Y> =
//   null extends X
//     ? Nullable<Y> 
//     : Y;

export type IntOrFloat = typeof Int | typeof Float;

// export type StringOrEnum<R, C, Scalar> =
//     // This is a trick to detect whether Scalar is an enum or not, typescript enums extend string, but string doesn't 
//     // extend Scalar;
//     string extends Scalar 
//       ? NullOrNotNull<Scalar, typeof String | RegisteredResolver<R, C, Scalar>>
//       : NullOrNotNull<Scalar, RegisteredEnum<{[key: string]: string}>>

// // FIXME: The trick for string enums doesn't work for int enums, so we just have to use a union of number and enum here.
// export type NumberOrEnum<R, C, Scalar> =
//   NullOrNotNull<Scalar, IntOrFloat | RegisteredEnum<{[key: number]: string} | RegisteredResolver<R, C, Scalar>>>

export type OtherScalars<Scalar> = 
  Scalar extends Date 
    ? typeof Date
    : Scalar extends boolean 
      ? typeof Boolean
      : never;

export type Constructor<T> = Function & { prototype: T };
// export type ConstructorOrArray<T> = T extends Array<infer C> ? [Constructor<C>] : Constructor<T>;
export type ConstructorFromArray<T> = T extends Array<infer C> ? Constructor<C> : Constructor<T>;

    // ? C extends Constructor<C>
    //   ? [Constructor<C>]
    //   : [C]
    // : Constructor<T>;

export type ArrayItem<I> = I extends Array<infer T> ? T : I; 

// export function nullable<O, C = any>(
//   type: ScalarTypes | Constructor<O>
// ): RegisteredOutputObject<C, Constructor<O> | ScalarTypes | null> {
//   return (
//     {
//       registered: true,
//       type: type,
//       fieldTypes: {},
//       nullable: true
//     }
//   );
// }

export type GenerateScalarReturnType<RT, N, A> =
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


export type ScalarOptions<N extends BooleanOrUndefined, A extends ArrayTrilean> = {
  nullable?: N, 
  array?: A
};

export type GetUnderlyingScalarType<Item> =
  [Item] extends [Date] 
    ? typeof Date
    : [Item] extends [boolean]
      ? typeof Boolean
      : [Item] extends [string]
        ? [string] extends [Item] 
          ? typeof String
          : RegisteredEnum<{[key: string]: string}>
        : [Item] extends [number]
          ? IntOrFloat | RegisteredEnum<{[key: number]: string}>
          : never

export type RegisteredObject<A> = A & {registered: true};

export function makeRegistered<A>(a: A): RegisteredObject<A> {
  return {...a, registered: true};
}

export type ArrayTrilean = boolean | "nullable_items" | undefined;
export type BooleanOrUndefined = boolean | undefined;

export type GenerateArrayTrilean<A> = 
  [Exclude<A, null | undefined>] extends [Array<infer I>] 
    ? [null] extends [I] 
      ? "nullable_items"
      : true
    : false

export function string<C, N extends BooleanOrUndefined, A extends ArrayTrilean>(
  options?: ScalarOptions<N, A>
// ): RegisteredOutputObject<C, GenerateScalarReturnType<string, N, A>, N, A> | RegisteredInputObject<string, N, A> {
): InputObject<string, N, A> {
  return ({
    nullable: options?.nullable,
    array: options?.array,
    type: String,
    // runtimeTypes: {} as OutputRuntimeTypes<any, C, string> | InputRuntimeTypes<string>
    runtimeTypes: {} as InputRuntimeTypes<string>
  });
}

export function date<C, N extends boolean, A extends ArrayTrilean>(
  options?: ScalarOptions<N, A>
// ): RegisteredOutputObject<C, GenerateScalarReturnType<Date, N, A>, N, A> | RegisteredInputObject<Date, N, A> {
): InputObject<Date, N, A> {
  return ({
    nullable: options?.nullable,
    array: options?.array,
    type: Date,
    // runtimeTypes: {} as OutputRuntimeTypes<any, C, Date> | InputRuntimeTypes<Date>
    runtimeTypes: {} as InputRuntimeTypes<Date>
  });
}

export function int<C, N extends boolean, A extends ArrayTrilean>(
  options?: ScalarOptions<N, A>
// ): RegisteredOutputObject<C, GenerateScalarReturnType<number, N, A>, N, A> | RegisteredInputObject<number, N, A> {
): InputObject<number, N, A> {
  return ({
    nullable: options?.nullable,
    array: options?.array,
    type: Int,
    // runtimeTypes: {} as OutputRuntimeTypes<any, C, number> | InputRuntimeTypes<number>
    runtimeTypes: {} as InputRuntimeTypes<number>
  });
}

export function float<C, N extends boolean, A extends ArrayTrilean>(
  options?: ScalarOptions<N, A>
): InputObject<number, N, A> {
  return ({
    nullable: options?.nullable,
    array: options?.array,
    type: Float,
    // runtimeTypes: {} as OutputRuntimeTypes<any, C, number> | InputRuntimeTypes<number>
    runtimeTypes: {} as InputRuntimeTypes<number>
  });
}

export function boolean<C, N extends boolean, A extends ArrayTrilean>(
  options?: ScalarOptions<N, A>
): InputObject<boolean, N, A> {
  return ({
    nullable: options?.nullable,
    array: options?.array,
    type: Boolean,
    // runtimeTypes: {} as OutputRuntimeTypes<any, C, boolean> | InputRuntimeTypes<boolean>
    runtimeTypes: {} as InputRuntimeTypes<boolean>
  });
}

export type IsNull<O> = 
  [null] extends [O] 
    ? true : false;
export type IncludeNull<O> = [null] extends [O] ? null : never;

export type GetUnderlyingArrayType<A> =
  [Exclude<A, null | undefined>] extends [Array<infer T>] ? T : A

export type GetUnderlyingRuntimeType<Item> =
  [Exclude<Item, null | undefined>] extends [Array<infer ArrayType>] 
    ? [GetUnderlyingScalarType<Exclude<ArrayType, null | undefined>>] extends [never] 
      ? Constructor<Exclude<ArrayType, null | undefined>>
      : GetUnderlyingScalarType<Exclude<ArrayType, null | undefined>>
    : [GetUnderlyingScalarType<Exclude<Item, null | undefined>>] extends [never] 
      ? Constructor<Exclude<Item, null | undefined>>
      : GetUnderlyingScalarType<Exclude<Item, null | undefined>>
  // [GetUnderlyingScalarType<GetUnderlyingArrayType<Exclude<Item, null | undefined>>>] extends [never] 
  //   ? GetUnderlyingArrayType<Exclude<Item, null | undefined>>
  //     : GetUnderlyingScalarType<GetUnderlyingArrayType<Exclude<Item, null | undefined>>>