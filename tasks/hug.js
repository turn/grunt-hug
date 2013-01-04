var path = require('path'),
	hug = require('../lib/hug.js');

module.exports = function(grunt){
	grunt.registerMultiTask('hug', 'Wrap client-side files in anonymous functions, and concatenate with dependency solving', function(){
		var complete = this.async(),
			srcList = grunt.file.expandFiles(this.file.src),
			exportMap = this.data.exports,
			exportsVariable = this.data.exportsVariable,
			destPath = this.file.dest,
			pathList = [];

		srcList.forEach(function(src){
			pathList.push(path.resolve(src));
		});

//	try{
		hug(pathList, exportMap, function(content){
			if(exportMap) content = exportsVariable + "=" + content;

			grunt.file.write(destPath, content);
			grunt.log.writeln('File "' + destPath + '" created.');
			complete(true);
		});
//	} catch(e){
//		grunt.log.error(e.message);
//		complete(false);
//	}
	});
};