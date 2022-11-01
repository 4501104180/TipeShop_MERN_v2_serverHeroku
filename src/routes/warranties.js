const express = require('express');
const router = express.Router();

// controllers
const warrantiesAPI = require('../app/controllers/WarrantiesAPI');

router.get('/', warrantiesAPI.findAll);

module.exports = router;
