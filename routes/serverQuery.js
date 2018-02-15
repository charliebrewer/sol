var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('serverQuery', { title: 'Server Query' });
});

module.exports = router;
