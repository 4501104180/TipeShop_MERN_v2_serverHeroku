// models
const Category = require('../models/Category');
// utils
const cloudinaryUpload = require('../../utils/cloudinaryUpload');

class CategoriesAPI {
	// [GET] /categories
	async findAllRoot(req, res, next) {
		try {
			const categories = await Category.find({
				status: 'active',
				parent_id: null,
			}).select('_id name image slug');
			res.status(200).json(categories);
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	async findAllCategories(req, res, next) {
		try {
			const categories = await Category.aggregate([
				{
					$match: { parent_id: null },
				},
				{
					$graphLookup: {
						from: 'categories',
						startWith: '$_id',
						connectFromField: '_id',
						connectToField: 'parent_id',
						maxDepth: 10,
						depthField: 'level',
						as: 'children',
					},
				},
				// must unwind & sort to get all the children descending by level for algorithmic purpose
				{
					$unwind: {
						path: '$children',
						preserveNullAndEmptyArrays: true,
					},
				},
				{ $sort: { 'children.level': -1 } },
				// get the categories of children
				{
					$group: {
						_id: '$_id',
						name: { $first: '$name' },
						image: { $first: '$image' },
						banners: { $first: '$banners' },
						parent_id: { $first: '$parent_id' },
						status: { $first: '$status' },
						slug: { $first: '$slug' },
						children: {
							$push: {
								$cond: {
									if: { $gt: ['$children._id', 0] },
									then: {
										_id: '$children._id',
										name: '$children.name',
										image: '$children.image',
										banners: '$children.banners',
										parent_id: '$children.parent_id',
										status: '$children.status',
										slug: '$children.slug',
										level: '$children.level',
									},
									else: '$$REMOVE',
								},
							},
						},
					},
				},
				{
					$sort: { _id: 1 },
				},
				{
					$addFields: {
						children: {
							$reduce: {
								input: '$children',
								initialValue: { level: -1, prevChild: [], presentChild: [], deleted: false },
								in: {
									$let: {
										vars: {
											prev: {
												$cond: {
													if: { $eq: ['$$value.level', '$$this.level'] },
													then: '$$value.prevChild', // keep the same as before if same level
													else: '$$value.presentChild', // present child will become previouse child for nested purpose
												},
											},
											current: {
												$cond: {
													if: { $eq: ['$$value.level', '$$this.level'] },
													then: '$$value.presentChild', // keep the same as before if same level
													else: [], // recreate nested child
												},
											},
										},
										in: {
											level: '$$this.level', // update level for condition purpose
											prevChild: '$$prev',
											presentChild: {
												// present = current + { ...this, children: [childs that have parent_id equal to this._id] }
												$concatArrays: [
													'$$current',
													[
														{
															$mergeObjects: [
																'$$this',
																{
																	children: {
																		$filter: {
																			input: '$$prev',
																			as: 'p',
																			cond: { $eq: ['$$p.parent_id', '$$this._id'] },
																		},
																	},
																},
															],
														},
													],
												],
											},
										},
									},
								},
							},
						},
					},
				},
				{
					$addFields: {
						children: '$children.presentChild',
					},
				},
			]);

			res.status(200).json({
				data: categories,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}

	// [GET] /categories/:_id
	/*
		_id: Number
	*/
	async findById(req, res, next) {
		try {
			let { _id } = req.params;
			_id = parseInt(_id);

			const result = await Category.aggregate([
				{
					$match: {
						_id,
						status: 'active',
					},
				},
				{
					// get all parent of category
					$graphLookup: {
						from: 'categories',
						startWith: '$parent_id',
						connectFromField: 'parent_id',
						connectToField: '_id',
						as: 'parent',
					},
				},
				{
					// get all children of category
					$lookup: {
						from: 'categories',
						localField: '_id',
						foreignField: 'parent_id',
						as: 'children',
					},
				},
				{
					$project: {
						name: 1,
						image: 1,
						banners: 1,
						slug: 1,
						parent: {
							_id: 1,
							name: 1,
							slug: 1,
						},
						children: {
							_id: 1,
							name: 1,
							slug: 1,
						},
					},
				},
			]);
			const category = result[0];
			res.status(200).json(category);
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}

	// [POST] /categories/exist
	/*
		names: String[]
	*/
	async checkExist(req, res, next) {
		try {
			const { names } = req.body;

			const categoriesExist = await Category.find({ name: { $in: names } });
			res.status(200).json({
				exist: categoriesExist.length > 0 ? true : false,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}

	// [POST] /categories
	/*
		name: String,
		image: String,
		[parent_id]: Number,
		[banners]: [String],
		...
	*/
	async create(req, res, next) {
		try {
			const { name, ...body } = req.body;
			const { image, banners } = req.files;

			// handle image
			if (!req.files['image']) {
				next({ status: 400, msg: 'Image field is required!' });
				return;
			}

			const { public_id } = await cloudinaryUpload(image[0].path, 'category');

			// // handle banners
			const bannerObjs = [];
			banners &&
				(await Promise.all(
					banners.map(async (file) => {
						const { public_id } = await cloudinaryUpload(file.path, 'category/banners');
						bannerObjs.push(public_id);
					})
				));
			const categoryExisted = await Category.findOne({ name });
			if (categoryExisted) {
				next({ status: 400, msg: 'Category existed!' });
				return;
			}
			const category = new Category({
				...body,
				name,
				image: public_id,
				banners: bannerObjs,
			});
			await category.save();
			res.status(201).json({
				msg: 'Insert category successfully!',
				category,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [PUT] /categories/:_id
	/*
		name: String,
		image: String,
		[parent_id]: Number,
		[banners]: [String],
		...
	*/
	async update(req, res, next) {
		try {
			let { _id } = req.params;
			const { image, banners } = req.files;
			const { name, slug, ...body } = req.body;
			const convertSlug = name
				// Chuyển hết sang chữ thường
				.toLowerCase()
				// chuyển chuỗi sang unicode tổ hợp
				.normalize('NFD')
				// xóa các ký tự dấu sau khi tách tổ hợp
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[đĐ]/g, 'd')
				// Xóa ký tự đặc biệt
				.replace(/([^0-9a-z-\s])/g, '')
				// Xóa khoảng trắng thay bằng ký tự -
				.replace(/(\s+)/g, '-')
				// Xóa ký tự - liên tiếp
				.replace(/-+/g, '-')
				// xóa phần dư - ở đầu & cuối
				.replace(/^-+|-+$/g, '');
			let stringUrl = '';
			if (image) {
				const { public_id } = await cloudinaryUpload(image[0].path, 'category');
				stringUrl = public_id;
			}

			// handle banners
			const bannerObjs = [];
			banners &&
				(await Promise.all(
					banners.map(async (file) => {
						const { public_id } = await cloudinaryUpload(file.path, 'category/banners');
						bannerObjs.push(public_id);
					})
				));

			const categoryExisted = await Category.findOne({ _id: { $ne: _id }, name });
			if (categoryExisted) {
				next({ status: 400, msg: 'Category existed!' });
				return;
			}
			const category = await Category.findByIdAndUpdate(
				_id,
				{ name, image: stringUrl, banners: bannerObjs, slug: convertSlug, ...body },
				{ new: true }
			);
			res.status(201).json({
				msg: 'Edit category successfully!',
				category,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
	// [DELETE] /categories/:_id
	async delete(req, res, next) {
		try {
			let { _id } = req.params;
			const category = await Category.findByIdAndRemove({ _id });
			res.status(201).json({
				msg: 'Delete category successfully!',
				category,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}

	// [PATCH] /categories/restore/:_id
	async restore(req, res, next) {
		try {
			let { _id } = req.params;

			const categoryDeleted = await Category.findOneDeleted({ _id });

			await Category.restore({ _id });

			res.status(200).json({
				msg: 'Restore category successfully!',
				category: categoryDeleted,
			});
		} catch (error) {
			console.error(error);
			next({ status: 500, msg: error.message });
		}
	}
}

module.exports = new CategoriesAPI();
