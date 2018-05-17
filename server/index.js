var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var utils = require('./lib/utils');
var authUtil = require('./middlewares/auth-utils');
var yby = require('yby');
var expressOkta      = require('express-okta-oath');


var app = express();


app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (utils.getProperty('auth_mode') === 'okta') {
  var oktaSecret = require('ysecure.node').getKey(utils.getProperty('okta_secret_key_name'));
  const okta     = new expressOkta.Okta({
      callbackPath: utils.getProperty('okta_callback_path') || '/oauth2/callback',
      clientID: utils.getProperty('okta_client_id') || '0oad31e56t73oaW1L0h7',
      clientSecret: oktaSecret || '',
      cookieDomain: utils.getProperty('okta_cookie_domain') || 'yamas.ouroath.com',
      oktaEnv: utils.getProperty('okta_env') || 'uat',
      timeout: utils.getProperty('okta_timeout'),
      authTimeout: utils.getProperty('okta_auth_timeout'),
      prompt: utils.getProperty('okta_prompt') || 'default'
  });
  app.use(okta.callback());
  app.use(authUtil.validateOktaCredentials(okta));
}
else if (utils.getProperty('auth_mode') === 'athenz') {
    app.use(authUtil.validateAthenzCredentials());
}
// else node_env = yamas.ops | api.yamas.ops
else if (utils.getProperty('auth_mode') === 'bouncer') {
    app.use(authUtil.validateBouncerCredentials());
}

app.use(express.static(path.join(__dirname, 'public')));

app.get("/dummyapi", function (req, res) {
        res.status(401).json({"status":"bad"});
});


app.get("/login", function (req, res) {
        res.status(200).send("<script>window.opener.postMessage('login-success','*');window.close();</script>");
});

app.get("/heartbeat", function (req, res) {
        var valid = false;
        //if ( (utils.getProperty('auth_mode') === 'bouncer' && req.ybyCookie!=null && req.ybyCookie.getStatus()== yby.STATUS_OK) || (utils.getProperty('auth_mode') === 'okta' && req.okta && req.okta.status == "VALID") ) {
        //    valid = true;
        //}

        if ( valid ) {
                res.status(200).json({"status":"ok"});
        } else {
                res.status(401).json({"status":"bad"});
        }
});

app.get("/heartbeatimg", function (req, res) {
        res.status(401).json({"status":"bad"});

        var gifBuffer = new Buffer('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
        res.writeHead(200, {'Content-Type': 'image/gif', 'Content-Length' : gifBuffer.length, 'Cache-Control': 'private, no-cache, no-store, must-revalidate' });
        res.end(gifBuffer);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'dev' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
