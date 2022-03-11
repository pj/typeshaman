import { RegisteredArgsObject } from "./args";
import { RegisteredOutputObject } from "./output"
import { ArrayTrilean, GenerateScalarReturnType, ScalarTypes } from "./types";

export type Resolver<R, C, A, O, N extends boolean, Arr extends ArrayTrilean> = {
  args?: RegisteredArgsObject<A>
  type: RegisteredOutputObject<C, O, N, Arr>,
  nullable?: N,
  array?: Arr,
  name?: string,
  description?: string,
  deprecationReason?: string,
  resolve: (args: A, root: R, context: C) => Promise<GenerateScalarReturnType<O, N, Arr>>
}

export type RegisteredResolver<R, C, A, O, N extends boolean, Arr extends boolean | "nullable_items"> = 
  Resolver<R, C, A, O, N, Arr> & {registered: true};

// FIXME: resolver is separate from query because I couldn't find a way to make args dependant on the type of the 
// resolve function
export function query<R, A, O, N extends boolean, Arr extends boolean | "nullable_items", C = any>(
  query: Resolver<R, C, A, O, N, Arr>
): RegisteredResolver<R, C, A, O, N, Arr> {
  return {...query, registered: true};
}
