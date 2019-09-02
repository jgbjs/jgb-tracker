import { IBase } from './astTreeNode';
import { THIS } from './constant';
import { Context } from './context';
import { evaluate } from './evaluate';
import { Parser } from './parser';
import { Scope } from './scope';
import { ScopeType } from './type';

export function runInConext(code: string, context: Context = new Context()) {
  const parser = new Parser();
  const ast: IBase = parser.parse(`${code}`);
  const scope = new Scope(ScopeType.Root, null);
  scope.level = 0;
  scope.invasive = true;
  scope.setContext(context);
  return evaluate(ast, scope);
}

export { Context };
