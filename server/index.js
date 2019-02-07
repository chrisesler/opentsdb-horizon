var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var utils = require('./lib/utils');
var authUtil = require('./middlewares/auth-utils');
var yby = require('yby');
var expressOkta = require('express-okta-oath');

var search = require('./routes/search');
var tsdb = require('./routes/tsdb');
var index = require('./routes/index');

var app = express();


app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (utils.getProperty('auth_mode') === 'bouncer' || utils.getEnv() === 'dev') {
    app.use(authUtil.validateBouncerCredentials());
} else if (utils.getProperty('auth_mode') === 'okta') {
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

app.use(function (req, res, next) {
    // WhitelistFrameAncestors
    res.setHeader('Content-Security-Policy', 'frame-ancestors ' + utils.getWhitelistFrameAncestors().join(' ') );
    next();
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'dev' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

app.use(express.static(path.join(__dirname, 'public')));

// for now, we need to get the better regex and re-organize the api url
app.get(/^\/(d|main|alerts)(.*)/, function (req, res) {
    console.log('CALL ME >>>>> index.html');
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

// routing
app.use('/', index);
app.use('/tsdb', tsdb);
app.use('/search', search);


module.exports = app;
