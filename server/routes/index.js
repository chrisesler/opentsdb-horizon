var utils = require('../lib/utils');
// var yby = require('yby');
// var expressOkta = require('express-okta-oath');
var express = require('express');
var router = express.Router();

router.get("/dummyapi", function (req, res) {
  res.status(401).json({"status":"bad"});
});


router.get("/login", function (req, res) {
  res.status(200).send("<script>window.opener.postMessage('login-success','*');window.close();</script>");
});

router.get("/heartbeat", function (req, res) {
  var valid = false;
  if ( (utils.getProperty('auth_mode') === 'bouncer' && req.ybyCookie!=null && req.ybyCookie.getStatus()== yby.STATUS_OK) || (utils.getProperty('auth_mode') === 'okta' && req.okta && req.okta.status == "VALID") ) {
      valid = true;
  }

  if ( valid ) {
          res.status(200).json({"status":"ok"});
  } else {
          res.status(401).json({"status":"bad"});
  }
});

router.get("/heartbeatimg", function (req, res) {
  var gifBuffer = new Buffer('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');
  res.writeHead(200, {'Content-Type': 'image/gif', 'Content-Length' : gifBuffer.length, 'Cache-Control': 'private, no-cache, no-store, must-revalidate' });
  res.end(gifBuffer);
});

module.exports = router;
