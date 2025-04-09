const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('home', { title: 'Home Page' });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Page' });
});

router.get('/holiday', (req, res) => {
    res.render('holiday',{ title: 'About Page' });
});



module.exports = router;