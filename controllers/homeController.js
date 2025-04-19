// controllers/homeController.js
var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
    res.render('pages/attendence_self');
});



module.exports = router;



