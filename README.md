# dir-tree
Retrieves the directory structure of a path.

## Installation
Unfortunately the name `dir-tree` is already taken at npm (and I don't have a better one), so for now you need to install it this way:
```
$ npm install nemoxps/dir-tree --save
```

**Note**: `dir-tree` uses ES8 async/await, so have a appropriate node version installed.

## API
`dir-tree` provides 2 functions to retrieve a directory tree.
```js
/**
 * @param {string} dirPath A directory path.
 * @param {(number|boolean)} [depth=0]
 *        {number} A depth of recursive searching.
 *        {boolean} `true` equals `Infinity`, `false` equals `0`.
 * @returns {Promise} `Promise.then({Directory} tree, {Error} err);`
 */
dirTree(dirPath, depth)
```
```js
/**
 * @param {Object} dirList A directory list.
 * @returns {Promise} `Promise.then({Directory[]} trees, {Error} err);`
 */
dirTree.of(dirList)
```

A directory object has the following properties:
* `{string} path`: The directory's path
* `{string} name`: The directory's name
* `{Directory[]} dirs`: An array of sub-directories
* `{File[]} files`: An array of sub-files
* `{number} size`: The directory's size (in bytes)
* `{boolean} isSearched`: Indicates whether `dirs` and `files` contain the sub-directories and sub-files or not
* `{boolean} isFullySearched`: Indicates whether every sub-(sub-)directory is searched or not
* `{string} type = 'directory'`: Shows that the object is a directory

And methods:
```js
/**
 * @param {boolean} [useColors=false] `true` if the output should be colorful.
 * @returns {string} The stringified Directory.
 */
dir.toString(useColors)

/*
dir.toString() outputs something like this (the separator depends on the OS):
rootPath/
├── dir-1/
│   ├── dir-11/
│   │   └── file-11-1.txt
│   ├── dir-12/
│   ├── dir-13/
│   └── file-1-1.txt
├── dir-2/
│   └── file-2-1.txt
├── file-1.txt
└── file-2.txt
*/
```
```js
/**
 * @param {boolean} [thisInclusive=true] `true` if this Directory should appear in the output.
 * @returns {Directory[]} The list of directories.
 */
dir.getDirectories(thisInclusive)
```
```js
/**
 * @returns {File[]} The list of files.
 */
dir.getFiles()
```

A file object has the following properties:
* `{string} path`: The file's path
* `{string} name`: The file's basename (name + ext)
* `{string} ext`: The file's extension
* `{number} size`: The file's size (in bytes)
* `{string} type = 'file'`: Shows that the object is a file

## Usage
Retrieving a complete directory tree:
```js
let dirTree = require('dir-tree');
dirTree('path/to/my/folder', true)
  .then((tree) => {
      // do something
  })
  .catch((err) => {
      // something went wrong
  });
```

Retrieving multiple directories:
```js
let dirTree = require('dir-tree');
dirTree.of({
    'path/to/dir1': {
        'path/to/subdir1': true,
        'path/to/subdir2': false,
    },
    'path/to/dir2': 1,
})
  .then((trees) => {
      // do something
  })
  .catch((err) => {
      // something went wrong
  });
```