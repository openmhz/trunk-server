var fs      = require('fs'),
    path    = require('path'),
    merge   = require('fmerge'),
    util    = require('util'),
    rimraf  = require('rimraf'),

    now,
    testRun

    var totals = {fileSize: 0, deletedSize:0, files: 0, deleted:0}

function isOlder(path, ageSeconds) {
    var stats          = fs.statSync(path),
        mtime          = stats.mtime.getTime(),
        expirationTime = (mtime + (ageSeconds * 1000))

    return now > expirationTime
}

function hasMaxLevel(options) {
    return options && options.hasOwnProperty('maxLevel')
}

function getMaxLevel(options) {
    return hasMaxLevel(options) ? options.maxLevel : -1
}

function getAgeSeconds(options) {
    return (options && options.age && options.age.seconds) ? options.age.seconds : null
}

function doDeleteDirectory(currentDir, options, currentLevel) {

    var doDelete = false
    var dir      = options && options.dir

    if (dir) {
        var ageSeconds   = getAgeSeconds(options)
        var basename     = path.basename(currentDir)

        if (util.isArray(dir)) {
            doDelete = (dir.indexOf("*") !== 1) || (dir.indexOf(basename) !== -1)
        } else if (basename === dir || dir === "*") {
            doDelete = true
        }

        if (doDelete && hasMaxLevel(options) && currentLevel > 0) {
            doDelete = currentLevel <= getMaxLevel(options)
        }

        if (ageSeconds && doDelete) {
            doDelete = isOlder(currentDir, ageSeconds)
        }
    }

    return doDelete
}

function doDeleteFile(currentFile, options) {
    // by default it deletes nothing
    var doDelete = false

    var extensions = (options && options.extensions) ? options.extensions : null
    var files      = (options && options.files) ? options.files : null
    var dir        = (options && options.dir) ? options.dir : null
    var ignore     = (options && options.ignore) ? options.ignore : null

    // return the last portion of a path, the filename aka basename
    var basename = path.basename(currentFile)

    if (files) {
        if (util.isArray(files))
            doDelete = (files.indexOf("*.*") !== -1) || (files.indexOf(basename) !== -1)
        else {
            if (files === '*.*') {
                doDelete = true
            } else {
                doDelete = (basename === files)
            }
        }
    }

    if (!doDelete && extensions) {
        var currentExt = path.extname(currentFile)

        if (util.isArray(extensions)) {
            doDelete = extensions.indexOf(currentExt) !== -1
        } else {
            doDelete = (currentExt === extensions)
        }
    }

    if (doDelete && ignore) {
        if (util.isArray(ignore))
            doDelete = !(ignore.indexOf(basename) !== -1)
        else
            doDelete = !(basename === ignore)
    }

    if (doDelete) {
        var ageSeconds = getAgeSeconds(options)

        if (ageSeconds)
            doDelete = isOlder(currentFile, ageSeconds)
    }

    return doDelete
}

function isTestRun(options) {
    return (options && options.hasOwnProperty('test')) ? options.test : false
}

/**
 * findRemoveSync(currentDir, options) takes any start directory and searches files from there for removal.
 * the selection of files for removal depends on the given options. when no options are given, or only the maxLevel
 * parameter is given, then everything is removed as if there were no filters.
 *
 * beware: everything happens synchronously.
 *
 *
 * @param {String} currentDir any directory to operate within. it will seek files and/or directories recursively from there.
 * beware that it deletes the given currentDir when no options or only the maxLevel parameter are given.
 * @param options json object with optional properties like extensions, files, ignore, maxLevel and age.seconds.
 * @return {Object} json object of files and/or directories that were found and successfully removed.
 * @api public
 */
var findRemoveSync = module.exports = function(currentDir, options, currentLevel) {

    var removed = {}

    if (fs.existsSync(currentDir)) {

        var maxLevel = getMaxLevel(options),
            deleteDirectory = false

        var removeEmpty = (options && options.removeEmpty);
        if (currentLevel === undefined)
            currentLevel = 0
        else
            currentLevel++

        if (currentLevel < 1) {
            now = new Date().getTime()
            totals = {fileSize: 0, deletedSize:0, files: 0, deleted:0};
            testRun = isTestRun(options)
        } else {
            // check directories before deleting files inside.
            // this to maintain the original creation time,
            // because linux modifies creation date of folders when files within have been deleted.
            deleteDirectory = doDeleteDirectory(currentDir, options, currentLevel)
        }

        if (maxLevel === -1 || currentLevel < maxLevel) {
            var filesInDir = fs.readdirSync(currentDir)

            filesInDir.forEach(function(file) {

                var currentFile = path.join(currentDir, file)
                var stat = fs.statSync(currentFile);
                if (stat.isDirectory()) {
                    // the recursive call
                    var result = findRemoveSync(currentFile, options, currentLevel)

                    // merge results
                    removed = merge(removed, result)
                } else {

                    if (doDeleteFile(currentFile, options)) {
                        if (!testRun)
                            fs.unlinkSync(currentFile)
                        totals.deletedSize += stat.size
                        totals.deleted++;
                        removed[currentFile] = true
                    } else {
                      totals.fileSize += stat.size
                      totals.files++
                    }
                }
            })
            if (removeEmpty && (filesInDir<1)) {
              deleteDirectory = true;
            }
        }

        if (deleteDirectory) {
            try {
                if (!testRun)
                    rimraf.sync(currentDir)

                removed[currentDir] = true
            } catch (err) {
                throw err
            }
        }
    }
    if (currentLevel==0) {
      return {removed: removed, totals: totals}
    } else {
      return removed
    }
}
