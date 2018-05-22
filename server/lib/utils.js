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
};

self.getEnv = function() {
    if (process.env.NODE_ENV === 'dev') {
        return 'dev';
    } else {
        return 'prod';
    }
};

self.getConfigByEnv = function (env) {
    var config = require('../config/app_config');
    return config[env];
};

self.getConfig = function() {
    var env = this.getEnv();
    return this.getConfigByEnv(env);
};

module.exports = self;
