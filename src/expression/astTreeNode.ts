export const binary_ops = {
  "||": 1,
  "&&": 2,
  "|": 3,
  "^": 4,
  "&": 5,
  "==": 6,
  "!=": 6,
  "===": 6,
  "!==": 6,
  "<": 7,
  ">": 7,
  "<=": 7,
  ">=": 7,
  "<<": 8,
  ">>": 8,
  ">>>": 8,
  "+": 9,
  "-": 9,
  "*": 10,
  "/": 10,
  "%": 10
};

export type IBinaryOps = keyof typeof binary_ops;

export interface IBase {
  type: string;
  [key: string]: any;
}

export interface IProgram extends IBase {
  body: IBase[];
}

export interface ILiteral extends IBase {
  value: any;
  raw: string;
}

export interface INumberLiteral extends ILiteral {
  value: number;
}

export interface IStringLiteral extends ILiteral {
  value: string;
}

export interface IIdentifier extends IBase {
  name: string;
}

export interface IThisExpression extends IBase {
  type: string;
}

export interface IMemberExpression extends IBase {
  computed: boolean;
  object: any;
  property: IBase;
}

export interface IArrayExpression extends IBase {
  elements: INodeArguments;
}

export interface IUnaryExpression extends IBase {
  argument: IBase;
  operator: "-" | "+" | "!" | "~" | "void" | "typeof" | "delete";
}

export interface ILogicalExpression extends IBase {
  left: IBase;
  right: IBase;
  operator: "||" | "&&";
}

export interface IConditionalExpression extends IBase {
  test: IBase;
  consequent: IBase;
  alternate: IBase;
}

export interface IBinaryExpression extends IBase {
  operator: IBinaryOps;
  left: any;
  right: any;
}

export interface INodeArguments extends Array<IBase | null> {}

export interface ICallExpression extends IBase {
  arguments: INodeArguments;
  callee: any;
}
