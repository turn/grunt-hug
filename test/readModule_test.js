var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	readModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../lib/readModule.js'));

exports.hug = {
	fulfillRequirements: function(test){
		var srcPath = path.resolve(module.filename),
			src = "require('" + srcPath.replace(/\\/g,"\\\\") + "')",
			dependencyManager = {
				add: sinon.spy(),
				getId: sinon.stub().returns("__m0")
			};
		
		var dependencyFinder = new RegExp("require\\([\'|\"](.*)[\'|\"]\\)","gi");
		var result = readModule.fulfillRequirements(src, srcPath, [srcPath], dependencyManager, dependencyFinder);

		test.ok(dependencyManager.getId.calledWith(srcPath), "get id");
		test.ok(dependencyManager.add.calledWith(srcPath, srcPath), "add");
		test.equal(result, "__m0", "requirements fulfilled");

		test.done();
	}
};