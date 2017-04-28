let EOL = require('os').EOL;
let path = require('path');

let test = require('blue-tape');
let mock = require('mock-fs');

let dirTree = require('../');


test.createStream().pipe(process.stdout);

mock({
    'dir-1': {
        'dir-11': {
            'file-11-1.txt': 'file-11-1',
        },
        'dir-12': {},
        'dir-13': {},
        'file-1-1.txt': 'file-1-1',
    },
    'dir-2': {
        'file-2-1.txt': 'file-2-1',
    },
    'file-1.txt': 'file-1',
    'file-2.txt': 'file-2',
}, { createTmp: false });

test('dirTree', async (t) => {
    await Promise.all([
        dirTree('./').then((tree) => {
            let cwd = process.cwd();
            
            t.equal(tree.path, cwd);
            t.equal(tree.name, path.basename(cwd));
            t.equal(tree.dirs.length, 2);
            t.equal(tree.files.length, 2);
            t.equal(tree.size, 12);
            t.equal(tree.isSearched, true);
            t.equal(tree.isFullySearched, false);
            
            t.equal(tree.dirs[0].path, path.join(cwd, 'dir-1'));
            t.equal(tree.dirs[0].dirs.length, 0);
            t.equal(tree.dirs[0].files.length, 0);
            t.equal(tree.dirs[0].size, 0);
            t.equal(tree.dirs[0].isSearched, false);
            t.equal(tree.dirs[0].isFullySearched, false);
            
            t.equal(tree.files[0].path, path.join(cwd, 'file-1.txt'));
            t.equal(tree.files[0].name, 'file-1.txt');
            t.equal(tree.files[0].ext, '.txt');
            t.equal(tree.files[0].size, 6);
        }),
        dirTree('./', 1).then((tree) => {
            t.equal(tree.size, 28);
            t.equal(tree.isFullySearched, false);
            t.equal(tree.dirs[0].size, 8);
            t.equal(tree.dirs[0].isSearched, true);
            t.equal(tree.dirs[0].dirs[0].isSearched, false);
        }),
        dirTree('./', true).then((tree) => {
            t.equal(tree.size, 37);
            t.equal(tree.isFullySearched, true);
            t.equal(tree.dirs[0].size, 17);
            t.equal(tree.dirs[0].dirs[0].isSearched, true);
        }),
        
        t.shouldReject(dirTree('./', -1), /^(?:.*?Error: )dirTree:/),
        t.shouldReject(dirTree('file-1.txt'), /^(?:.*?Error: )dirTree:/),
    ]);
});

test('dirTree.of', async (t) => {
    await dirTree.of({
        'dir-1': {
            'dir-11': 0,
            'dir-12': 0,
        },
        'dir-1/dir-13': 0,
        'dir-2': 0,
    }).then((trees) => {
        t.equal(trees.length, 4);
        t.equal(trees[0].name, 'dir-11');
        t.equal(trees[1].name, 'dir-12');
        t.equal(trees[2].name, 'dir-13');
        t.equal(trees[3].name, 'dir-2');
    });
});

test('Directory#toString', async (t) => {
    await dirTree('./', true).then((tree) => {
        let sep = path.sep;
        t.equal(tree.toString(), `
            ${process.cwd()}${sep}
            ├── dir-1${sep}
            │   ├── dir-11${sep}
            │   │   └── file-11-1.txt
            │   ├── dir-12${sep}
            │   ├── dir-13${sep}
            │   └── file-1-1.txt
            ├── dir-2${sep}
            │   └── file-2-1.txt
            ├── file-1.txt
            └── file-2.txt
        `.replace(/^\n|\n +$/g, '').replace(/^ +/gm, '').replace(/\n/g, EOL));
    });
});

test('Directory#getDirectories', async (t) => {
    await dirTree('./', true).then((tree) => {
        let dirNames = [path.basename(process.cwd()), 'dir-1', 'dir-11', 'dir-12', 'dir-13', 'dir-2'];
        let getDirName = (dir) => dir.name;
        t.deepEqual(tree.getDirectories().map(getDirName), dirNames);
        t.deepEqual(tree.getDirectories(false).map(getDirName), dirNames.slice(1));
    });
});

test('Directory#getFiles', async (t) => {
    await dirTree('./', true).then((tree) => {
        let fileNames = ['file-1.txt', 'file-2.txt', 'file-1-1.txt', 'file-11-1.txt', 'file-2-1.txt'];
        let getFileName = (file) => file.name;
        t.deepEqual(tree.getFiles().map(getFileName), fileNames);
    });
});

test.onFinish(mock.restore);