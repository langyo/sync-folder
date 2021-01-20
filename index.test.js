beforeAll(() => {
  jest.mock('fs', () => {
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

    return {
      readFileSync: jest.fn((path) => {
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
        return node[lastName];
      }),
      writeFileSync: jest.fn((path, content) => {
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
        node[lastName] = content;
      })
    };
  });
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
})
