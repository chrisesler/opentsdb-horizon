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

       var groups = { 'metric': [] };
       var metrics = [];
       for ( var i=0; i < results[0].hits.hits.length; i++ ) {
            var metric = {};
            ///*
            //var rawMetrics = results[0].hits.hits[i].inner_hits;//["inner-" + i].hits.hits;

            for ( var innerKey in results[0].hits.hits[i].inner_hits ) {
                var rawMetrics = results[0].hits.hits[i].inner_hits[innerKey].hits.hits;
                var tags = results[0].hits.hits[i]._source.tags;
                for ( var j=0; j < tags.length; j++ ) {
                    var tagKey = tags[j]['key.raw'];
                    var tagValue = tags[j]['value.raw'];
                    ( tagKey in groups && groups[tagKey].indexOf(tagValue) ) ? groups[tagKey].push(tagValue) : groups[tagKey] = [tagValue];
                }
                for ( var j=0; j<rawMetrics.length; j++ ) {
                    var metric = {};
                    metric.metric = rawMetrics[j]["_source"]["name.raw"];
                    if ( groups.metric.indexOf(metric.metric) === -1 )  {
                        groups.metric.push(metric.metric);
                    }
                    for ( var k=0; k < tags.length; k++ ) {
                        metric[tags[k]["key.raw"]] = tags[k]["value.raw"];
                    }
                    metrics.push(metric);
                }
            }
            //*/
       }
       // format output lists like [ { key: <group>, values: <metriclists[]>}, .. ]
       var tg = [];
       for (var o in groups) {
           var item = {};
           item.key = o;
           item.values = [];
           for(var i =0; i < groups[o].length; i++) {
               var it = groups[o][i];
               var sitem = {};
               sitem.values = [];
               sitem.key = it;
               for(var j=0; j < metrics.length; j++) {
                   var mit = metrics[j];
                   if(mit[o] === it) {
                       sitem.values.push(mit);
                   }
               }
               item.values.push(sitem);
           }
           tg.push(item);
       }
        res.json( { metrics: metrics, raw1: results, raw: metrics, results: tg} );
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

module.exports = router;