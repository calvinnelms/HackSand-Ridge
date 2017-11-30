// For more information on how to configure a task runner, please visit:
// https://github.com/gulpjs/gulp

var gulp = require('gulp'),
    args = require('yargs').argv,
    del = require('del'),
    fs = require('fs'),
    bower = require('gulp-bower'),
    rename = require('gulp-rename');

var rootPath = './',
    scriptsRootPath = rootPath + 'Scripts/',
    appPath = rootPath + 'app/',
    scriptsPath = scriptsRootPath + '**/',
    appFile = appPath + 'app.js',
    files = {
        appConcatFile: 'apps.min.js',
        scriptsConcatFile: 'scripts.min.js',
        concatFile: 'all.min.js',
        manifestFile: rootPath + 'manifest.appcache',
        appFile: appFile,
        scriptsJS: [
            scriptsPath + 'angular.min.js',
            scriptsPath + 'jquery*.min.js',
            scriptsPath + 'bootstrap.min.js',
            scriptsPath + '*.min.js',
            //exclude these files
            '!' + scriptsPath + '*dataworker*',
            '!' + scriptsPath + 'scripts.min.js'
        ],
        appJS: [
            appFile,
            appPath + 'common/**/*.js',
            appPath + '**/*.js',
            //exclude these files
            '!' + appPath + '**/*.min.js'
        ],
        appHTML: [
            appPath + '**/*.html'
        ]
    },
    buildVersionArr = [],
    isInjectDev = false;

var $ = require('gulp-load-plugins')({lazy: true});

gulp.task('vet', function () {
    return gulp
        .src(files.appJS)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'))
    ;
});

gulp.task('injectManifestDev', ['injectApp'], function () {
    return injectManifest(files.scriptsJS.concat(files.appJS));
});

gulp.task('injectManifestProd', ['concat'], function () {
    return injectManifest(rootPath + files.concatFile);
});

gulp.task('clean', function () {
    return del.sync([
        rootPath + files.concatFile,
        appPath + files.appConcatFile,
        scriptsRootPath + files.scriptsConcatFile
    ]);
});

gulp.task('scriptsConcat', ['clean'], function () {
    return gulp.src(files.scriptsJS)
        .pipe($.concat(files.scriptsConcatFile))
        .pipe(gulp.dest(scriptsRootPath));
});

gulp.task('appsConcat', ['clean', 'injectApp'], function () {
    return gulp.src(files.appJS)
        .pipe($.uglify())
        .pipe($.concat(files.appConcatFile))
        .pipe(gulp.dest(appPath));
});

gulp.task('concat', ['clean', 'scriptsConcat', 'appsConcat'], function () {
    return gulp.src([scriptsRootPath + files.scriptsConcatFile, appPath + files.appConcatFile])
        .pipe($.concat(files.concatFile))
        .pipe(gulp.dest(rootPath));
});

gulp.task('injectApp', function () {
    buildVersionArr = getUpdatedVersionArr();
    return injectApp();
});

gulp.task('setInjectDev', function () {
    isInjectDev = true;
});

gulp.task('_injectDev', ['setInjectDev', 'injectManifestDev'], function () {
    copyIndexIntoDebug();

    injectIndex(files.scriptsJS.concat(files.appJS));
    injectIndexDebug(files.scriptsJS.concat(files.appJS));
});

gulp.task('_injectProd', ['concat', 'injectManifestProd'], function () {
    copyIndexIntoDebug();

    injectIndex(rootPath + files.concatFile);
    injectIndexDebug(files.scriptsJS.concat(files.appJS));
});

gulp.task('_bower-update', function () {
    return bower({ cmd: 'update' });
});

/////////////////////////////////////
function copyIndexIntoDebug() {
    return gulp.src(rootPath + 'index.html')
        .pipe(rename({ basename: 'debug' }))
        .pipe(gulp.dest(rootPath));  //'Debug/'
}

function injectIndexDebug(src) {
    gulp.src(rootPath + 'debug.html')
        .pipe(injectScripts(src))
        .pipe(gulp.dest(rootPath)); //'Debug/'
}
function injectIndex(src) {
    return gulp.src(rootPath + 'index.html')
        .pipe(injectScripts(src))
        .pipe(gulp.dest(rootPath));
}

function injectScripts(src) {
    return $.inject(gulp.src(src, { read: false }), { relative: true });
}

function injectManifest(src) {
    return gulp.src(files.manifestFile)
        .pipe(injectManifestFiles({ src: files.appHTML, startTag: '#inject:apphtml', endTag: '#endapphtml' }))
        .pipe(injectManifestFiles({ src: src, startTag: '#inject:js', endTag: '#endinject' }))
        .pipe(injectVersion({ src: files.manifestFile, startTag: '#beginversion', endTag: '#endversion' }))
        .pipe(gulp.dest(rootPath));
}

function injectApp() {
    return gulp.src(files.appFile)
        .pipe(injectAppVersion({ src: files.appFile, startTag: '//beginversion', endTag: '//endversion' }))
        .pipe(gulp.dest(appPath));
}

function injectManifestFiles(o) {
    return $.inject(gulp.src(o.src,
            { read: false }),
            {
                relative: true,
                starttag: o.startTag,
                endtag: o.endTag,
                transform: function (filepath) {
                    return filepath;
                }
            });
}

function injectVersion(o) {
    return $.inject(getReadableString(buildVersionArr.join(' ')),//getUpdatedVersion(o),
        {
            relative: true,
            starttag: o.startTag,
            endtag: o.endTag,
            transform: function (filepath) {
                return filepath;
            }
        });
}

function injectAppVersion(o) {
    var versionInfo = 'version: \'' + (buildVersionArr.length === 3 ? (isInjectDev ? buildVersionArr[2] : buildVersionArr[2].split(' ')[1]) : '') + '\'';
    return $.inject(getReadableString(versionInfo),
        {
            relative: false,
            starttag: o.startTag,
            endtag: o.endTag,
            transform: function (filepath) {
                return filepath.slice(1);   //will take off the leading "/" in the "path"
            }
        });
}

//function getUpdatedVersion(o) {
//    return getReadableString(getUpdatedVersionInfo(o).join(' '));
//}

function getUpdatedVersionArr() {
    var o = { src: files.manifestFile, startTag: '#beginversion', endTag: '#endversion' },
        result = [],
        re = new RegExp(o.startTag + '([\\s,\\S]*)' + o.endTag, 'g'),   //all characters between start and end tags
        versionArr = re.exec(fs.readFileSync(o.src, 'utf-8'));
    if (versionArr && versionArr.length === 2) {
        var version = versionArr[1];
        result = version;   //send back original in case of bad data
        var versionParts = version.replace('\r', '').replace('\n', '').replace('\r\n', '').split(' ');  //clean and split the value
        if (versionParts && versionParts.length === 4) {    // 1) # (comment character) 2) VERSION 3) {date} (YYYYMMDD format) 4) version number (e.g. v1.0)
            result = [versionParts[0], versionParts[1], getVersionInfo(versionParts[2], versionParts[3])];
        }
    }
    return result;
}

function getReadableString(val) { //make the string a readable stream for gulp
    var src = require('stream').Readable({ objectMode: true });
    src._read = function () {
        this.push(new $.util.File({ cwd: "", base: "", path: val, contents: new Buffer('') }));  //injection is looking for path info -- place string value in path
        this.push(null);
    }
    src.end = function () { }   //must implement
    return src;
}

function getVersionInfo(origDate, origVersion) {
    var dt = new Date(),
        today = new Date();
    if (origDate.length === 8) {    //YYYYMMDD
        dt = new Date(parseInt(origDate.substring(0, 4)), parseInt(origDate.substring(4, 6)) - 1, parseInt(origDate.substring(6)));
    }

    var isNewDate = (today.setHours(0, 0, 0, 0) !== dt.setHours(0, 0, 0, 0)); //comparing dates with midnight hour
    return (isNewDate ? today.getFullYear().toString() + ('00' + (today.getMonth() + 1)).slice(-2) + ('00' + today.getDate()).slice(-2) : origDate) + ' ' + getVersionNumber(origVersion);//, isNewDate);
}

function getVersionNumber(origVersion) {//, isNewDate
    var nextV = parseFloat(origVersion.replace('v', '')) + 0.01;
    return 'v' + nextV.toFixed(2);   //ensure 2 decimal places are represented
    //return (isNewDate ? 'v1.0' : origVersion + '1');    //append on version number if date is current
}