beforeEach(() => {
  jest.doMock('fs', () => {
    let nodes = {
      // The folder is represented as a mapping table.
      // The '#' in the object points to its parent folder.
      // '#' is the root folder.
      '#': {
        '#': '#'
      }
    };

    function route(path) {
      let paths = path.split(/[\/\\]/);
      let key = '#';
      const lastName = paths.pop();

      for (const name of paths) {
        if (name === '.' || name === '') {
          continue;
        }
        else if (name === '..') {
          key = nodes[key]['#'];
        }
        else {
          if (typeof nodes[key][name] === 'undefined') {
            throw new Error('Illegal path.');
          }
          // Enter the next folder.
          key = nodes[key][name];
        }
      }
      if (typeof nodes[key][lastName] === 'undefined') {
        throw new Error('Illegal path.');
      }
      return nodes[key][lastName];
    }

    function generate(path) {
      let paths = path.split(/[\/\\]/);
      let key = '#';
      const lastName = paths.pop();

      for (const name of paths) {
        if (name === '.' || name === '') {
          continue;
        }
        else if (name === '..') {
          key = nodes[key]['#'];
        }
        else {
          if (typeof nodes[key][name] === 'undefined') {
            const id = require('shortid').generate();
            nodes[key][name] = id;
            nodes[id] = { '#': key };
          }
          // Enter the next folder.
          key = nodes[key][name];
        }
      }
      if (
        typeof nodes[key][lastName] === 'undefined' &&
        lastName !== ''
      ) {
        const id = require('shortid').generate();
        nodes[key][lastName] = id;
      }
      return nodes[key][lastName];
    }

    nodes[generate('/s1/t1/f1.txt')] = 'This is f1.';
    nodes[generate('/s1/t1/f2.js')] = 'This is f2.';
    nodes[generate('/s1/t1/f3.js')] = 'This is f3.';
    nodes[generate('/s1/t1/.gitignore')] = '*.xml';
    nodes[generate('/s1/f4.xml')] = 'This is f4.';
    nodes[generate('/s1/f5.json')] = 'This is f5.';
    nodes[generate('/s1/.gitignore')] = 'f?.js';
    nodes[generate('/s2/f6.xml')] = 'This is f6.';
    nodes[generate('/s2/f7.json')] = 'This is f7.';
    nodes[generate('/s2/.gitignore')] = '# There is nothing';
    generate('/t1/');
    nodes[generate('/t2/.gitignore')] = '*.json';

    return {
      readFileSync: jest.fn((path) => {
        const key = route(path);
        if (typeof nodes[key] !== 'string') {
          throw new Error('Cannot read a directory.');
        }
        return nodes[key];
      }),

      writeFileSync: jest.fn((path, content) => {
        const key = generate(path);
        if (typeof nodes[key] === 'object') {
          throw new Error('Cannot write to a directory');
        }
        nodes[key] = content;
      }),

      statSync: jest.fn((path) => {
        return {
          isDirectory: () =>
            typeof nodes[route(path)] !== 'string'
        };
      }),

      readdirSync: jest.fn((path) => {
        const key = route(path);
        if (typeof nodes[key] !== 'object') {
          throw new Error('Not a directory');
        }
        return Object.keys(nodes[key]).filter(n => n !== '#');
      }),

      rmdirSync: jest.fn(),
      unlinkSync: jest.fn(),

      copyFileSync: jest.fn((s, t) => {
        if (typeof nodes[route(s)] === 'object') {
          throw new Error('Cannot copy a directory.');
        }
        nodes[generate(t)] = nodes[route(s)];
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
    expect(statSync('/s1').isDirectory()).toBeTruthy();
    expect(statSync('/s2').isDirectory()).toBeTruthy();
    expect(statSync('/t1').isDirectory()).toBeTruthy();
    expect(statSync('/s1/t1').isDirectory()).toBeTruthy();
    expect(statSync('/s1/t1/f1.txt').isDirectory()).toBeFalsy();
    expect(statSync('/s1/f4.xml').isDirectory()).toBeFalsy();
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
