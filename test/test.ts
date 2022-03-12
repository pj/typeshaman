import { Float, Int } from "type-graphql";
// import { schema } from "../src";
// import { mutation } from "../src/mutation";
import { OutputRuntimeTypes } from "../src/output";
import { ConstructorFromArray, registerEnum } from "../src/types";

export class Test {
  constructor(
    public stringField: string,
    public booleanField: boolean,
    public dateField: Date | null,
    public intField: number,
    public floatField: number,
    public relatedField: RelatedClass,
    public arrayRelatedField: ArrayRelatedClass[], 
    public stringEnumField: StringEnum,
    public numberEnumField: IntEnum,
    public arrayField: string[],
    public nullableArrayField: string[] | null,
    public queriedField: RelatedClass,
    public nullableRelatedField: RelatedClass | null
  ) {
  }
}

export class RelatedClass {
  testField: string;

  constructor(testField: string) {
    this.testField = testField;
  }
}

export class ArrayRelatedClass {
  asdfField: string;

  constructor(asdfField: string) {
    this.asdfField = asdfField;
  }
}

export class TestInputObject {
  constructor(
    public stringField: string,
    public booleanField: boolean,
    public dateField: Date,
    public numberField: number,
    public nullableField: string | null,
    public arrayField: string[],
    public nullableArrayField: string[] | null,
    public nullableItemsField: (string | null)[]
  ) {}
}

export class Args {
  constructor(
    public stringField: string,
    public booleanField: boolean,
    public dateField: Date,
    public numberField: number,
    public nullableField: string | null,
    public arrayField: string[],
    public nullableArrayField: string[] | null,
    public nullableItemsField: (string | null)[],
    public inputObjectField: TestInputObject,
    public nullableInputObjectField: TestInputObject | null,
    public inputObjectArray: TestInputObject[],
    public inputObjectNullableItems: (TestInputObject | null)[],
    public nullableInputObjectNullableItems: (TestInputObject | null)[] | null,
  ) {
  }
}

export async function test(args: Args): Promise<Test> {
  return new Test(
    "asdf",
    false,
    new Date(),
    1,
    1.0,
    new RelatedClass("qwer"),
    [new ArrayRelatedClass("test")],
    StringEnum.asdf,
    IntEnum.second,
    ["goodbye"],
    ["hello", "world"],
    new RelatedClass("hello"),
    null
  );
}

enum StringEnum {
  erer = "erer",
  asdf = "asdf"
}

enum IntEnum {
  first,
  second
}

// const registedArgs = args({
//     object: Args,
//     fieldTypes: {
//       stringField: String,
//       booleanField: Boolean,
//       dateField: Date,
//     }
//   });

// const testQuery = query({
//   resolve: test,
//   args: registedArgs,
//   output: object({
//     type: Test,
//     fieldTypes: {
//       stringField: query({
//         output: String,
//         resolve: async (root: Test) => {
//           return `${root.stringField} is being resolved`;
//         }
//       }),
//       booleanField: Boolean,
//       dateField: date(),
//       stringEnumField: registerEnum(StringEnum),
//       numberEnumField: registerEnum(IntEnum),
//       intField: Int,
//       floatField: Float,
//       // extra: () => object({
//       //   object: ASDF,
//       //   resolve: (root: Test): ASDF => {
//       //     return ASDF.asdf;
//       //   },
//       // }),
//       relatedField: resolver({
//         output: object({
//           type: RelatedClass,
//           fieldTypes: {
//             testField: String
//           },
//         }),
//         resolve: async (root: Test) => {
//           return new RelatedClass(`${root.intField} times`);
//         },
//       }),
//       arrayRelatedField: array({
//         output: object({
//           type: ArrayRelatedClass,
//           fieldTypes: {
//             asdfField: String
//           }
//         }),
//         resolve: async () => {
//           return [new ArrayRelatedClass("array related")];
//         },
//       }),
//       arrayField: array({
//         output: String,
//         resolve: async (root: Test) => {
//           return root.arrayField;
//         }
//       }),
//       nullableArrayField: nullable(
//         array({
//           output: String,
//           resolve: async (root: Test): Promise<string[] | null> => {
//             return root.nullableArrayField
//           }
//         })
//       ),
//       queriedField: query({
//         output: object({
//           type: RelatedClass,
//           fieldTypes: {
//             testField: String
//           }
//         }),
//         args: registedArgs,
//         resolve: async (args: Args, root: Test): Promise<RelatedClass> => {
//           return root.queriedField;
//         }
//       }),
//       nullableRelatedField: nullable(
//         resolver({
//           output: object({
//             type: RelatedClass,
//             fieldTypes: {
//               testField: String
//             },
//           }),
//           resolve: async (root: Test) => {
//             return root.nullableRelatedField;
//           },
//         })
//       ),
//     }
//   })
// });

// // type X = OutputRuntimeTypes<any, any, {asdf: string[] | null}>
// // type Y = HandleArray<any, any, string[], RelatedClass | null>
// type X = GenerateScalarReturnType<string, false, true>;
// type Y = GenerateScalarReturnType<string, true, "nullable_items">;
// type Z = GenerateScalarReturnType<RelatedClass, undefined, undefined>;
// type A = GenerateScalarReturnType<RelatedClass, true, undefined>;

// type B = OutputRuntimeTypes<any, any, {x: RelatedClass | null}>

// type C = never

// schema({
//   queries: {
//     testQuery
//   }, 
//   mutations: {
//     testMutation: mutation({
//       args: registedArgs,
//       mutate: async (args: Args, context: any) => {
//         return new RelatedClass("asdf");
//       },
//       output: object({
//         type: RelatedClass,
//         fieldTypes: {
//           testField: String
//         }
//       })
//     })
//   }
// });