import fs from "fs";
import gulp from 'gulp';
import {merge} from 'event-stream'
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import preprocessify from 'preprocessify';
import gulpif from "gulp-if";

const $ = require('gulp-load-plugins')();

var production = process.env.NODE_ENV === "production";
var target = process.env.TARGET || "chrome";
var environment = process.env.NODE_ENV || "development";

var generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
var specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
var context = Object.assign({}, generic, specific);

var manifest = {
  dev: {
    "background": {
      "scripts": [
        "scripts/livereload.js",
        "scripts/background.js"
      ]
    }
  },

  firefox: {
    "applications": {
      "gecko": {
        "id": "my-app-id@mozilla.org"
      }
    }
  }
}

// Tasks
gulp.task('clean', () => {
  return pipe(`./build/${target}`, $.clean())
})

gulp.task('build', (cb) => {
  $.runSequence('clean', 'styles', 'ext', cb)
});

gulp.task('watch', ['build'], () => {
  $.livereload.listen();

  gulp.watch(['./src/**/*']).on("change", () => {
    $.runSequence('build', $.livereload.reload);
  });
});

gulp.task('default', ['build']);

gulp.task('ext', ['manifest', 'js'], () => {
  return mergeAll(target)
});


// -----------------
// COMMON
// -----------------
gulp.task('js', () => {
  return buildJS(target)
})

gulp.task('styles', () => {
  return gulp.src('src/styles/**/*.scss')
    .pipe($.plumber())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe(gulp.dest(`build/${target}/styles`));
});

gulp.task("manifest", () => {
  return gulp.src('./manifest.json')
    .pipe(gulpif(!production, $.mergeJson({
      fileName: "manifest.json",
      jsonSpace: " ".repeat(4),
      endObj: manifest.dev
    })))
    .pipe(gulpif(target === "firefox", $.mergeJson({
      fileName: "manifest.json",
      jsonSpace: " ".repeat(4),
      endObj: manifest.firefox
    })))
    .pipe(gulp.dest(`./build/${target}`))
});



// -----------------
// DIST
// -----------------
gulp.task('dist', (cb) => {
  $.runSequence('build', 'zip', cb)
});

gulp.task('zip', () => {
  return pipe(`./build/${target}/**/*`, $.zip(`${target}.zip`), './dist')
})


// Helpers
function pipe(src, ...transforms) {
  return transforms.reduce((stream, transform) => {
    const isDest = typeof transform === 'string'
    return stream.pipe(isDest ? gulp.dest(transform) : transform)
  }, gulp.src(src))
}

function mergeAll(dest) {
  return merge(
    pipe('./src/icons/**/*', `./build/${dest}/icons`),
    pipe(['./src/_locales/**/*'], `./build/${dest}/_locales`),
    pipe([`./src/images/${target}/**/*`], `./build/${dest}/images`),
    pipe(['./src/images/shared/**/*'], `./build/${dest}/images`),
    pipe(['./src/**/*.html'], `./build/${dest}`)
  )
}

function buildJS(target) {
  const files = [
    'background.js',
    'contentscript.js',
    'options.js',
    'popup.js',
    'livereload.js'
  ]

  let tasks = files.map( file => {
    return browserify({
      entries: 'src/scripts/' + file,
      debug: true
    })
    .transform('babelify', { presets: ['es2015'] })
    .transform(preprocessify, {
      includeExtensions: ['.js'],
      context: context
    })
    .bundle()
    .pipe(source(file))
    .pipe(buffer())
    .pipe(gulpif(!production, $.sourcemaps.init({ loadMaps: true }) ))
    .pipe(gulpif(!production, $.sourcemaps.write('./') ))
    .pipe(gulpif(production, $.uglify({ 
      "mangle": false,
      "output": {
        "ascii_only": true
      } 
    })))
    .pipe(gulp.dest(`build/${target}/scripts`));
  });

  return merge.apply(null, tasks);
}