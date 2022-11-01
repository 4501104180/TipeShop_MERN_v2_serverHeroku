const mongoose = require('mongoose');

// models
const Warranty = require('../models/Warranty');

class WarrantiesAPI {
	// [GET] /warranty
	async findAll(req, res, next) {
		try {
			const warranties = await Warranty.find();
			res.status(200).json({
				data: warranties,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
}

module.exports = new WarrantiesAPI();
