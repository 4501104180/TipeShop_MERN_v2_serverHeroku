const express = require('express');
const router = express.Router();

// controllers
const productsAPI = require('../app/controllers/ProductsAPI');
// middlewares
const upload = require('../app/middlewares/upload');

router.delete('/:_id', productsAPI.delete);
router.patch('/:_id', productsAPI.restore);
router.put('/:_id', upload(false).array('images', 10), productsAPI.update);
router.post('/filtered', productsAPI.findFilteredProducts);
router.post('/', upload(false).array('images', 10), productsAPI.create);
router.get('/search/:keyword', productsAPI.findByKeyword);
router.get('/similar/:_id/:number', productsAPI.findSimilarProducts);
router.get('/ranking/:type/:page/:number', productsAPI.findRankingProducts);
router.get('/:page/:number', productsAPI.findAllWithPagination);
router.get('/:_id', productsAPI.findById);
router.get('/', productsAPI.findAll);

module.exports = router;
