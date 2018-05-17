'use strict';
var utils = require('../lib/utils');
var cookie = require('cookie');
var yby = require('yby');

var authUtil = {
    validateOktaCredentials:function(okta) {
        // Make a log entry, before redirecting, for okta errors
        return function (req, res, next) {
    	    if ( req.path == "/heartbeat" ) {
    		  okta.protect({'action':'passthru'})(req, res, function () { next(); });
    	    } else {
        		okta.protect({'action':'redirect'})(req, res, function () {
        		    // All good, pass only okta credentials
        		    /*
                    let cookies      = cookie.parse(req.headers.cookie);
        		    let oktaCookies  = 'okta_it=' + cookies['okta_it'] + '; okta_at=' + cookies['okta_at'];
        		    let auth         = new Auth();
        		    auth.init({
        			authMode: 'okta',
        			authPrincipal: req.okta,
        			authCookie: oktaCookies
        		    });
        		    req.headers.auth = auth;
                    */
        		    next();
        		});
    	    }
        }
    },

    validateBouncerCredentials:function() {
        return function (req, res, next) {
            /*
            let auth         = new Auth();
            auth.init({
                authMode: 'bouncer',
                authCookie: req.headers.cookie
            });
            req.headers.auth = auth;
            */
            var cookies      = cookie.parse(req.headers.cookie);
            var remoteAddress = req.headers['y-ra'] || req.headers.yahooremoteip || req.connection.remoteAddress;
            var YBY = cookies.yby || cookies.YBY;
            var SYBY = cookies.syby || cookies.SYBY;
            var ybyInst = yby.createInstance();
            try {
                req.ybyCookie = ybyInst.parseAndValidate(YBY, remoteAddress, SYBY);
            } catch(e) {
                req.ybyCookie = null;
            }
            next();
        };
    }
};

module.exports = authUtil;
