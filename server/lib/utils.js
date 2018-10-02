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

// below are methods using in dealing with json metric search
self.arrayFromObject = function(obj) {
    var arr = [];
    /*for (var o in obj) {
       arr.push(obj[o])
    }*/

    for (var o in obj) {
        var item = {};
        item.key = o;
        //item.count = obj[o].length;
        item.values = obj[o];
        arr.push(item);
    }
    arr.sort(function(a,b) {
        return b.count - a.count;
    });

    return arr;
};

self.groupByQuery = function(list, query_params) {
    var groups = {};
    var query;   
    try {
        query = query_params.split(',');
    } catch  (e) {
        query = [];
    }
    console.log(query_params);
    for (var i=0; i <data_limit; i++) {
        var group = [];
        for (var j=0; j < query.length; j++) {
            group.push(JSON.stringify(list[i][query[j]]));
        }
        //var group = JSON.stringify(query)
        console.log(group);
        if (group in groups) {
            groups[group].push(list[i]);
        } else {
            groups[group] = [list[i]]
        }
    }
    //return groups;
    return self.arrayFromObject(groups);
};

self.groupBy = function(list, fn) {
    var groups = {};
    for (var i=0; i < data_limit; i++) {
        var group = JSON.stringify(fn(list[i]));
        console.log(group);
        if (group in groups) {
            groups[group].push(list[i]);
        } else {
            groups[group] = [list[i]];
        }
    }
    return self.arrayFromObject(groups);
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
/* 
* | or comma is OR
* space is AND
*/
self.mSearch = function(list, query) {
    console.log('query', query);
    var str = query.searchPattern;
    if (str === '') {
        return;
    }
    var sflag = query.flag;
    var sCondition = [];
    var matchKeys = [], invalidKeys = [];
    var q = self.parseSearchTerms(str);
    for (var i=0; i < q.length; i++) {
        var t= q[i].split(':');
        sCondition.push(t);
    }
    console.log('sCond', sCondition);
 
    var groupingFn = function(key, matchkeys) {
        if(matchkeys.indexOf(key) === -1) {
            matchkeys.push(key);
        }
    };
    // one of the filter failed, we failed and skip it.
    // not fix in prototype, but case sensitive in Json
    var filterValueFn = function(item, filterArray, invalidKeys, matchKeys, sflag) {
        var pass = false;
        var _matchKeys = [];
        for(var i=0; i < filterArray.length; i++) {
            var filter = filterArray[i];
            // each filter is array with one or two elements
            if(filter.length === 2) {              
                if (!item.hasOwnProperty(filter[0])) {
                    invalidKeys.push(filter[0]);
                    return false;
                }
                // has key:value, filter value might have more | mean or of these vals
                var fvals = [];
                if (filter[1].indexOf('|') > -1) {
                    fvals = filter[1].split('|');
                } else {
                    fvals = filter[1].split(',');
                }
                //var fvals = filter[1].split('|');
                if(fvals.length > 1) {
                    var check = false;
                    for(var j=0; j < fvals.length; j++) {
                        var mReg = new RegExp(fvals[j], 'gi');
                        var _check = mReg.test(item[filter[0]]);
                        if(_check) groupingFn(filter[0] +':' + item[filter[0]], _matchKeys);
                        check = check || _check;
                    }
                    pass = check;
                    if(!pass) return false;
                } else {  //fvals only have 1 vals mean and of this vals
                    var mReg = new RegExp(fvals[0], 'gi');
                    pass = mReg.test(item[filter[0]]);
                    if(pass) groupingFn(filter[0] + ':' + item[filter[0]], _matchKeys);
                    if(!pass) return false;
                }              
            } else {
                // this is case when user did not specify key:, but may you pipe for multiple vals
                //var fvals = filter[0].split('|');
                var fvals = [];
                if (filter[0].indexOf('|') > -1) {
                    fvals = filter[0].split('|');
                } else {
                    fvals = filter[0].split(',');
                }                
                if (fvals.length > 1) {
                    var check = false;
                    for (var j=0; j < fvals.length; j++) {
                        var mReg = new RegExp(fvals[j], 'gi');
                        // no key so we test it again both key and value of item
                        for (var k in item) {
                            var _check = (sflag === '0') ? (mReg.test(k) || mReg.test(item[k])) : mReg.test(item[k]);
                            if (_check) groupingFn(k + ':' + item[k], _matchKeys);
                            check = check || _check;
                        }    
                    }
                    pass = check;
                    if (!pass) return false;
                } else {
                    // a single free string
                    var mReg = new RegExp(fvals[0], 'gi');
                    var check = false;
                    for (var k in item) {
                        var _check = (sflag === '0') ? (mReg.test(k) || mReg.test(item[k])) : mReg.test(item[k]);
                        if(_check) groupingFn(k + ':' + item[k], _matchKeys);
                        check = check || _check;
                    }
                    pass = check;
                    if(!pass) return false;
                }
            }
        }
        if(pass) {
            // merge the _matchKeys to matchKeys
            for(var i=0; i < _matchKeys.length; i++) {
                var m = _matchKeys[i];
                if(matchKeys.indexOf(m) === -1) {
                    matchKeys.push(m);
                }
            }
        }
        return pass;
    };
  
    var finalResult = self.filter(list, sCondition, invalidKeys, matchKeys, sflag, filterValueFn);
    //console.log('matchkey', matchKeys);
    // try to group the matchkey and key
    var group, groups = {};
    for (var i=0; i < matchKeys.length; i++) {
        var g = matchKeys[i].split(':');
        group = g[0];
        if(group) {
            (group in groups) ? groups[group].push(g[1]) : groups[group] = [g[1]];
            group = null;
        }  
    }
    //console.log('groups', groups);

    // for now, just result not performance
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
           for(var j=0; j < finalResult.length; j++) {
               var mit = finalResult[j];
               if(mit[o] === it) {
                   sitem.values.push(mit);
               }
           }
           item.values.push(sitem);
       }
       tg.push(item);
   }

   // build for metrics group for now
   var resultGroups = {}, gMetrics = [];
   for (var i=0, len = finalResult.length; i < len; i++) {
        var item = finalResult[i];
            group = item['metric'];
            if(group) {
                (group in resultGroups) ? resultGroups[group].push(item) : resultGroups[group] = [item];
                group = null;
            }  
    }
    return {
      results: tg,
      gMetrics: self.arrayFromObject(resultGroups),
      raw: finalResult
    };

};

self.filter = function(array, filterArray, invalidKeys, matchKeys, sflag, fn) {
    var groups = {};
    var results = [];
    var item;
    var group;
    for (var i = 0, len = array.length; i < len; i++) {
        item = array[i];
        if (fn(item, filterArray, invalidKeys, matchKeys, sflag)) { 
            results.push(item);
            /*group = item['metric'];
            if(group) {
                (group in groups) ? groups[group].push(item) : groups[group] = [item];
                    group = null;
                }  
            }
            */
        }
    }
    return results;
};

module.exports = self;
