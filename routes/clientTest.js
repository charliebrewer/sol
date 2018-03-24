var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	res.locals = { title: 'Sol' };
	res.render('clientTest', { partials: { navBar: 'navBar' } });
});

module.exports = router;
