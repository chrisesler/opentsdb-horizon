//external
//var _             = require('lodash');
var Q             = require('q');
var os            = require('os');
var elasticsearch = require('elasticsearch');
//var md5           = require('md5');

//internal
var appconstant = require('../lib/shared/appconstant');
//var collector   = require('./metricscollector');
var utils       = require('./utils');
//var sharedutils = require('./shared/utils');
var app_setting = utils.getConfig();
//var simpleCache = {};

//var appName = 'olympus_server';
var tags    = {
    'env': utils.getEnv(),
    'host': os.hostname(),
    'userid': ''
};

function getElasticQueryResultExtractor(elasticSearchEndpoint) {
    if (elasticSearchEndpoint === 'namespaces') {
        return function (response) {
            if (response.aggregations.elasticQueryResults.buckets) {
                return response.aggregations.elasticQueryResults.buckets;
            }
            else {
                return [];
            }
        }
    }
    else if (elasticSearchEndpoint === 'appMetrics') {
        return function (response) {
            if (response.aggregations.elasticQueryResults.elasticQueryResults.elasticQueryResults.buckets) {
                return response.aggregations.elasticQueryResults.elasticQueryResults.elasticQueryResults.buckets;
            }
            else {
                return [];
            }
        }
    }
    else if (elasticSearchEndpoint === 'tagKeys') {
        return function (response) {
            if (response.aggregations.elasticQueryResults.elasticQueryResults.buckets) {
                return response.aggregations.elasticQueryResults.elasticQueryResults.buckets;
            }
            else {
                return [];
            }
        }
    }
    else if (elasticSearchEndpoint === 'tagValues') {
        return function (response) {
            if (response.aggregations.elasticQueryResults.elasticQueryResults.elasticQueryResults.buckets) {
                return response.aggregations.elasticQueryResults.elasticQueryResults.elasticQueryResults.buckets;
            }
            else {
                return [];
            }
        }
    }
}

/*
 Function to extract relevant response from ES
 Relevancy is determined by the elasticSearchEndpoint
 For ex: When searching for namespaces, relevant response is namespaceList
 @return suggestionValueList Array containing a list of namespaces/tagkeys/tagvalues/appmetrics
 */

function extractResultsFromElasticSearchResponse(elasticResponseList, extractorFn) {
    var resultValueMap = {};
    var results        = [];
    for (var i = 0; i < elasticResponseList.length; i += 1) {
        var response = elasticResponseList[i];
        if (response.timed_out === false && undefined !== response.hits) {
            results = extractorFn(response);
            // results will be empty if response structure is different
            // from the definition in the getElasticQueryResultExtractor
            for (var j = 0; j < results.length; j += 1) {
                resultValueMap[results[j].key] = 1;
            }
        }
        // else ignore the response
    }

    // TODO: capture if the map is empty  to do something meaningful
    return Object.keys(resultValueMap);
}

function convertPatternESCompat(searchPattern) {
    searchPattern = searchPattern.replace(/\s+/g, ".*");
    if ((searchPattern).search(/^\s*\.\*/) === -1) {
        searchPattern = '.*' + searchPattern;
    }
    if ((searchPattern).search(/\.\*\s*$/) === -1) {
        searchPattern = searchPattern + '.*'
    }
    return searchPattern.toLowerCase();
}

module.exports = function () {
    var self = this;

    self._makeESMultiQuery = function (queryBody, headers, timeout) {
        var defer                     = Q.defer(),          // defer object which will resolve with merged es reponses or err
            promises                  = [],              // holds promises created for es calls per colo
            elasticSearchResponseList = [];// object that holds the merged responses from colos which have a success response

        console.log("meta search body", JSON.stringify(queryBody));
        headers.host = "proxy-meta-bf1.yamas.ops.yahoo.com";
        console.log("headers", headers);

        //create a client for every ES cluster
        for (var i = 0; i < app_setting.elasticsearch.source.length; i++) {
            var esclient = new elasticsearch.Client({
                host: {
                    protocol: app_setting.elasticsearch.source[i].protocol,
                    host: app_setting.elasticsearch.source[i].host,
                    port: app_setting.elasticsearch.source[i].port,
                    headers: headers
                },
                log: 'info',
                maxRetries: 0
            });
            promises.push(
                esclient.msearch({
                    body: queryBody,
                    requestTimeout: timeout
                })
            );
        }

        Q.allSettled(promises)
            .then(function (results) {
                var error = [];
                for (var i = 0; i < results.length; i += 1) {
                    var result = results[i];
                    // if success, merge with responses from other colos, else discard
                    if (result.state === 'fulfilled') {
                        elasticSearchResponseList.push(result.value.responses[0]);
                    }
                    else if (result.state === 'rejected') {
                        console.log('es colo failed to respond with success response',
                            JSON.stringify(queryBody),
                            result.reason.message);
                        error.push({
                            'colo': i,
                            'reason': result.reason.message
                        });
                    }
                }
                if (elasticSearchResponseList.length > 0) {
                    defer.resolve(elasticSearchResponseList);
                }
                // if all responses are unsuccessful, reject with err
                else {
                    defer.reject({
                        'message': 'both colos failed to respond',
                        'error': error
                    });
                }
            }, function(err){
                defer.reject(err);
            });

        return defer.promise;
    };

    self.getNamespaceSuggestions = function (params) {
        var defer       = Q.defer();
        var suggestions = [];
        var startTime, endTime, requestTime;
        var searchPattern = params.searchPattern,
            headers = params.headers;

        searchPattern = convertPatternESCompat(searchPattern);

        var queryBody = {
            "size": "0",
            "query": {
                "bool": {
                    "must": [
                        {
                            "regexp": {
                                "namespace.lowercase": searchPattern
                            }
                        }

                    ]
                }
            },
            "aggs": {
                "elasticQueryResults": {
                    "terms": {"field": "namespace.raw", "size": "0"}
                }
            }
        };

        //build multiquery object
        var multisearchQueryBody = [], queryMetadata;
        queryMetadata            = {
            "index": "all_namespace",
            "query_cache": true
        };

        //note: keep insertion order, expected by elastic search
        multisearchQueryBody.push(queryMetadata);
        multisearchQueryBody.push(queryBody);

        tags.endpoint = 'namespace';

        startTime = (new Date()).getTime();
        self._makeESMultiQuery(
            multisearchQueryBody,
            headers,
            appconstant.NAMESPACE_ES_QUERY_TIMEOUT_MS
        ).then(function (resp) {
            endTime     = (new Date()).getTime();
            requestTime = endTime - startTime;
            suggestions = extractResultsFromElasticSearchResponse(
                resp,
                getElasticQueryResultExtractor('namespaces')
            );
            defer.resolve(suggestions);
        }, function (error) {
            defer.reject(error);
        });

        return defer.promise;
    };

    self.parseSearchTerms = function(terms) {
        // js regex does not support lookbehind just yet
        // hack it.
        var t = terms.toString()
                .replace(/\s{2,}/g, ' ')
                .trim()
                .replace(/\s(?=[:,|])/g, '')
                .split('').reverse().join('')
                .replace(/\s(?=[:,|])/g, '')
                .split('').reverse().join('')
                .split(' ');
    
        t.sort(function(a,b) {
            var re = /[,|]/g;
            var x = a.search(re);
            var y = b.search(re);
            return x < y ? 1 : x > y ? -1 : 0;
        });
        return t;       
    };

    self.getBoolQuery = function(pattern, index) {
        var tagKeyCondition = {
                        "nested": {
                            "path": "tags",
                            "query": {
                                "bool": {
                                    "should": []
                                }
                            }
                        }
                    };
        var tagValueCondition = {
                        "nested": {
                            "path": "tags",
                            "query": {
                                "bool": {
                                    "should": []
                                }
                            }
                        }
                    };
        var metricCondition = {
                        "nested": {
                            "path": "AM_nested",
                            "query": {
                                "bool": {
                                    "should": []
                                }
                            }
                        }
                    };
        var tagKeyValueCondition =  function(key, pattern) {
            return {
                        "nested": {
                            "path": "tags",
                            "query": {
                                "bool": {
                                    "must": [
                                        {
                                            "term": {
                                                "tags.key.lowercase": key
                                            }
                                        },
                                        {
                                            "regexp": {
                                                "tags.value": pattern
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                };
        }
        var regexCondition = function(key, pattern) {
            var regexCondition = {
                "regexp": {}
            };
            regexCondition["regexp"][key] = pattern;
            return regexCondition;
        };

        var condition = {
                            "bool": { "should":[] }
                        };
        
        var patterns = pattern.split(",");
        var freeTextSearch = false;
        for ( var i=0; i< patterns.length; i++ ) {
            if ( patterns[i].indexOf(":") !== -1 ) {
                var kv = patterns[i].split(":");
                condition.bool.should.push(tagKeyValueCondition(kv[0],convertPatternESCompat(kv[1])));
            } else {
                freeTextSearch = true;
                var esPattern = convertPatternESCompat(patterns[i]);
                metricCondition.nested.query.bool.should.push(regexCondition( "AM_nested.name.lowercase" , esPattern));
                tagKeyCondition.nested.query.bool.should.push(regexCondition( "tags.key.lowercase" , esPattern));
                tagValueCondition.nested.query.bool.should.push(regexCondition( "tags.value" , esPattern));
            }
        }
        if ( freeTextSearch ) {
            condition.bool.should.push(metricCondition);
            condition.bool.should.push(tagKeyCondition);
            condition.bool.should.push(tagValueCondition);
        }
        return condition;
    };
    
    self.getMetricSuggestions = function (params) {
        var defer       = Q.defer();
        var suggestions = [];
        var queryParams = params.query,
            headers = params.headers;
        var namespace     = queryParams.namespace.toLowerCase();
        var searchPattern = queryParams.searchPattern.toLowerCase();
        var startTime, endTime, requestTime;
        //TODO: split the search pattern by space and generate several filters,
        //this would allow to search for "inter lat" or "lat inter"

        var queryBody = {
                "query": {
                    "filtered": {
                        "filter": {
                            "bool": {
                                "must": []
                            }
                        }
                    }
                },
                "size": 1000,
                "_source": {
                    "excludes": ["lastSeenTime", "firstSeenTime", "application.raw", "timestamp"]
                }
        };

        var searchTerms = self.parseSearchTerms(searchPattern);

        for ( var i=0; i< searchTerms.length; i++ ) {
            queryBody.query.filtered.filter.bool.must.push(self.getBoolQuery(searchTerms[i], i));
        }
        
        console.log("search pattern", searchPattern, JSON.stringify(queryBody));

        //build multiquery object
        var multisearchQueryBody = [], queryMetadata;
        queryMetadata            = {
            "index": namespace,
            "query_cache": true
        };
        // am => only metrics
        // tagkeys => only have metrics and tagKeys
        // namespace will have everything

        //note: keep insertion order, expected by elastic search
        multisearchQueryBody.push(queryMetadata);
        multisearchQueryBody.push(queryBody);

        tags.endpoint = 'metrics';

        startTime = (new Date()).getTime();
        //perform the query
        self._makeESMultiQuery(
            multisearchQueryBody,
            headers,
            appconstant.METRIC_ES_QUERY_TIMEOUT_MS
        ).then(function (resp) {
            defer.resolve(resp);
        }, function (error) {
            defer.reject(error);
        });

        return defer.promise;
    };

    return self;
};
