var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let EOL = require('os').EOL;
let path = require('path');

let fsp = require('fsp');
let chalk, chalkify; // lazy load


/**
 * Class representing a directory.
 */
class Directory {
    /**
     * @param {Object} dir Plain object representation of the Directory class.
     */
    constructor(dir) {
        this.path = dir.path;
        this.name = dir.name;
        this.dirs = dir.dirs;
        this.files = dir.files;
        this.size = dir.size;
        this.isSearched = dir.isSearched;
        this.isFullySearched = dir.isFullySearched;
    }

    /**
     * Stringifies the Directory.
     *
     * @param {boolean} [useColors=false] `true` if the output should be colorful.
     * @returns {string} The stringified Directory.
     */
    toString(useColors = false) {
        if (useColors && chalk === undefined) {
            ;var _ref = [require('chalk'), require('chalkify')];
            chalk = _ref[0];
            chalkify = _ref[1];
        } // eslint-disable-line global-require

        class Token {
            constructor(type, text) {
                this.type = type;
                this.text = ['root', 'directory'].includes(type) ? text + path.sep : text;
            }
        }

        let tokenTree = new class Tokenizer {
            constructor(dir) {
                this.tokenTree = [];
                this.getNewLine().push(new Token('root', dir.path));
                this.tokenize(dir, '');
                return this.tokenTree;
            }

            getNewLine() {
                let line = [];
                this.tokenTree.push(line);
                return line;
            }
            addPrefix(baseIndent, isLast) {
                return baseIndent + (!isLast ? '├── ' : '└── ');
            }
            addIndentLevel(baseIndent, isLast) {
                return baseIndent + (!isLast ? '│   ' : '    ');
            }

            tokenize(dir, baseIndent) {
                let l = dir.dirs.length + dir.files.length;

                dir.dirs.forEach(dir => {
                    let line = this.getNewLine();
                    let isLast = --l === 0;

                    line.push(new Token('indent', this.addPrefix(baseIndent, isLast)), new Token('directory', dir.name));

                    if (dir.isSearched) this.tokenize(dir, this.addIndentLevel(baseIndent, isLast));else {
                        line = this.getNewLine();
                        line.push(new Token('indent', this.addIndentLevel(baseIndent, isLast) + '    '), new Token('message', '/* unsearched directory tree */'));
                    }
                });

                dir.files.forEach(file => {
                    let line = this.getNewLine();
                    let isLast = --l === 0;

                    line.push(new Token('indent', this.addPrefix(baseIndent, isLast)), new Token('file', file.name));
                });
            }
        }(this);

        let styles = useColors ? chalkify(chalk, {
            root: 'bgBlue',
            directory: 'blue',
            file: 'yellow'
        }) : null;
        let stringifyToken = ({ type, text }) => !useColors ? text : styles[type](text);

        return tokenTree.map(line => line.map(stringifyToken).join('')).join(EOL);
    }

    /**
     * Gets every Directory inside of this Directory.
     *
     * @param {boolean} [thisInclusive=true] `true` if this Directory should appear in the output.
     * @returns {Directory[]} The list of directories.
     */
    getDirectories(thisInclusive = true) {
        return this.dirs.reduce((r, dir) => r.concat(dir.getDirectories()), thisInclusive ? [this] : []);
    }
    /**
     * Gets every File inside of this Directory.
     *
     * @returns {File[]} The list of files.
     */
    getFiles() {
        return this.dirs.reduce((r, dir) => r.concat(dir.getFiles()), this.files);
    }
}
Directory.prototype.type = 'directory';

/**
 * Class representing a file.
 */
class File {
    /**
     * @param {Object} file Plain object representation of the File class.
     */
    constructor(file) {
        this.path = file.path;
        this.name = file.name;
        this.ext = file.ext;
        this.size = file.size;
    }
}
File.prototype.type = 'file';

/**
 * Searches a directory for files and sub-directories.
 *
 * @param {string} dirPath A directory path.
 * @param {(number|boolean)} [depth=0]
 *        {number} A depth of recursive searching.
 *        {boolean} `true` equals `Infinity`, `false` equals `0`.
 * @returns {Promise} `Promise.then({Directory} tree, {Error} err);`
 */
let dirTree = (() => {
    var _ref2 = _asyncToGenerator(function* (dirPath, depth = 0) {
        dirPath = path.resolve(dirPath);
        if (typeof depth === 'boolean') depth = depth ? Infinity : 0;

        if (depth < 0) throw new Error('dirTree: depth can\'t be less than 0.');
        yield fsp.stat(dirPath).then(function (stat) {
            if (!stat.isDirectory()) throw new Error('dirTree: dirPath should point to a directory.');
        });

        return (() => {
            var _ref3 = _asyncToGenerator(function* (itemPath, depth) {
                let item = { path: itemPath, name: path.basename(itemPath), size: 0 };

                let stat = yield fsp.stat(itemPath);
                if (stat.isFile()) {
                    item.ext = path.extname(item.name);
                    item.size = stat.size;
                    return new File(item);
                } else if (stat.isDirectory()) {
                    item.dirs = [];
                    item.files = [];
                    if (depth >= 0) {
                        let subNames = yield fsp.readdir(itemPath);
                        let subPaths = subNames.map(function (subName) {
                            return path.join(itemPath, subName);
                        });
                        let subItems = yield Promise.all(subPaths.map(function (subPath) {
                            return dirTree(subPath, depth - 1);
                        }));
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = subItems[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                let subItem = _step.value;

                                if (subItem instanceof Directory) item.dirs.push(subItem);else if (subItem instanceof File) item.files.push(subItem);
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }

                        item.size = item.dirs.concat(item.files).reduce(function (r, subItem) {
                            return r + subItem.size;
                        }, 0);
                    }
                    item.isSearched = depth >= 0;
                    item.isFullySearched = item.isSearched && item.dirs.every(function (dir) {
                        return dir.isFullySearched;
                    });
                    return new Directory(item);
                }
            });

            function dirTree(_x2, _x3) {
                return _ref3.apply(this, arguments);
            }

            return dirTree;
        })()(dirPath, depth);
    });

    return function dirTree(_x) {
        return _ref2.apply(this, arguments);
    };
})();

/**
 * Converts a directory list to an array of directory `tree`s.
 * A directory list looks like this:
 * `{
 *     'path/to/dir1': true,
 *     'path/to/dir2': false,
 *     'path/to/dir3': {
 *         'subdir1': 1,
 *         'subdir2': 0,
 *         'subdir3': {
 *             'subsubdir1': 1,
 *         },
 *         'subdir3/subsubdir2': 0,
 *     },
 * }`
 *
 * @param {Object} dirList A directory list (see description).
 * @returns {Promise} `Promise.then({Directory[]} trees, {Error} err);`
 */
dirTree.of = dirList => {
    dirList = function resolveDirList(dirList) {
        return Object.entries(dirList).reduce((r, [dirPath, depth]) => {
            if (typeof depth !== 'object' || depth === null) r[path.normalize(dirPath)] = depth;else {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = Object.entries(resolveDirList(depth))[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        let _ref4 = _step2.value;

                        var _ref5 = _slicedToArray(_ref4, 2);

                        let dirPath2 = _ref5[0];
                        let depth2 = _ref5[1];

                        r[path.join(dirPath, dirPath2)] = depth2;
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }return r;
        }, {});
    }(dirList);

    return Promise.all(Object.entries(dirList).map(entry => dirTree(...entry)));
};

module.exports = dirTree;