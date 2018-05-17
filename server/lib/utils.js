'use strict';

var fs               = require('fs');
var path             = require('path');
var PropertiesReader = require('properties-reader');

var properties;
var self = {};


if(fs.existsSync(path.resolve(__dirname, '../config/config.properties'))){
    properties       = PropertiesReader(path.resolve(__dirname, '../config/config.properties'));
}

self.getProperty = function (keyName) {
    return properties.get(keyName);
}

module.exports = self;
