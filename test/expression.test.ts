import { Context, runInConext } from '../src/expression';

describe('expression', () => {
  it('number + number', () => {
    const ctx = new Context();
    const value = runInConext('1+2', ctx);
    expect(value).toBe(3);
  });

  it('scopedata + number', () => {
    const ctx = new Context({
      $DATA: 1
    });
    const value = runInConext('$DATA + 1', ctx);
    expect(value).toBe(2);
  });

  it('scopedata deep data', () => {
    const ctx = new Context({
      $DATA: 1
    });

    const value = runInConext(`$DATA.data['1'] + 1`, ctx);
    expect(value).toBe(NaN);
  });

  it(`no match scopedata`, () => {
    const value = runInConext(`$DATA`);
    expect(value).toBe(void 0);
  });

  it('single string', () => {
    const value = runInConext(`'data'`);
    expect(value).toBe('data');
  });

  it(` logic `, () => {
    const value = runInConext(
      ` $DATA.index || 1 `,
      new Context({
        $DATA: {
          index: 0
        }
      })
    );
    expect(value).toBe(1);
  });

  it(`Relational operator`, () => {
    const value = runInConext(
      ` $DATA.index > $DATA.index2 `,
      new Context({
        $DATA: {
          index: 0,
          index2: 1
        }
      })
    );
    expect(value).toBe(false);
  });

  it(`condition`, () => {
    const value = runInConext(
      ` islogin ? 1 : 0`,
      new Context({
        islogin: true
      })
    );
    expect(value).toBe(1);
  });

  it(`Number()`, () => {
    const value = runInConext(
      `Number('1')`
    );
    expect(value).toBe(1);
  });
});
