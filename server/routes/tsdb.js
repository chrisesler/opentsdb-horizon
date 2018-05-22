'use strict';

var Promise = require('bluebird');
var rp = require('request-promise');
var request = require('request');
var express = require('express');
var router = express.Router();
var utils = require('../lib/utils');
var conf = utils.getConfig();

router.post('/hello', function (req, res, next) {
  res.json({ req: req.headers });
});

router.post('/queryData', function (req, res, next) {
  var queryObj = req.body;
  var options = {
    method: 'POST',
    uri: conf.tsdb_host + '/api/query',
    body: queryObj,
    headers: req.headers,
    gzip: true,
    json: true
  };
  rp(options)
    .then(function(data) {
      res.json(data);
    })
    .catch(function (error) {
      res.json({'error': error});
    });
});


module.exports = router;