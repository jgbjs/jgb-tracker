import { addGlobalContext, getData, privateOptions } from '../src/collect';
// @ts-ignore
global.getApp = () => {
  return {
    global: {
      app: 'app',
      array: [0]
    }
  };
};

describe('$APP', () => {
  it('$APP.global.app', () => {
    const result = getData('$APP.global.app', [], null);
    expect(result).toBe('app');
  });

  it('$APP.global.array[0]', () => {
    const result = getData('$APP.global.array[0]', [], null);
    expect(result).toBe(0);
  });

  it('$APP get null value', () => {
    const result = getData('$APP.global1', [], null);
    expect(result).toBeUndefined();
  });
});

const event = {
  currentTarget: {
    dataset: {
      app: 'app',
      array: [0]
    }
  },
  detail: {
    x: 53,
    y: 14
  },
  type: 'tap'
};

describe('$DATASET', () => {
  it('$DATASET.app', () => {
    const result = getData('$DATASET.app', [event], null);
    expect(result).toBe('app');
  });
});

describe('$EVENT', () => {
  it('$EVENT.type', () => {
    const result = getData('$EVENT.type', [event], null);
    expect(result).toBe('tap');
  });
});

const pageCtx = {
  [privateOptions]: {
    url: 'url'
  },
  data: {
    api: 'myapi'
  }
};

// @ts-ignore
global.getCurrentPages = () => {
  return [pageCtx];
};

describe('$OPTIONS', () => {
  it('$OPTIONS.url', () => {
    const result = getData('$OPTIONS.url', [event], pageCtx);
    expect(result).toBe('url');
  });
});

describe('$ARGS', () => {
  const result = getData('$ARGS[0].type', [event], pageCtx);
  expect(result).toBe('tap');
});

describe('$THIS', () => {
  const result = getData('$THIS.data.api', [event], pageCtx);
  expect(result).toBe('myapi');
});

describe('custom getDataProcessor', () => {
  addGlobalContext(() => ({
    $TEST: {
      test: 'test'
    }
  }));

  it('$TEST.test', () => {
    const result = getData('$TEST.test', [event], pageCtx);
    expect(result).toBe('test');
  });
});

describe('get page or component data', () => {
  it('page data', () => {
    const result = getData('$DATA.api', [event], pageCtx);
    expect(result).toBe('myapi');
  });
});

describe('get this raw data', () => {
  it('raw data', () => {
    const result = getData("'原始数据'", [], null);
    expect(result).toBe('原始数据');
  });
});
