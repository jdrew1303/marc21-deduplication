/* jshint node: true */
"use strict";

var byline = require('byline');
var sprintf = require('sprintf').sprintf;
var program = require('commander');
var stream = require('stream');
var q = require('q');

program
	.version('0.0.1')
	.option('-v, --verbose')
	.option('-c, --count [amount]', 'How many items will be fed to parser. Makes estimates from this.')
	.parse(process.argv);

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = cols[1];
	var value = cols[0];
		
	blockToHash(value, id)
		.then(function() {
			next();
		}).done();

};

var BLOCK_MIN_SIZE = 2;
var BLOCK_MAX_SIZE = 20;

var totalBlocks = (program.count / 1000).toFixed(0);
var blocksSolved = 0;
var count = 0;
var start = new Date();
var counter = stream.Transform();
counter._transform = function(data, encoding, next) {
	count++;
	if (count % 1000 === 0) {
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

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);
input.pipe(counter).pipe(ws);

function displayPair(pair, size) {

	var line = sprintf("%09s\t%09s", pair[0], pair[1]);
	console.log(line);
	
}

function toPairs(ids) {
	var pairs = [];

	var l = ids.length;
	ids.forEach(function(id, idx) {

		for (var i = idx + 1;i < l;i++) {
			var first = id;
			var second = ids[i];
			if (first > second) {
				var tmp = first;
				first = second;
				second = tmp;
			}
			if (first !== second) {
				pairs.push([first, second]);
			}

		}

	});
	return pairs;
}

var currentValue = "";
var currentIds = [];

function blockToHash(value, id) {

	if (value === undefined) {
		return;
	}
	
	if (value != currentValue) {
	
		if (currentIds.length >= BLOCK_MIN_SIZE && currentIds.length <= BLOCK_MAX_SIZE) {

			var pairs = toPairs(currentIds);
			pairs.forEach(function(pair) {
				displayPair(pair, currentIds.length);
			});
		
		}
		
		currentIds = [];
		currentValue = value;
	}

	id = parseInt(id, 10);

	currentIds.push(id);
	currentValue = value;

	var deferred = q.defer();
	deferred.resolve();
	return deferred.promise;
}
