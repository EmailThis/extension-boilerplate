import browserify from 'browserify';
import {merge} from 'event-stream'
import fs from 'fs';
import gulp from 'gulp';
import gulpif from 'gulp-if';
import preprocessify from 'preprocessify';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';

const $ = require('gulp-load-plugins')();

var production = process.env.NODE_ENV === 'production';
var target = process.env.TARGET || 'chrome';
var environment = process.env.NODE_ENV || 'development';

var generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
var specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
var context = Object.assign({}, generic, specific);

var defaultManifest = {
  dev: {
    'background':
        {'scripts': ['scripts/livereload.js', 'scripts/background.js']}
  },

  firefox: {'applications': {'gecko': {'id': 'my-app-id@mozilla.org'}}}
};


// -----------------
// COMMON
// -----------------

function styles() {
  return gulp.src('src/styles/**/*.scss')
      .pipe($.plumber())
      .pipe(
          $.sass
              .sync(
                  {outputStyle: 'expanded', precision: 10, includePaths: ['.']})
              .on('error', $.sass.logError))
      .pipe(gulp.dest(`build/${target}/styles`));
}
exports.styles = styles;

function manifest() {
  return gulp.src('./manifest.json')
      .pipe(gulpif(!production, $.mergeJson({
        fileName: 'manifest.json',
        jsonSpace: ' '.repeat(4),
        endObj: defaultManifest.dev
      })))
      .pipe(gulpif(target === 'firefox', $.mergeJson({
        fileName: 'manifest.json',
        jsonSpace: ' '.repeat(4),
        endObj: defaultManifest.firefox
      })))
      .pipe(dest(`./build/${target}`))
}
exports.manifest = manifest;

// -----------------
// DIST
// -----------------

function zip() {
  return pipe(`./build/${target}/**/*`, $.zip(`${target}.zip`), './dist')
}

// Helpers
function pipe(src, ...transforms) {
  return transforms.reduce((stream, transform) => {
    const isDest = typeof transform === 'string'
    return stream.pipe(isDest ? gulp.dest(transform) : transform)
  }, gulp.src(src, { allowEmpty: true }))
}

function mergeAll(dest) {
  return merge(
      pipe('./src/icons/**/*', `./build/${dest}/icons`),
      pipe(['./src/_locales/**/*'], `./build/${dest}/_locales`),
      pipe([`./src/images/${target}/**/*`], `./build/${dest}/images`),
      pipe(['./src/images/shared/**/*'], `./build/${dest}/images`),
      pipe(['./src/**/*.html'], `./build/${dest}`))
}

function buildJS(target) {
  const files =
      [
        'background.js', 'contentscript.js', 'options.js', 'popup.js',
        'livereload.js'
      ]

      let tasks = files.map(file => {
        return browserify({entries: 'src/scripts/' + file, debug: true})
            .transform('babelify', {presets: ['@babel/preset-env']})
            .transform(
                preprocessify, {includeExtensions: ['.js'], context: context})
            .bundle()
            .pipe(source(file))
            .pipe(buffer())
            .pipe(gulpif(!production, $.sourcemaps.init({loadMaps: true})))
            .pipe(gulpif(!production, $.sourcemaps.write('./')))
            .pipe(gulpif(
                production,
                $.uglify({'mangle': false, 'output': {'ascii_only': true}})))
            .pipe(gulp.dest(`build/${target}/scripts`));
      });

  return merge.apply(null, tasks);
}

function js(done) {
  buildJS(target)
  done()
}
exports.js = js;

// Overall

// Tasks
function clean() {
  return pipe(`./build/${target}`, $.clean())
}
exports.clean = clean;

function watch() {
  $.livereload.listen();

  gulp.watch(['./src/**/*']).on('change', () => {
    $.runSequence('build', $.livereload.reload);
  });
}
exports.watch = watch;

function ext(done) {
  mergeAll(target)
  done()
}
exports.ext = ext

// exports.assets = gulp.parallel(exports.styles, exports.js);
exports.assets = gulp.series(exports.styles, exports.js);
exports.build = gulp.series(clean, exports.assets, ext);
exports.default = exports.build;
exports.dist = gulp.series(exports.build, zip);
exports.ext = gulp.series(manifest, exports.js, ext);
