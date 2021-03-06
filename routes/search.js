var express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/course');
const { body, validationResult, trim } = require('express-validator');
const helper = require('./searchHelper');

var router = express.Router();

const searchHelper = (input, res) => {
	const searchString = helper.generateSearchStringMatch(input);
	const yearAndRating = helper.generateMatch(input);
	const projections = helper.generateCourseProjections();
	Course.aggregate([searchString, yearAndRating, projections])
		.exec()
		.then((docs) => {
			const pagenumber =
				'page' in input && input['page'] !== '0' ? input['page'] - 1 : 0;
			let pageCount = helper.getNumberOfPages(docs);
			let courses = helper.get10NthFromStart(docs, pagenumber);
			const response = {
				pageCount: pageCount,
				data: courses,
			};
			res.status(200).json(response);
		})
		.catch((err) => {
			res.status(500).json(err);
		});
};

const executeSearch = (req, res, next) => {
	try {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const input = helper.processInput(req);
		searchHelper(input, res);
	} catch {
		(err) => res.status(500);
	}
};

router.get(
	'/',
	[
		body('searchString').trim().escape(),
		body('years').trim().escape(),
		body('ratings').trim().escape(),
	],
	executeSearch
);

module.exports = router;
