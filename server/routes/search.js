var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var rp = require('request-promise');
var utils = require('../lib/utils');
var data = require('../data/udb-10k');
var es =require('../lib/elasticclient');
var esclient = new es();

router.post('/mSearch', function(req, res, next){
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
       var metrics = [];
       for ( var i=0; i < results[0].hits.hits.length; i++ ) {
            var metric = {};
            var rawMetrics = results[0].hits.hits[i]._source.AM_nested;
            var tags = results[0].hits.hits[i]._source.tags;
            for ( var j=0; j<rawMetrics.length; j++ ) {
                var metric = {};
                metric.metric = rawMetrics[j]["name.raw"];
                for ( var k=0; k < tags.length; k++ ) {
                    metric[tags[k]["key.raw"]] = tags[k]["value.raw"];
                }
                metrics.push(metric);
            }
       }
        var result = utils.mSearch(metrics, req.body);
        res.json(result);
    }, function(errorObject){
        res.status(502).json({
            message: errorObject.error
        });
    });

});


router.post('/ns', function(req, res, next){
    //rsconsole.log('dssd', req.body, req.body.queryObj);
    var query = { searchPattern: "yas" };//req.body;
    //var result = utils.mSearch(data, query);
    res.json(result);
});
///*
router.post('/namespaces', function(req, res) {
    //validate mandatatory fields
    if ( undefined === req.body.searchPattern ) {
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

router.post('/tagkeys', function(req, res) {
    //validate mandatatory fields
    if ( undefined === req.body.metrics ) {
        res.status(400).json({
            message: 'Empty metrics passed'
        });
    }

    esclient.getTagKeysForMetrics({
            'metrics': req.body.metrics,
            'headers': req.headers
        }
    ).then(function(results){
        console.log("\n\nTAG KEYS********\n\n", JSON.stringify(results));
        res.json( results );
    }, function(errorObj){
        res.status(502).json({
            message: errorObj.error
        });
    });

});

router.post('/nstagkeys', function(req, res) {
    //validate mandatatory fields
    if ( undefined === req.body.namespace ) {
        res.status(400).json({
            message: 'Empty namespace passed'
        });
    }

    esclient.getTagkeysForNamespace({
            'namespace': req.body.namespace,
            'headers': req.headers
        }
    ).then(function(results){
        console.log("\n\nTAG KEYS********\n\n", JSON.stringify(results));
        res.json( results );
    }, function(errorObj){
        res.status(502).json({
            message: errorObj.error
        });
    });

});

router.post('/tagvalues', function(req, res) {
    //validate mandatatory fields
    if (
        req.body.metrics === undefined || !Array.isArray(req.body.metrics) || req.body.metrics.length === 0 ||
        req.body.tag === undefined || !req.body.tag.key || !req.body.tag.value 
    ) {
        res.status(400).json({
            message: 'Error: metrics, tag_search or tags_filtered are empty or non valid params'
        });
    }

    //if it passed basic validation, then execute query
    esclient.getPossibleValuesForTag({
        'metrics':      req.body.metrics,
        'headers':       req.headers,
        'tagsFiltered': req.body.filters || [],
        'tagSearch':    req.body.tag
    }).then(function( results ){
        res.json( results );
    }, function(errorObject){
        res.status(502).json({
            message: errorObject.error
        });
    });

});

module.exports = router;