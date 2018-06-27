var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../lib/utils');
var data = require('../data/udb-10k');

router.post('/mSearch', function(req, res, next){
    //rsconsole.log('dssd', req.body, req.body.queryObj);
    var query = req.body;
    var result = utils.mSearch(data, query);
    res.json(result);
});

module.exports = router;