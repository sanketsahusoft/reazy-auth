'use strict';

var generators = require('yeoman-generator');
var fs = require('fs-extra');
var path = require('path');
var assign = require('object.assign').getPolyfill();
var transform = require('../../lib/transform');

function useService(filename, statement) {
  var fileContents = fs.readFileSync(filename, { encoding: 'utf8' }).split('\n');
  var indexOfApp = fileContents.length - 1;
  fileContents.filter(function (word, index) {
    if (word.match(/reazy\(\)/g)) {
      indexOfApp = index;
      return true;
    }
    return false;
  });
  fileContents.splice(indexOfApp + 1, 0, '');
  fileContents.splice(indexOfApp + 2, 0, statement);
  fileContents = fileContents.join('\n');
  fs.writeFileSync(filename, fileContents, { encoding: 'utf8' });
}

function importService(filename, name, moduleName) {
  if (fs.existsSync(filename)) {
    var content = fs.readFileSync(filename).toString();
    var ast = transform.parse(content);

    transform.addImport(ast, name, moduleName);

    fs.writeFileSync(filename, transform.print(ast));
  }
}

module.exports = generators.Base.extend({
  constructor: function constructor() {
    generators.Base.apply(this, arguments);
  },

  initializing: function initializing() {
    // const done = this.async();

    this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    if (!this.pkg || !this.pkg.name) {
      this.log('Please run this command in the root of a Reazy project');
      process.exit(1);
    }

    this.props = {
      name: this.pkg.name || process.cwd().split(path.sep).pop()
    };
  },

  writing: function writing() {
    var appJsPath = this.destinationPath('src/app.js');

    importService(appJsPath, 'auth', 'reazy-auth');
    useService(appJsPath, 'app.use(auth(), \'auth\')');
  }
});