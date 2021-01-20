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
        let tasks = path.split('/').splice(1);
        let lastName = tasks.pop();
        let node = storage;
        for (const name of tasks) {
          if (typeof node[name] === 'undefined') {
            throw new Error('Illegal file.');
          }
          node = node[name];
        }
        return node[lastName];
      })
    };
  });
});

describe('Virtual file system testt', () => {
  it('Write file', () => {
    const readFileSync = require('fs').readFileSync;
    expect(readFileSync('/s1/f4.xml')).toEqual('This is f4.');
  })
})
