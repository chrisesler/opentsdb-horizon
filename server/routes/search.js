var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../lib/utils');
var data = require('../data/udb-10k');
var es =require('../lib/elasticclient');
var esclient = new es();

router.post('/mSearch', function(req, res, next){
    //rsconsole.log('dssd', req.body, req.body.queryObj);
    var query = req.body;
    var result = utils.mSearch(data, query);
    res.json(result);
});

router.post('/ns', function(req, res, next){
    //rsconsole.log('dssd', req.body, req.body.queryObj);
    var query = { searchPattern: "yas" };//req.body;
    //var result = utils.mSearch(data, query);
    res.json(result);
});

router.post('/namespaces', function(req, res) {
    //validate mandatatory fields
    if ( undefined === req.body.searchPattern || '' === req.body.searchPattern ) {
        res.status(400).json({
            message: 'Empty search string passed for namespace search'
        });
    }

    esclient.getNamespaceSuggestions({
            'searchPattern': req.body.searchPattern,
            'headers': req.headers
        }
    ).then(function(results){
        res.json( results );
    }, function(errorObj){
        res.status(502).json({
            message: errorObj.error
        });
    });

});

router.post('/metrics', function(req, res) { 
    //validate mandatatory fields
    if (undefined === req.body.searchPattern || '' === req.body.searchPattern ||
        undefined === req.body.namespace || '' === req.body.namespace ){
        res.status(400).json({
            message: 'Either search string or namespace params are empty'
        });
    }

    //if it passed basic validation, then execute query
    esclient.getMetricSuggestions({
            'query': req.body,
            'headers': req.headers
        }
    ).then(function(results){
        res.json( results );
    }, function(errorObject){
        res.status(502).json({
            message: errorObject.error
        });
    });

});

module.exports = router;