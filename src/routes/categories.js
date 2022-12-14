const express = require('express');
const router = express.Router();

// controllers
const categoriesAPI = require('../app/controllers/CategoriesAPI');
// middlewares
const upload = require('../app/middlewares/upload');

router.delete('/:_id', categoriesAPI.delete);
router.patch('/:_id', categoriesAPI.restore);
router.put(
	'/:_id',
	upload(false).fields([
		{ name: 'image', maxCount: 1 },
		{ name: 'banners', maxCount: 5 },
	]),
	categoriesAPI.update
);
router.post('/exist', categoriesAPI.checkExist);
router.post(
	'/',
	upload(false).fields([
		{ name: 'image', maxCount: 1 },
		{ name: 'banners', maxCount: 5 },
	]),
	categoriesAPI.create
);

router.get('/findallcategories', categoriesAPI.findAllCategories);
router.get('/:_id', categoriesAPI.findById);
router.get('/', categoriesAPI.findAllRoot);


module.exports = router;
