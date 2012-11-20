/*
 * grunt-contrib-hug
 * https://github.com/ozanturgut/grunt-contrib-hug
 *
 * Copyright (c) 2012 Ozan Turgut
 * Licensed under the MIT license.
 * https://github.com/ozanturgut/grunt-contrib-hug/blob/master/LICENSE-MIT
 */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    test_vars: {
      name: 'grunt-contrib-hug',
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
        es5: true
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      test: ['./tmp']
    },

    // Configuration to be run (and then tested).
    hug: {
      test: {
        src: "./test/fixtures",
        dest: "./tmp/test.js",
        exportsVariable: "theGlobal"
      },
      example: {
        src: "./example",
        dest: "./tmp/example.js"
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

  // The clean plugin helps in testing.
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the 'test' task is run, first clean the 'tmp' dir, then run this
  // plugin's task(s), then test the result.
  grunt.renameTask('test', 'nodeunit');
  grunt.registerTask('test', 'clean hug nodeunit');

  // By default, lint and run all tests.
  grunt.registerTask('default', 'lint test');
};