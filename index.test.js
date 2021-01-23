beforeEach(() => {
  jest.doMock('fs', () => {
    let nodes = {
      // The folder is represented as a mapping table.
      // The '#' in the object points to its parent folder.
      // '#' is the root folder.
      '#': {
        '#': '#',
        s1: 's1',
        s2: 's2',
        t1: 't1',
        t2: 't2'
      },
      s1: {
        t1: 't1inside',
        'f4.xml': 'f4',
        'f5.json': 'f5',
        '.gitignore': 'g1'
      },
      f4: 'This is f4.',
      f5: 'This is f5.',
      g1: '*.xml',
      t1inside: {
        'f1.txt': 'f1',
        'f2.js': 'f2',
        'f3.js': 'f3',
        '.gitignore': 'g2'
      },
      f1: 'This is f1.',
      f2: 'This is f2.',
      f3: 'This is f3.',
      g2: 'f?.js',
      s2: {
        'f7.xml': 'f7',
        'f8.json': 'f8',
        '.gitignore': 'g3'
      },
      f7: 'This is f7.',
      f8: 'This is f8.',
      g3: '# There is noting',
      t1: {},
      t2: {
        '.gitignore': 'g4'
      },
      g4: '*.json'
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
      if (typeof nodes[key][lastName] === 'undefined') {
        const id = require('shortid').generate();
        nodes[key][lastName] = id;
      }
      return nodes[key][lastName];
    }

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
        return Object.keys(nodes[key]);
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
