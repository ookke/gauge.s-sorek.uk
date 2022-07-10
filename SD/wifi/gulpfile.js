var gulp = require('gulp');
var del = require('del');
var concat = require('gulp-concat');
var gulpIgnore = require('gulp-ignore');
var minifyJS   = require( 'gulp-uglify' ) ,
    cleanCSS  = require( 'gulp-clean-css' ) ,
    concatCSS = require('gulp-concat-css')
    minifyHTML = require( 'gulp-htmlmin' )  ;


    const { series, parallel } = require('gulp');


    var dest = 'dist/';
     
    function clean(cb) {
        return del(['./dist/**']);
    }
    
    function cssBundle() {
        return gulp.src(['./**/*.css', '!./node_modules/**']).pipe(cleanCSS({ level: 1})).pipe(concatCSS('dots-ui.css')).pipe(gulp.dest(dest));
    }

    function jsBundle(cb) {
        return gulp.src(['./**/*.js', '!./node_modules/**', '!gulpfile.js', '!dev-server.js', '!./lib/**','!./log-viewer/graph.js']).pipe(minifyJS()).pipe(concat('dots-ui.js')).pipe(gulp.dest(dest));
    }
    
    function publish(cb) {
      // body omitted
      cb();
    }
    
    exports.build = series(
      clean,
       cssBundle,
       jsBundle,
      publish
    );