import { ArgumentNode, DocumentNode, FieldNode, NameNode, ObjectFieldNode, OperationTypeNode, print, SelectionNode, SelectionSetNode, TypeNode, ValueNode, VariableDefinitionNode, VariableNode } from "graphql";
import { OutputObject, ValidateSchema } from "./schema";
import { Exact, IsSchemaScalar, ScalarTypes } from "./types";
import { UnionTypeNames } from "./union";

export type FieldSentinel = {};
export const _: FieldSentinel = {};

export type GenerateVariableDefinition<Arg> =
  {
    $defaultValue?: Arg,
    $name: string
  }

export type GenerateArgsVariables<FunctionArgs, ArgsFields> =
  {
    [Key in keyof FunctionArgs]: 
      Key extends keyof ArgsFields
        ? FunctionArgs[Key] | GenerateVariableDefinition<FunctionArgs[Key]>
        : never
  }

export type GenerateArgsField<Type, ResolverFunction, ArgsFields> =
  [unknown] extends [ArgsFields]
    ? Type
    : undefined extends ArgsFields
      ? Type
      : ResolverFunction extends (args: infer Args, root: infer Root, context: infer Context) => any
        ? { $args: GenerateArgsVariables<Args, ArgsFields>, $fields: Type }
        : never

export type GenerateObjectType<Query, Type, ResolverFunction, ArgsFields> =
  [Type] extends [{ fields: infer ObjectFields }]
    ? unknown extends ArgsFields
      ? GenerateQuery<Query, ObjectFields>
      : undefined extends ArgsFields
        ? GenerateQuery<Query, ObjectFields>
        : ResolverFunction extends (args: infer Args, root: infer Root, context: infer Context) => any
          ? Query extends { $fields: infer QueryFields }
            ? { $args: GenerateArgsVariables<Args, ArgsFields>, $fields: GenerateQuery<QueryFields, ObjectFields> }
            : { $args: GenerateArgsVariables<Args, ArgsFields>, $fields: GenerateQuery<{}, ObjectFields> }
          : never
    : "Unable to determine type"

type UnionItemForName<UnionType, Name> =
  UnionType extends { name: infer UnionName }
    ? Exact<Name, UnionName> extends true
      ? UnionType
      : never
    : never

export type GenerateQueryField<Query, Resolver> =
  [Resolver] extends [
    {
      type: infer Type,
      argsFields?: infer ArgsFields
      resolve?: infer ResolverFunction
    }
  ]
  ? (
    Type extends { enum: infer Enum }
      ? GenerateArgsField<FieldSentinel, ResolverFunction, ArgsFields>
      : IsSchemaScalar<Type> extends true
        ? GenerateArgsField<FieldSentinel, ResolverFunction, ArgsFields>
        : Type extends { union: infer UnionTypes }
          ? UnionTypes extends Readonly<unknown[]>
            ? Query extends { $on: infer QueryTypes }
              ? {
                __typename?: FieldSentinel,
                $on: {
                  [Key in keyof QueryTypes]?:
                    Key extends UnionTypeNames<UnionTypes[number]>
                    ? UnionItemForName<UnionTypes[number], Key> extends { fields: infer Fields }
                      ? {
                        [FieldKey in keyof Fields]?: GenerateQueryField<QueryTypes[Key], Fields[FieldKey]>
                      }
                      : never
                  : never
                }
              }
              : { $on: { [Key in keyof UnionTypeNames<UnionTypes>]?: {} } }
            : "Should not happen"
          : GenerateObjectType<Query, Type, ResolverFunction, ArgsFields>
    )
  : Resolver extends ScalarTypes
    ? FieldSentinel
    : ["Invalid Resolver", Resolver]

export type GenerateQuery<Query, Schema> = {
  [Key in (keyof Query | keyof Schema)]?:
    Key extends keyof Schema
      ? Key extends keyof Query
        ? GenerateQueryField<Query[Key], Schema[Key]>
        : never
      : never
}

export type GenerateSchema<Query, Schema> = 
  [Schema] extends [{mutations?: infer Mutations, queries?: infer Queries}]
    ? GenerateQuery<Query, Mutations> | GenerateQuery<Query, Queries>
    : never

function getVariableType(schema: any) {
  switch (schema) {
    case 'float':
      return 'Float'
    case 'int':
      return 'Int'
    case 'string':
      return 'String'
    case 'boolean':
      return 'Boolean'
    default:
      switch (schema.type) {
        case 'float':
          return 'Float'
        case 'int':
          return 'Int'
        case 'string':
          return 'String'
        case 'boolean':
          return 'Boolean'
        default:
          return schema.type.name
      }
    }
}

function queryArgValue(schema: any, arg: any, variables: QueryVariables): ValueNode {
  // Literals
  if (arg === null) {
    return { kind: 'NullValue' };
  }

  let value: ValueNode | null = null;
  if (typeof arg === 'string') {
    value = { kind: 'StringValue', value: arg };
  }

  if (typeof arg === 'boolean') {
    value = { kind: 'BooleanValue', value: arg };
  }

  if (typeof arg === 'number') {
    switch (schema) {
      case 'float':
        value = { kind: 'FloatValue', value: arg.toString() };
        break;
      case 'int':
        value = { kind: 'IntValue', value: arg.toString() };
        break;
      default:
        throw new Error();
    }
  }

  if (Array.isArray(arg)) {
    let values = [];
    for (let value of arg) {
      const listValue = queryArgValue(schema, value, variables);
      values.push(listValue)
    }
    value = { kind: "ListValue", values: values };
  }

  if (value) {
    return value;
  }

  if ('$name' in arg) {
    const variableDefinition = variables.get(arg.$name);
    if (variableDefinition) {
      return variableDefinition.variable;
    } else {
      const variable: VariableNode = ({
        kind: 'Variable',
        name: {
          kind: 'Name',
          value: arg.$name
        }
      });

      let variableType: TypeNode = {kind: 'NamedType', name: {kind: 'Name', value: getVariableType(schema)}};
      if (schema.array === 'nullable_items') {
        variableType = {kind: 'ListType', type: variableType};
      } else if (schema.array) {
        variableType = {kind: 'ListType', type: {kind: 'NonNullType', type: variableType}};
      }

      if (!schema.nullable) {
        variableType = {kind: 'NonNullType', type: variableType};
      }

      variables.set(
        arg.$name, 
        {
          kind: 'VariableDefinition',
          variable: variable,
          defaultValue: arg.$defaultValue,
          type: variableType
        }
      );

      return variable;
    } 
  } else {
    let values: ObjectFieldNode[] = [];
    for (let [name, field] of Object.entries<any>(arg)) {
      const listValue = queryArgValue(field, schema.type.fields[name], variables);
      values.push({
        kind: "ObjectField",
        name: {
          kind: "Name",
          value: name
        }, 
        value: listValue
      });
    }
    return (
      {
        kind: "ObjectValue",
        fields: values
      }
    ); 
  }

}

function queryArgs(schema: any, args: any, variables: QueryVariables): ArgumentNode[] | undefined {
  if (args) {
    const argNodes: ArgumentNode[] = [];

    for (let [name, arg] of Object.entries<any>(args)) {
      let argValue = queryArgValue(schema[name], arg, variables);
      argNodes.push(
        {
          kind: 'Argument',
          name: { kind: 'Name', value: name },
          value: argValue
        }
      );
    }

    return argNodes;
  } else {
    return undefined;
  }
}

function queryFields(
  schema: any, 
  queryValue: any, 
  variables: QueryVariables
): SelectionNode[] {
  let fieldNodes: SelectionNode[] = [];
  for (let [name, field] of Object.entries<any>(queryValue)) {
    if (field === _) {
      fieldNodes.push(
        {
          kind: 'Field',
          name: { kind: 'Name', value: field.alias || name },
        }
      );
      continue;
    }

    const [selectionSet, args] = queryObject(
      schema[name], 
      field, 
      variables
    );

    fieldNodes.push(
      {
        kind: 'Field',
        name: { kind: 'Name', value: field.alias || name },
        selectionSet,
        arguments: args
      }
    );
  }

  return fieldNodes;
}

function queryObject(
  schema: any, 
  queryValue: any, 
  variables: QueryVariables
): [SelectionSetNode, ArgumentNode[] | undefined] {
  let fieldNodes: SelectionNode[] = [];
  let argumentNodes: ArgumentNode[] | undefined;
  if ('$args' in queryValue) {
    argumentNodes = queryArgs(schema.argsFields, queryValue.$args, variables);
    fieldNodes = queryFields(schema.type.fields, queryValue['$fields'], variables);
  } else if ('$on' in queryValue) {
    for (let [abstractName, abstractFields] of Object.entries<any>(queryValue['$on'])) {
      let x = null;
      if ('union' in schema.type) {
        for (let item of schema.type.union) {
          if (item.name === abstractName) {
            x = item
          }
        }
      }
      if ('interfaces' in schema.type) {
        for (let item of schema.type.interfaces) {
          if (item.name === abstractName) {
            x = item
          }
        }
      }
      const fragmentNodes = queryFields(
        x,
        abstractFields, 
        variables
      );
      if (fragmentNodes.length > 0) {
        fieldNodes.push({
          kind: 'InlineFragment',
          selectionSet: {
            kind: 'SelectionSet',
            selections: fragmentNodes,
          }, 
          typeCondition: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: abstractName
            }
          }
        });
      }
    }
  } else {
    fieldNodes = queryFields(schema.type.fields, queryValue, variables);
  }

  return ([
    {
      kind: 'SelectionSet',
      selections: fieldNodes,
    }, 
    argumentNodes
  ]);
}

type QueryVariables = Map<string, VariableDefinitionNode>;

export function operation<
  Schema extends ValidateSchema<Schema, any>,
  Operation extends GenerateSchema<Operation, Schema>>
  (
    schema: Schema,
    operation: Operation,
    operationType: OperationTypeNode,
    queryName?: string
  ): DocumentNode {
  const queryNameNode: NameNode | undefined = queryName ? { kind: 'Name', value: queryName } : undefined;
  const variables: QueryVariables = new Map();
  const selections = queryFields(
    schema[operationType === 'query' ? 'queries' : 'mutations'], 
    operation, 
    variables
  );
  return ({
    kind: 'Document',
    definitions: [
      {
        kind: 'OperationDefinition',
        operation: operationType,
        name: queryNameNode,
        selectionSet: {
          kind: 'SelectionSet',
          selections
        },
        variableDefinitions: Array.from(variables.values())
      }
    ]
  });
}

export function query<
  Schema extends ValidateSchema<Schema, any>,
  Query extends GenerateSchema<Query, Schema>
>
(
  schema: Schema,
  query: Query,
  queryName?: string
): DocumentNode {
  return operation(schema, query, 'query', queryName);
}

export function queryGQL<
  Schema extends ValidateSchema<Schema, any>,
  Query extends GenerateSchema<Query, Schema>
>(
  schema: Schema,
  query: Query,
  queryName?: string
): string {
  const document = operation(schema, query, 'query', queryName);
  return print(document);
}

export function mutation<
  Schema extends ValidateSchema<Schema, any>,
  Query extends GenerateSchema<Query, Schema>
>
(
  schema: Schema,
  query: Query,
  queryName?: string
): DocumentNode {
  return operation(schema, query, 'mutation', queryName);
}

export function mutationGQL<
  Schema extends ValidateSchema<Schema, any>,
  Query extends GenerateSchema<Query, Schema>
>(
  schema: Schema,
  query: Query,
  queryName?: string
): string {
  const document = operation(schema, query, 'mutation', queryName);
  return print(document);
}