var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../lib/utils');
var data = require('../data/udb-10k');

router.post('/mSearch', function(req, res, next){
    var query = req.body.queryObj;
    var result = utils.mSearch(data, query);
    json.res(result);
});

module.exports = router;