/*
 * grunt-contrib-hug
 * https://github.com/ozanturgut/grunt-contrib-hug
 *
 * Copyright (c) 2012 Ozan Turgut
 * Licensed under the MIT license.
 * https://github.com/ozanturgut/grunt-hug/blob/master/LICENSE-MIT
 */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    test_vars: {
      name: 'grunt-hug',
      version: '0.1.0'
    },

    lint: {
      all: ['grunt.js', 'tasks/*.js', '<config:nodeunit.tasks>']
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true,
        strict: false,
        es5: true
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      test: ['./tmp']
    },

    // Configuration to be run (and then tested).
    hug: {
      advanced: {
        src: "./example/advanced/**/*",
        dest: "./tmp/advanced-example.js",
        exportsVariable: "example",
        exports: "./example/advanced/exports.js"
      },
      simple: {
        src: "./example/simple/**/*",
        dest: "./tmp/simple-example.js"
      }
    },

    // Unit tests.
    nodeunit: {
      tasks: ['test/*_test.js']
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // The clean plugin helps in testing.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the 'test' task is run, first clean the 'tmp' dir, then run this
  // plugin's task(s), then test the result.
  grunt.renameTask('test', 'nodeunit');
  grunt.registerTask('test', 'clean hug nodeunit');

  // By default, lint and run all tests.
  grunt.registerTask('default', 'lint test');
};