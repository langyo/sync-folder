beforeEach(() => {
  jest.doMock('fs', () => {
    let storage = {
      s1: {
        t1: {
          'f1.txt': 'This is f1.',
          'f2.js': 'This is f2.',
          'f3.js': 'This is f3.',
          '.gitignore': 'f?.js'
        },
        'f4.xml': 'This is f4.',
        'f5.json': 'This is f5.',
        '.gitignore': '*.xml'
      },
      s2: {
        'f7.xml': 'This is f7.',
        'f8.json': 'This is f8.',
        '.gitignore': '# There is noting'
      },
      t1: {},
      t2: {
        '.gitignore': '*.json'
      }
    };

    function directTo(path, content) {
      let tasks = path.split('/');
      if (tasks[0] === '') tasks.shift();
      let lastName = tasks.pop();
      let node = storage;
      for (const name of tasks) {
        if (name === '.') continue;
        if (name === '..') {
          throw new Error('Illegal path.');
        } 
        if (typeof node[name] === 'undefined') {
          throw new Error('Illegal file.');
        }
        node = node[name];
      }
      if (typeof content !== 'undefined') {
        node[lastName] = content;
      }
      return node[lastName];
    }

    return {
      readFileSync: jest.fn((path) => {
        return directTo(path);
      }),

      writeFileSync: jest.fn((path, content) => {
        directTo(path, content);
      }),

      statSync: jest.fn((path) => {
        return {
          isDirectory: () =>
            typeof directTo(path) !== 'string'
        };
      }),

      readdirSync: jest.fn((path) => {
        if (typeof directTo(path) === 'string') {
          throw new Error('Not a directory');
        }
        return Object.keys(directTo(path));
      }),

      rmdirSync: jest.fn(),
      unlinkSync: jest.fn(),

      copyFileSync: jest.fn((s, t) => {
        directTo(t, directTo(s));
      })
    };
  });
});
afterEach(() => {
  jest.resetModules();
});

describe('Virtual file system test', () => {
  it('Read file', () => {
    const { readFileSync } = require('fs');
    expect(readFileSync('/s1/f4.xml')).toEqual('This is f4.');
    expect(readFileSync('./s1/t1/f1.txt')).toEqual('This is f1.');
  });

  it('Write file', () => {
    const {
      readFileSync, writeFileSync
    } = require('fs');
    writeFileSync('/s1/f4.xml', 'test');
    expect(readFileSync('/s1/f4.xml')).toEqual('test');
    writeFileSync('./s1/t1/f1.txt', 'test2');
    expect(readFileSync('./s1/t1/f1.txt')).toEqual('test2');
  });

  it('Copy file', () => {
    const {
      readFileSync, copyFileSync
    } = require('fs');
    copyFileSync('/s1/f4.xml', '/t1/f4.xml');
    expect(readFileSync('/t1/f4.xml')).toEqual('This is f4.')
  });

  it('Get status', () => {
    const { statSync } = require('fs');
    expect(statSync('/s1').isDirectory()).toBe(true);
    expect(statSync('/s2').isDirectory()).toBe(true);
    expect(statSync('/t1').isDirectory()).toBe(true);
    expect(statSync('/s1/t1').isDirectory()).toBe(true);
    expect(statSync('/s1/t1/f1.txt').isDirectory()).toBe(false);
    expect(statSync('/s1/f4.xml').isDirectory()).toBe(false);
  });

  it('Read directory', () => {
    const { readdirSync } = require('fs');
    expect(readdirSync('/s1')).toEqual([
      't1', 'f4.xml', 'f5.json', '.gitignore'
    ]);
    expect(readdirSync('/t1')).toEqual([]);
    expect(() => readdirSync('/s1/f4.xml')).toThrow();
  });
});

describe('File copy test', () => {
});
