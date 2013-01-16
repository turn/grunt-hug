var sinon = require('sinon'),
	mocks = require('mocks'),
	path = require('path'),
	theModule = mocks.loadFile(path.resolve(path.dirname(module.filename), '../lib/dependencyManager.js'));

exports.hug = {
	setUp: function(callback){
		this.dependencyManager = new theModule.DependencyManager();
		callback();
	},
	
	getId: function(test){
		var id = this.dependencyManager.getId('a');
		var sameId = this.dependencyManager.getId('a');
		var differentId = this.dependencyManager.getId('b');
		
		test.equal(id, sameId);
		test.notEqual(id, differentId);

		test.done();
	},

	getList: function(test){
		this.dependencyManager.register('b');
		this.dependencyManager.register('a');
		this.dependencyManager.register('c');

		this.dependencyManager.add('a','b');
		this.dependencyManager.add('a','c');
		this.dependencyManager.add('b','c');
		var list = this.dependencyManager.getList();
		
		test.deepEqual(list, ['c','b','a']);
		test.done();
	}
};