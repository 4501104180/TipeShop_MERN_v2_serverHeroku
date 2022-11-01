const express = require('express');
const router = express.Router();

// controllers
const specificationsAPI = require('../app/controllers/SpecificationsAPI');

router.get('/', specificationsAPI.findAll);

module.exports = router;
