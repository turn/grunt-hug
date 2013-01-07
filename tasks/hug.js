var path = require('path'),
	hug = require('../lib/hug.js');

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var complete = this.async(),
			srcList = grunt.file.expandFiles(this.file.src),
			options,
			destPath = this.file.dest;

		options = {
			exportedVariable: this.data.exportedVariable,
			exports: this.data.exports,
			headList: this.data.header? grunt.file.expandFiles(this.data.header) : [],
			moduleVariableName: this.data.moduleVariableName,
			exportsVariableName: this.data.exportsVariableName,
			requireFunctionName: this.data.requireFunctionName,
			success: function(content){
				grunt.file.write(destPath, content);
				grunt.log.writeln('File "' + destPath + '" created.');
				complete(true);
			},
			error: function(message){
				grunt.log.error(message);
				complete(false);
			}
		};

		hug(srcList, options);
	});
};