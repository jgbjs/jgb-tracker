import {
  IArrayExpression,
  IBase,
  IBinaryExpression,
  ICallExpression,
  IConditionalExpression,
  ILogicalExpression,
  IUnaryExpression
} from './astTreeNode';
import {
  IIdentifier,
  ILiteral,
  IMemberExpression,
  IProgram,
  IThisExpression
} from './astTreeNode';
import { Scope } from './scope';

export interface INodeTypeMap {
  Program: IProgram;
  Identifier: IIdentifier;
  MemberExpression: IMemberExpression;
  Literal: ILiteral;
  ThisExpression: IThisExpression;
  CallExpression: ICallExpression;
  UnaryExpression: IUnaryExpression;
  BinaryExpression: IBinaryExpression;
  LogicalExpression: ILogicalExpression;
  ConditionalExpression: IConditionalExpression;
  ArrayExpression: IArrayExpression;
}

export type EvaluateMap = {
  [key in keyof INodeTypeMap]: (
    node: INodeTypeMap[key],
    scope: Scope,
    arg?: any
  ) => any;
};

export type EvaluateFunc = (node: IBase, scope: Scope, arg?: any) => any;

export enum Kind {
  Var = 'var',
  Const = 'const',
  Let = 'let'
}

export type KindType = 'var' | 'const' | 'let';

export enum ScopeType {
  Root,
  Function, // isolated scope
  Method, // isolated scope
  Constructor, // isolated scope
  For,
  ForChild,
  ForIn,
  ForOf,
  While,
  DoWhile,
  Do,
  Switch,
  If,
  ElseIf,
  Object,
  Try,
  Catch,
  Finally,
  Class,
  Block
}

export const isolatedScopeMap = {
  [ScopeType.Function]: true,
  [ScopeType.Constructor]: true,
  [ScopeType.Method]: true,
  [ScopeType.Object]: true
};
