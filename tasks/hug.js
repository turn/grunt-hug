var path = require('path'),
	hug = require('../lib/hug.js');

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var complete = this.async(),
			destPath = this.file.dest;

		hug({
			srcList: grunt.file.expandFiles(this.file.src),
			exports: this.data.exports,
			exportsVariable: this.data.exportsVariable,
			success: function(content){
				grunt.file.write(destPath, content);
				grunt.log.writeln('File "' + destPath + '" created.');
				complete(true);
			},
			error: function(message){
				grunt.log.error(message);
				complete(false);
			}
		});
	});
};