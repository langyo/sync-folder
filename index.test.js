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

      for (const name of paths) {
        if (name === '.' || name === '') {
          continue;
        }
        else if (name === '..') {
          key = nodes[key]['#'];
        }
        else {
          if (!nodes[key][name]) {
            throw Error('Illegal path.');
          }
          // Enter the next folder.
          key = nodes[key][name];
        }
      }
      return key;
    }

    function generate(path) {
      let paths = path.split(/[\/\\]/);
      let key = '#';

      for (const name of paths) {
        if (name === '.' || name === '') {
          continue;
        }
        else if (name === '..') {
          key = nodes[key]['#'];
        }
        else {
          if (!nodes[key][name]) {
            const id = require('shortid').generate();
            nodes[key][name] = id;
            nodes[id] = { '#': key };
          }
          // Enter the next folder.
          key = nodes[key][name];
        }
      }
      return key;
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
          throw Error('Cannot read a directory.');
        }
        return nodes[key];
      }),

      writeFileSync: jest.fn((path, content) => {
        const key = generate(path);
        if (typeof nodes[key] === 'object') {
          throw Error('Cannot write to a directory');
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
          throw Error('Not a directory');
        }
        return Object.keys(nodes[key]).filter(n => n !== '#');
      }),

      rmdirSync: jest.fn((path, opts = {}) => {
        let paths = path.split(/[\/\\]/);
        let key = '#';

        opts = {
          maxRetry: 0,
          recursive: false,
          retryDelay: 100,
          ...opts
        };

        let lastName = '#', lastParentKey = '#';
        for (const name of paths) {
          if (name === '.' || name === '') {
            continue;
          }
          else if (name === '..') {
            key = nodes[key]['#'];
          }
          else {
            if (!nodes[key][name]) {
              throw Error('Illegal path.');
            }
            // Remember the latest folder's name currently.
            lastParentKey = key;
            lastName = name;
            // Enter the next folder.
            key = nodes[key][name];
          }
        }

        if (typeof nodes[key] !== 'object') {
          throw Error('Not a directory.');
        }

        if (opts.recursive) {
          function dfs(key) {
            if (typeof nodes[key] === 'object') {
              for (const name of Object.keys(nodes[key])) {
                if (name !== '#') {
                  dfs(nodes[key][name]);
                }
              }
            }
            delete nodes[key];
          }
          dfs(key);
        } else {
          if (Object.keys(nodes[key]) !== ['#']) {
            throw Error('The directory is not empty.');
          }
          delete nodes[key];
        }
        delete nodes[lastParentKey][lastName];
      }),

      unlinkSync: jest.fn(path => {
        let paths = path.split(/[\/\\]/);
        let key = '#';

        let lastName = '#', lastParentKey = '#';
        for (const name of paths) {
          if (name === '.' || name === '') {
            continue;
          }
          else if (name === '..') {
            key = nodes[key]['#'];
          }
          else {
            if (!nodes[key][name]) {
              throw Error('Illegal path.');
            }
            // Remember the latest folder's name currently.
            lastParentKey = key;
            lastName = name;
            // Enter the next folder.
            key = nodes[key][name];
          }
        }

        if (typeof nodes[key] !== 'string') {
          throw Error('Not a file.');
        }

        delete nodes[key];
        delete nodes[lastParentKey][lastName];
      }),

      copyFileSync: jest.fn((s, t) => {
        if (typeof nodes[route(s)] === 'object') {
          throw Error('Cannot copy a directory.');
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
    expect(readFileSync('/s1/t1/../f4.xml')).toEqual('This is f4.');
    expect(readFileSync('/s1/t1/..//f4.xml')).toEqual('This is f4.');
    expect(readFileSync('/s1/t1/.././f4.xml')).toEqual('This is f4.');
  });

  it('Write file', () => {
    const {
      readFileSync, writeFileSync
    } = require('fs');
    expect(() => writeFileSync('/s1/f4.xml', 'test')).not.toThrow();
    expect(readFileSync('/s1/f4.xml')).toEqual('test');
    expect(() => writeFileSync('./s1/t1/f1.txt', 'test2')).not.toThrow();
    expect(readFileSync('./s1/t1/f1.txt')).toEqual('test2');
  });

  it('Copy file', () => {
    const {
      readFileSync, copyFileSync
    } = require('fs');
    expect(() => copyFileSync('/s1/f4.xml', '/t1/f4.xml')).not.toThrow();
    expect(readFileSync('/t1/f4.xml')).toEqual('This is f4.')
  });

  it('Delete file', () => {
    const {
      readFileSync, unlinkSync
    } = require('fs');
    expect(() => unlinkSync('/s1/f4.xml')).not.toThrow();
    expect(() => readFileSync('/t1/f4.xml')).toThrow();
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
    expect(readdirSync('/t1/..//t1')).toEqual([]);
    expect(readdirSync('/t1/.././t1')).toEqual([]);
    expect(() => readdirSync('/s1/f4.xml')).toThrow();
  });

  it('Delete directory', () => {
    const { readdirSync, rmdirSync } = require('fs');
    expect(() => rmdirSync('/s1/t1/')).toThrow();
    expect(() => rmdirSync('/s1/t1/', { recursive: true })).not.toThrow();
    expect(() => readdirSync('/s1/')).not.toContain('t1');
    expect(() => readdirSync('/s1/t1/')).toThrow();
    expect(() => readdirSync('/t1/')).not.toThrow();
  });
});

describe('File copy test', () => {
});
