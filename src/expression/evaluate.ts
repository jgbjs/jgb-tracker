import { IBase } from './astTreeNode';
import { THIS, UNDEFINED } from './constant';
import { Scope } from './scope';
import { EvaluateMap } from './type';

const visitors: EvaluateMap = {
  Program(program, scope: Scope) {
    for (const node of program.body) {
      evaluate(node, scope);
    }
  },
  Identifier(node, scope) {
    if (node.name === UNDEFINED) {
      return undefined;
    }
    const $var = scope.hasBinding(node.name);
    if ($var) {
      return $var.value;
    } else {
      // throw new Error(`[Error] ${node.loc}, '${node.name}' 未定义`);
      console.error(`[Error] ${node.loc}, '${node.name}' 未定义`);
    }
  },
  BinaryExpression(node, scope) {
    const expr: any = {
      // tslint:disable-next-line
      '==': (a: any, b: any) => a == b,
      // tslint:disable-next-line
      '!=': (a: any, b: any) => a != b,
      '===': (a: any, b: any) => a === b,
      '!==': (a: any, b: any) => a !== b,
      '<': (a: number, b: number) => a < b,
      '<=': (a: number, b: number) => a <= b,
      '>': (a: number, b: number) => a > b,
      '>=': (a: number, b: number) => a >= b,
      // tslint:disable-next-line
      '<<': (a: number, b: number) => a << b,
      // tslint:disable-next-line
      '>>': (a: number, b: number) => a >> b,
      // tslint:disable-next-line
      '>>>': (a: number, b: number) => a >>> b,
      '+': (a: string, b: string) => a + b,
      '-': (a: number, b: number) => a - b,
      '*': (a: number, b: number) => a * b,
      '/': (a: number, b: number) => a / b,
      '%': (a: number, b: number) => a % b,
      // tslint:disable-next-line
      '|': (a: number, b: number) => a | b,
      // tslint:disable-next-line
      '^': (a: number, b: number) => a ^ b,
      // tslint:disable-next-line
      '&': (a: number, b: number) => a & b,
      // "**": (a, b) => {
      //   throw ErrImplement('**')
      // },
      'in': (a: string, b: any) => a in b,
      'instanceof': (a: any, b: any) => a instanceof b
    };
    return expr[node.operator as any](
      evaluate(node.left, scope),
      evaluate(node.right, scope)
    );
  },
  Literal(node) {
    return node.value;
  },
  LogicalExpression(node, scope) {
    return {
      '||': () => evaluate(node.left, scope) || evaluate(node.right, scope),
      '&&': () => evaluate(node.left, scope) && evaluate(node.right, scope)
    }[node.operator]();
  },
  MemberExpression(node, scope) {
    const { object, property, computed } = node;
    if (computed) {
      const literal: any = evaluate(object, scope);
      if (literal) {
        return literal[evaluate(property, scope)];
      }
      return void 0;
    } else {
      const identifier: any = evaluate(object, scope);
      if (identifier) {
        return identifier[property.name];
      }
      return void 0;
    }
  },
  ThisExpression(node, scope) {
    const this_val = scope.hasBinding(THIS);
    return this_val ? this_val.value : null;
  },
  CallExpression(node, scope) {
    const func = evaluate(node.callee, scope);
    const args = node.arguments.map((arg: any) => evaluate(arg, scope));
    if (node.callee.type === 'MemberExpression') {
      const object = evaluate(node.callee.object, scope);
      return func.apply(object, args);
    } else {
      const this_val = scope.hasBinding(THIS);
      return func.apply(this_val ? this_val.value : null, args);
    }
  },
  UnaryExpression(node, scope) {
    const expr = {
      '-': () => -evaluate(node.argument, scope),
      '+': () => +evaluate(node.argument, scope),
      '!': () => !evaluate(node.argument, scope),
      // tslint:disable-next-line: no-bitwise
      '~': () => ~evaluate(node.argument, scope),
      "void": () => void evaluate(node.argument, scope),
      "typeof": () => {
        if (node.argument.type === 'Identifier') {
          const $var = scope.hasBinding(THIS);
          return $var ? typeof $var.value : 'undefined';
        } else {
          return typeof evaluate(node.argument, scope);
        }
      },
      "delete": () => {
        // delete 是真麻烦
        if (node.argument.type === 'MemberExpression') {
          const { object, property, computed } = node.argument;
          if (computed) {
            return delete evaluate(object, scope)[evaluate(property, scope)];
          } else {
            return delete evaluate(object, scope)[property.name];
          }
        } else if (node.argument.type === 'Identifier') {
          const $this = scope.hasBinding(THIS);
          if ($this) {
            return $this.value[node.argument.name];
          }
        }
      }
    };
    return expr[node.operator]();
  },
  ConditionalExpression(node, scope) {
    return evaluate(node.test, scope)
      ? evaluate(node.consequent, scope)
      : evaluate(node.alternate, scope);
  },
  ArrayExpression(node, scope) {
    return node.elements.map((item: any) => evaluate(item, scope));
  }
};

export function evaluate(node: IBase, scope: Scope, arg?: any) {
  // @ts-ignore
  const handler = visitors[node.type];
  return handler(node, scope, arg);
}
