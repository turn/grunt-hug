var path = require('path'),
	fs = require('fs');

var header = "(function(module,exports){module.exports=exports;\n",
	footer = "\n;return module.exports;}({},{}));",
	dependencyFinder = /require\([\'||\"](.*)[\'||\"]\)/gi;

// http://phpjs.org/functions/stripslashes/
function stripslashes (str) {
  return (str + '').replace(/\\(.?)/g, function (s, n1) {
    switch (n1) {
    case '\\':
      return '\\';
    case '0':
      return '\u0000';
    case '':
      return '';
    default:
      return n1;
    }
  });
}

function fulfillRequirements(src, srcPath, dependencyManager){
	var dependencyMatch,
		dependecyPath,
		replaceQueue = [],
		src = src.toString();
	
	while(dependencyMatch = dependencyFinder.exec(src)){
		dependencyPath = stripslashes(dependencyMatch[1]);
		if(!dependencyPath) continue;

		dependencyPath = path.resolve(path.dirname(srcPath), dependencyPath);
		
		dependencyManager.add(srcPath, dependencyPath);
		
		replaceQueue.push([
			dependencyMatch[0],
			dependencyManager.getId(dependencyPath)
		]);
	}
	
	replaceQueue.forEach(function(replaceObj){
		src = src.replace(replaceObj[0], replaceObj[1]);
	});

	return src;
}

function readModule(path, dependencyManager, callback){
	var moduleId = dependencyManager.getId(path);
	fs.readFile(path, function(err, src){
		src = fulfillRequirements(src, path, dependencyManager);
		callback("var " + moduleId + "=" + header + src + footer);
	});
}

module.exports = readModule;