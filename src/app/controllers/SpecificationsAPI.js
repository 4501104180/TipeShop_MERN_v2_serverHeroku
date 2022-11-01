const mongoose = require('mongoose');

// models
const Specification = require('../models/Specification');

class SpecificationsAPI {
	// [GET] /warranty
	async findAll(req, res, next) {
		try {
			const specifications = await Specification.find();
			res.status(200).json({
				data: specifications,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
}

module.exports = new SpecificationsAPI();
