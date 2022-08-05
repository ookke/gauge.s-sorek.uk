var gulp = require('gulp');
var del = require('del');
var concat = require('gulp-concat');
var gulpIgnore = require('gulp-ignore');
var rename = require('gulp-rename');
var minifyJS   = require( 'gulp-uglify' ) ,
    cleanCSS  = require( 'gulp-clean-css' ) ,
    concatCSS = require('gulp-concat-css')
    minifyHTML = require( 'gulp-htmlmin' )  ;


    const { series, parallel } = require('gulp');


    var dest = 'dist/';
     
    function clean() {
        return del(['./dist/**']);
    }
    
    function cssBundle() {
        return gulp.src(['./**/*.css', '!./node_modules/**']).pipe(cleanCSS({ level: 1})).pipe(concatCSS('dots-ui.css')).pipe(gulp.dest(dest));
    }

    function jsBundle() {
      //TODO: doesn't handle lib/ace atm, could just copy it as is to dist/ ?
        return gulp.src(['./**/*.js', '!./node_modules/**', '!gulpfile.js', '!dev-server.js', '!./lib/ace/**','!./log-viewer/graph.js']).pipe(minifyJS()).pipe(concat('dots-ui.js')).pipe(gulp.dest(dest));
    }
    
    function publish() {
      return gulp.src('index_dist.htm').pipe(rename('index.htm')).pipe(gulp.dest(dest));
    }
    
    exports.build = series(
      clean,
      cssBundle,
      jsBundle,
      publish
    );