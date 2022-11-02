const mongoose = require('mongoose');

// models
const AttributeValue = require('../models/AttributeValue');

class AttributeValuesAPI {
	// [GET] /warranty
	async findAll(req, res, next) {
		try {
			const attributevalues = await AttributeValue.find();
			res.status(200).json({
				data: attributevalues,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
}

module.exports = new AttributeValuesAPI();
