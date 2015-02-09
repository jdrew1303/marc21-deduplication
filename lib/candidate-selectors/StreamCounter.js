"use strict";
var sprintf = require('sprintf').sprintf;
var stream = require('stream');

var BLOCK_SIZE = 1000;

function createCounter(totalLines) {

	var count = 0;
	var totalBlocks = (totalLines / BLOCK_SIZE).toFixed(0);
	var blocksSolved = 0;

	var start = new Date();
	var counter = stream.Transform();
	counter._transform = function(data, encoding, next) {
		count++;
		if (count % BLOCK_SIZE === 0) {
			blocksSolved++;
			var now = new Date();
			var diff = now - start;
		
			var timePerBlock = Math.round(diff / count * 100) / 100;

			var blocksTODO = totalBlocks - blocksSolved;

			var timeRequiredToComplete = blocksTODO * timePerBlock;

			var complete = new Date();
			complete.setSeconds(complete.getSeconds() + timeRequiredToComplete);

			process.stderr.write(sprintf("%s %s %s\n", count, timePerBlock, complete));
		}
		next(null, data);
	};

	return counter;
}
module.exports = createCounter;
