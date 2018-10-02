'use strict';

/**
 * node/angularjs module to hold the constant of the application
 */
(function (isNodeEnvironment, isAngularEnvironment) {

    var moduleDefinition = function () {

        var moduleAPI = {

            META_SEARCH_TIMEOUT_MS: 15000,
            
            NAMESPACE_ES_QUERY_TIMEOUT_MS: 7000,
            
            NAMESPACE_ES_CACHE_TTL_MS: 1000 * 60 * 60 * 24,

            METRIC_ES_QUERY_TIMEOUT_MS: 7000,

            TAGKEYS_ES_QUERY_TIMEOUT_MS: 7000,

            TAGVALUES_ES_QUERY_TIMEOUT_MS: 7000,
            
        };
        return moduleAPI;
    };

    //conditional node/angular
    if (isAngularEnvironment) {
        angular.module('frontendApp').constant('AppConstant', moduleDefinition());
    } else if (isNodeEnvironment) {
        module.exports = moduleDefinition();
    }

})(typeof module !== 'undefined' && typeof module.exports !== 'undefined', typeof angular !== 'undefined');
