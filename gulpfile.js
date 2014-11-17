var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");

gulp.task("default", function() {
	gulp.src("src/aisplitter.js")
		.pipe(uglify({mangle:{
			except: ["AISplitter", "Frames"]
		} ,preserveComments:"some"}))
		.pipe(rename("aisplitter.min.js"))
		.pipe(gulp.dest("./"));
});