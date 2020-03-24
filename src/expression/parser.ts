import {
  binary_ops,
  IArrayExpression,
  IBase,
  IBinaryExpression,
  IBinaryOps,
  ICallExpression,
  IIdentifier,
  ILiteral,
  IMemberExpression,
  INodeArguments,
  INumberLiteral,
  IProgram,
  IStringLiteral,
  IThisExpression
} from './astTreeNode';

// https://github.com/soney/jsep/blob/master/src/jsep.js

const PROGRAM = 'Program';
const IDENTIFIER = 'Identifier';
const MEMBER_EXP = 'MemberExpression';
const LITERAL = 'Literal';
const THIS_EXP = 'ThisExpression';
const CALL_EXP = 'CallExpression';
const UNARY_EXP = 'UnaryExpression';
const BINARY_EXP = 'BinaryExpression';
const LOGICAL_EXP = 'LogicalExpression';
const CONDITIONAL_EXP = 'ConditionalExpression';
const ARRAY_EXP = 'ArrayExpression';
const PERIOD_CODE = 46; // '.'
const COMMA_CODE = 44; // ','
const SQUOTE_CODE = 39; // single quote
const DQUOTE_CODE = 34; // double quotes
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const QUMARK_CODE = 63; // ?
const SEMCOL_CODE = 59; // ;
const COLON_CODE = 58; // :
const t = true; // Set `t` to `true` to save space (when minified, not gzipped)
const unary_ops = { '-': t, '!': t, '~': t, '+': t };

const max_unop_len = getMaxKeyLen(unary_ops);
const max_binop_len = getMaxKeyLen(binary_ops);
// Store the values to return for the various literals we may encounter
const literals = {
  false: false,
  null: null,
  true: true
};
const this_str = 'this';

function throwError(message: string, index: string | number) {
  const error: any = new Error(message + ' at character ' + index);
  error.index = index;
  error.description = message;
  throw error;
}

// Get return the longest key length of any object
function getMaxKeyLen(obj: any) {
  let max_len = 0;
  let len;
  for (const key in obj) {
    // tslint:disable-next-line: no-conditional-assignment
    if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
      max_len = len;
    }
  }
  return max_len;
}
// Returns the precedence of a binary operator or `0` if it isn't a binary operator
function binaryPrecedence(op_val: any) {
  return binary_ops[op_val as IBinaryOps] || 0;
}
// Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
function createBinaryExpression(
  operator: IBinaryOps,
  left: any,
  right: any
): IBinaryExpression {
  const type =
    operator === '||' || operator === '&&' ? LOGICAL_EXP : BINARY_EXP;
  return {
    type,
    operator,
    left,
    right
  };
}
// `ch` is a character code in the next three functions
function isDecimalDigit(ch: number) {
  return ch >= 48 && ch <= 57; // 0...9
}

function isIdentifierStart(ch: number) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 128 && !binary_ops[String.fromCharCode(ch) as IBinaryOps])
  ); // any non-ASCII that is not an operator
}

function isIdentifierPart(ch: number) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // a...z
    (ch >= 48 && ch <= 57) || // 0...9
    (ch >= 128 && !binary_ops[String.fromCharCode(ch) as IBinaryOps])
  ); // any non-ASCII that is not an operator
}

const charAtFunc = String.prototype.charAt;
const charCodeAtFunc = String.prototype.charCodeAt;

export class Parser {
  expr: string = '';
  index = 0;
  length = 0;

  parse(expr: string): IProgram {
    const length = expr.length;
    const nodes = [] as any[];
    let node: any;
    let ch_i: any;
    this.expr = expr;
    this.length = length;

    while (this.index < length) {
      ch_i = this.exprICode(this.index);

      // Expressions can be separated by semicolons, commas, or just inferred without any
      // separators
      if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
        this.index++; // ignore separators
      } else {
        // Try to gobble each expression individually
        // tslint:disable-next-line: no-conditional-assignment
        if ((node = this.gobbleExpression())) {
          nodes.push(node);
          // If we weren't able to find a binary expression and are out of room, then
          // the expression passed in probably has too much
        } else if (this.index < length) {
          throwError('Unexpected "' + this.exprI(this.index) + '"', this.index);
        }
      }
    }

    // If there's only one expression just try returning the expression
    if (nodes.length === 1) {
      return nodes[0];
    }
    return {
      type: PROGRAM,
      body: nodes
    };
  }

  exprI(i: number) {
    return charAtFunc.call(this.expr, i);
  }

  exprICode(i: number) {
    return charCodeAtFunc.call(this.expr, i);
  }
  // Push `index` up to the next non-space character
  gobbleSpaces() {
    let ch = this.exprICode(this.index);
    // space or tab
    while (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
      ch = this.exprICode(++this.index);
    }
  }
  // The main parsing function. Much of this code is dedicated to ternary expressions
  gobbleExpression(): any {
    const test = this.gobbleBinaryExpression();
    let consequent;
    let alternate;
    this.gobbleSpaces();
    if (this.exprICode(this.index) === QUMARK_CODE) {
      // Ternary expression: test ? consequent : alternate
      this.index++;
      consequent = this.gobbleExpression();
      if (!consequent) {
        throwError('Expected expression', this.index);
      }
      this.gobbleSpaces();
      if (this.exprICode(this.index) === COLON_CODE) {
        this.index++;
        alternate = this.gobbleExpression();
        if (!alternate) {
          throwError('Expected expression', this.index);
        }
        return {
          type: CONDITIONAL_EXP,
          test,
          consequent,
          alternate
        };
      } else {
        throwError('Expected :', this.index);
      }
    } else {
      return test;
    }
  }

  // Search for the operation portion of the string (e.g. `+`, `===`)
  // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
  // and move down from 3 to 2 to 1 character until a matching binary operation is found
  // then, return that binary operation
  gobbleBinaryOp(): IBinaryOps | false {
    this.gobbleSpaces();
    let biop;
    let to_check = this.expr.substr(this.index, max_binop_len);
    let tc_len = to_check.length;
    while (tc_len > 0) {
      // Don't accept a binary op when it is an identifier.
      // Binary ops that start with a identifier-valid character must be followed
      // by a non identifier-part valid character
      if (
        binary_ops.hasOwnProperty(to_check) &&
        (!isIdentifierStart(this.exprICode(this.index)) ||
          (this.index + to_check.length < this.expr.length &&
            !isIdentifierPart(this.exprICode(this.index + to_check.length))))
      ) {
        this.index += tc_len;
        return to_check as IBinaryOps;
      }
      to_check = to_check.substr(0, --tc_len);
    }
    return false;
  }
  // This function is responsible for gobbling an individual expression,
  // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
  gobbleBinaryExpression(): IBinaryExpression {
    let ch_i, node, prec, left, right, i, cur_biop;
    interface IBiopInfo {
      value: IBinaryOps;
      prec: number;
    }
    let biop: IBinaryOps;
    let stack: [any, IBiopInfo, any];
    let biop_info: IBiopInfo;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    left = this.gobbleToken();
    biop = (this.gobbleBinaryOp() as any) as IBinaryOps;

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    biop_info = { value: biop, prec: binaryPrecedence(biop) };

    right = this.gobbleToken();
    if (!right) {
      throwError('Expected expression after ' + biop, this.index);
    }
    stack = [left, biop_info, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    while ((biop = this.gobbleBinaryOp() as IBinaryOps)) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        break;
      }
      biop_info = { value: biop, prec };

      cur_biop = biop;
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = createBinaryExpression(biop, left, right);
        stack.push(node);
      }

      node = this.gobbleToken();
      if (!node) {
        throwError('Expected expression after ' + cur_biop, this.index);
      }
      stack.push(biop_info, node);
    }

    i = stack.length - 1;
    node = stack[i];
    while (i > 1) {
      node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
      i -= 2;
    }
    return node;
  }

  // An individual part of a binary expression:
  // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
  gobbleToken(): any {
    let ch, to_check, tc_len;

    this.gobbleSpaces();
    ch = this.exprICode(this.index);

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return this.gobbleNumericLiteral();
    } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return this.gobbleStringLiteral();
    } else if (ch === OBRACK_CODE) {
      return this.gobbleArray();
    } else {
      to_check = this.expr.substr(this.index, max_unop_len);
      tc_len = to_check.length;
      while (tc_len > 0) {
        // Don't accept an unary op when it is an identifier.
        // Unary ops that start with a identifier-valid character must be followed
        // by a non identifier-part valid character
        if (
          unary_ops.hasOwnProperty(to_check) &&
          (!isIdentifierStart(this.exprICode(this.index)) ||
            (this.index + to_check.length < this.expr.length &&
              !isIdentifierPart(this.exprICode(this.index + to_check.length))))
        ) {
          this.index += tc_len;
          return {
            type: UNARY_EXP,
            operator: to_check,
            argument: this.gobbleToken(),
            prefix: true
          };
        }
        to_check = to_check.substr(0, --tc_len);
      }

      if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
        // open parenthesis
        // `foo`, `bar.baz`
        return this.gobbleVariable();
      }
    }

    return false;
  }

  // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
  // keep track of everything in the numeric literal and then calling `parseFloat` on that string
  gobbleNumericLiteral(): INumberLiteral {
    let number = '';
    let ch;
    let chCode;
    while (isDecimalDigit(this.exprICode(this.index))) {
      number += this.exprI(this.index++);
    }

    if (this.exprICode(this.index) === PERIOD_CODE) {
      // can start with a decimal marker
      number += this.exprI(this.index++);

      while (isDecimalDigit(this.exprICode(this.index))) {
        number += this.exprI(this.index++);
      }
    }

    ch = this.exprI(this.index);
    if (ch === 'e' || ch === 'E') {
      // exponent marker
      number += this.exprI(this.index++);
      ch = this.exprI(this.index);
      if (ch === '+' || ch === '-') {
        // exponent sign
        number += this.exprI(this.index++);
      }
      while (isDecimalDigit(this.exprICode(this.index))) {
        // exponent itself
        number += this.exprI(this.index++);
      }
      if (!isDecimalDigit(this.exprICode(this.index - 1))) {
        throwError(
          'Expected exponent (' + number + this.exprI(this.index) + ')',
          this.index
        );
      }
    }

    chCode = this.exprICode(this.index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      throwError(
        'Variable names cannot start with a number (' +
          number +
          this.exprI(this.index) +
          ')',
        this.index
      );
    } else if (chCode === PERIOD_CODE) {
      throwError('Unexpected period', this.index);
    }

    return {
      type: LITERAL,
      value: parseFloat(number),
      raw: number
    };
  }

  // Parses a string literal, staring with single or double quotes with basic support for escape codes
  // e.g. `"hello world"`, `'this is\nJSEP'`
  gobbleStringLiteral(): IStringLiteral {
    let str = '';
    const quote = this.exprI(this.index++);
    let closed = false;
    let ch;

    while (this.index < this.length) {
      ch = this.exprI(this.index++);
      if (ch === quote) {
        closed = true;
        break;
      } else if (ch === '\\') {
        // Check for all of the common escape codes
        ch = this.exprI(this.index++);
        switch (ch) {
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;
          default:
            str += ch;
        }
      } else {
        str += ch;
      }
    }

    if (!closed) {
      throwError('Unclosed quote after "' + str + '"', this.index);
    }

    return {
      type: LITERAL,
      value: str,
      raw: quote + str + quote
    };
  }
  // Gobbles only identifiers
  // e.g.: `foo`, `_value`, `$x1`
  // Also, this function checks if that identifier is a literal:
  // (e.g. `true`, `false`, `null`) or `this`
  gobbleIdentifier(): IIdentifier | ILiteral | IThisExpression {
    let ch = this.exprICode(this.index);
    const start = this.index;
    let identifier: string;

    if (isIdentifierStart(ch)) {
      this.index++;
    } else {
      throwError('Unexpected ' + this.exprI(this.index), this.index);
    }

    while (this.index < this.length) {
      ch = this.exprICode(this.index);
      if (isIdentifierPart(ch)) {
        this.index++;
      } else {
        break;
      }
    }

    identifier = this.expr.slice(start, this.index) as any;

    if (literals.hasOwnProperty(identifier)) {
      return {
        type: LITERAL,
        value: literals[identifier as keyof typeof literals],
        raw: identifier
      };
    } else if (identifier === this_str) {
      return { type: THIS_EXP };
    } else {
      return {
        type: IDENTIFIER,
        name: identifier
      };
    }
  }
  // Gobbles a list of arguments within the context of a function call
  // or array literal. This function also assumes that the opening character
  // `(` or `[` has already been gobbled, and gobbles expressions and commas
  // until the terminator character `)` or `]` is encountered.
  // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
  gobbleArguments(termination: any): INodeArguments {
    let ch_i;
    const args = [];
    let node;
    let closed = false;
    let separator_count = 0;
    while (this.index < this.length) {
      this.gobbleSpaces();
      ch_i = this.exprICode(this.index);
      if (ch_i === termination) {
        // done parsing
        closed = true;
        this.index++;
        if (
          termination === CPAREN_CODE &&
          separator_count &&
          separator_count >= args.length
        ) {
          throwError(
            'Unexpected token ' + String.fromCharCode(termination),
            this.index
          );
        }
        break;
      } else if (ch_i === COMMA_CODE) {
        // between expressions
        this.index++;
        separator_count++;
        if (separator_count !== args.length) {
          // missing argument
          if (termination === CPAREN_CODE) {
            throwError('Unexpected token ,', this.index);
          } else if (termination === CBRACK_CODE) {
            for (let arg = args.length; arg < separator_count; arg++) {
              args.push(null);
            }
          }
        }
      } else {
        node = this.gobbleExpression();
        if (!node || node.type === PROGRAM) {
          throwError('Expected comma', this.index);
        }
        args.push(node);
      }
    }
    if (!closed) {
      throwError('Expected ' + String.fromCharCode(termination), this.index);
    }
    return args;
  }

  // Gobble a non-literal variable name. This variable name may include properties
  // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
  // It also gobbles function calls:
  // e.g. `Math.acos(obj.angle)`
  gobbleVariable(): IMemberExpression | ICallExpression {
    let ch_i;
    let node;
    ch_i = this.exprICode(this.index);

    if (ch_i === OPAREN_CODE) {
      node = this.gobbleGroup();
    } else {
      node = this.gobbleIdentifier();
    }
    this.gobbleSpaces();
    ch_i = this.exprICode(this.index);
    while (
      ch_i === PERIOD_CODE ||
      ch_i === OBRACK_CODE ||
      ch_i === OPAREN_CODE
    ) {
      this.index++;
      if (ch_i === PERIOD_CODE) {
        this.gobbleSpaces();
        node = {
          type: MEMBER_EXP,
          computed: false,
          object: node,
          property: this.gobbleIdentifier()
        };
      } else if (ch_i === OBRACK_CODE) {
        node = {
          type: MEMBER_EXP,
          computed: true,
          object: node,
          property: this.gobbleExpression()
        };
        this.gobbleSpaces();
        ch_i = this.exprICode(this.index);
        if (ch_i !== CBRACK_CODE) {
          throwError('Unclosed [', this.index);
        }
        this.index++;
      } else if (ch_i === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          type: CALL_EXP,
          arguments: this.gobbleArguments(CPAREN_CODE),
          callee: node
        };
      }
      this.gobbleSpaces();
      ch_i = this.exprICode(this.index);
    }
    return node;
  }

  // Responsible for parsing a group of things within parentheses `()`
  // This function assumes that it needs to gobble the opening parenthesis
  // and then tries to gobble everything within that parenthesis, assuming
  // that the next thing it should see is the close parenthesis. If not,
  // then the expression probably doesn't have a `)`
  gobbleGroup() {
    this.index++;
    const node = this.gobbleExpression();
    this.gobbleSpaces();
    if (this.exprICode(this.index) === CPAREN_CODE) {
      this.index++;
      return node;
    } else {
      throwError('Unclosed (', this.index);
    }
  }
  // Responsible for parsing Array literals `[1, 2, 3]`
  // This function assumes that it needs to gobble the opening bracket
  // and then tries to gobble the expressions as arguments.
  gobbleArray(): IArrayExpression {
    this.index++;
    return {
      type: ARRAY_EXP,
      elements: this.gobbleArguments(CBRACK_CODE)
    };
  }
}
