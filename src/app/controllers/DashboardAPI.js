// models
const Product = require('../models/Product');
const Order = require('../models/Order');
const { Account } = require('../models/Account');

class DashboardAPI {
	// [GET] ../*
	async dashboardALL(req, res, next) {
		try {
			const totalProduct = await Product.count({ inventory_status: 'availabel' });
			const totalOrder = await Order.count();
			const totalUser = await Account.count();
			const sales = await Order.aggregate([
				{
					$match: {
						'tracking_infor.status': 'delivered',
					},
				},
				{
					$project: {
						_id: 0,
						'price_summary.name': 1,
						'price_summary.value': 1,
					},
				},
				{
					$unwind: '$price_summary',
				},
				{
					$replaceRoot: {
						newRoot: '$price_summary',
					},
				},
			]);
			var totalSale = sales.reduce(function (_this, val) {
				return _this + val.value;
			}, 0);
			let type = 'sold';
			let number = parseInt('5');
			const GRAVITY = 1.8;
			const products = await Product.aggregate([
				{
					$match: { inventory_status: 'availabel' },
				},
				{
					$addFields: {
						time_elapsed: {
							$divide: [{ $subtract: ['$$NOW', '$updatedAt'] }, 3600000],
						},
					},
				},
				{
					$project: {
						name: 1,
						images: 1,
						slug: 1,
						quantity: 1,
						quantity_sold: 1,
						score: {
							$divide: [
								type === 'sold' ? '$quantity_sold.value' : type === 'favorite' ? '$favorite_count' : '$view_count',
								{
									$pow: [{ $add: ['$time_elapsed', 2] }, GRAVITY],
								},
							],
						},
					},
				},
				{
					$sort: {
						score: -1,
					},
				},
				{
					$limit: number,
				},
			]);
			const history = await Order.aggregate([
				{
					$project: {
						_id: 0,
						'tracking_infor.status': 1,
						'tracking_infor.status_text': 1,
						'tracking_infor.time': 1,
					},
				},
				{
					$unwind: '$tracking_infor',
				},
				{
					$replaceRoot: {
						newRoot: '$tracking_infor',
					},
				},
			]);
			const filter = {
				$and: [{ 'tracking_infor.status': 'processing' }],
			};
			const graph = await Order.find(filter).select(['tracking_infor', 'price_summary', 'updatedAt']);
			res.status(200).json({
				statistic: {
					totalSale,
					totalOrder,
					totalUser,
					totalProduct,
				},
				graph,
				products,
				history,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /countproduct
	async countProduct(req, res, next) {
		try {
			const totalProduct = await Product.count({});
			const totalProductAvailabel = await Product.count({ inventory_status: 'availabel' });
			res.status(200).json({
				totalProduct,
				totalProductAvailabel,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /countorder
	async countOrder(req, res, next) {
		try {
			const totalOrder = await Order.count({});
			res.status(200).json({
				totalOrder,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /countuser
	async countUser(req, res, next) {
		try {
			const totalUser = await Account.count({});
			res.status(200).json({
				totalUser,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /trend[sold]
	async trend(req, res, next) {
		try {
			let type = 'sold';
			let number = parseInt('5');
			const GRAVITY = 1.8;
			const products = await Product.aggregate([
				{
					$match: { inventory_status: 'availabel' },
				},
				{
					$addFields: {
						time_elapsed: {
							$divide: [{ $subtract: ['$$NOW', '$updatedAt'] }, 3600000],
						},
					},
				},
				{
					$project: {
						name: 1,
						images: 1,
						slug: 1,
						quantity: 1,
						quantity_sold: 1,
						score: {
							$divide: [
								type === 'sold' ? '$quantity_sold.value' : type === 'favorite' ? '$favorite_count' : '$view_count',
								{
									$pow: [{ $add: ['$time_elapsed', 2] }, GRAVITY],
								},
							],
						},
					},
				},
				{
					$sort: {
						score: -1,
					},
				},
				{
					$limit: number,
				},
			]);
			res.status(200).json({
				products,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /sale
	async sumSales(req, res, next) {
		try {
			const totalSales = await Order.aggregate([
				{
					$match: {
						'tracking_infor.status': 'delivered',
					},
				},
				{
					$project: {
						_id: 0,
						'price_summary.value': 1,
					},
				},
				{
					$unwind: '$price_summary',
				},
				{
					$replaceRoot: {
						newRoot: '$price_summary',
					},
				},
			]);
			var sum = totalSales.reduce(function (_this, val) {
				return _this + val.value;
			}, 0);
			res.status(200).json({
				totalSales,
				sum,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /history
	async historyOrder(req, res, next) {
		try {
			const history = await Order.find().select([
				'_id',
				'customer_id',
				'tracking_infor',
				'createdAt',
				'updatedAt',
			]);

			res.status(200).json({
				history,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [GET] /graph
	async revenueGraph(req, res, next) {
		try {
			const filter = {
				$and: [{ 'tracking_infor.status': 'processing' }],
			};
			const graph = await Order.find(filter).select(['tracking_infor', 'price_summary', 'updatedAt']);
			res.status(200).json({
				graph,
				msg: 'success',
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
}

module.exports = new DashboardAPI();
