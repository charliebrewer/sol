var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	// Having this page populate the nav bar functionality is bad, should
	// just wire up the template with the desired client side functions
	res.locals = { title: 'Sol', mapOnclick : 'alert("hey");', containerWidth: 600 };
	res.render('clientTest', { partials: { navBar: 'navBar' } });
});

module.exports = router;
