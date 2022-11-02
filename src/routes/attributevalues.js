const express = require('express');
const router = express.Router();

// controllers
const AttributeValuesAPI = require('../app/controllers/AttributeValuesAPI');

router.get('/', AttributeValuesAPI.findAll);

module.exports = router;
