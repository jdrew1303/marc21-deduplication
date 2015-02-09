/* jshint node: true */
"use strict";

var byline = require('byline');
var sprintf = require('sprintf').sprintf;
var program = require('commander');
var stream = require('stream');
var q = require('q');

program
	.version('0.0.1')
	.option('-o, --output [file]', 'sqlite db to output resulting groups')
	.option('-v, --verbose')
	.parse(process.argv);

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = cols[1];
	var value = normalizeValue(cols[0]);
		
	blockToHash(value, id)
		.then(function() {
			next();
		}).done();

};

var TOTAL_PAIRS_TO_GENERATE = 30 * 1000 * 1000; // 30M

var count = 0;
var start = new Date();
var counter = stream.Transform();
counter._transform = function(data, encoding, next) {
	count++;
	if (count % 1000 === 0) {
		var now = new Date();
		var diff = now - start;
	
		var timePerItem = diff.toFixed(2);

		process.stderr.write(sprintf("%s %s\n", count, timePerItem));
	}
	next(null, data);
};

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);
input.pipe(counter).pipe(ws);

input.on('end', function() {

	//this step can be removed completely by using 2 hashes
	Object.keys(hash).forEach(function(key) {

		if (hash[key].length == 1) {
			delete(hash[key]);
		}

	});
	var arr = Object.keys(hash).map(function(key) {
		return {
			value: key,
			ids: hash[key],
			length: hash[key].length
		};
	});
	arr.sort(function(a, b) {
		return a.length - b.length;
	});

	
	var pairCounter = 0;
	var l = arr.length;
	for (var i = 0;i < l;i++) {
		var group = arr[i];
	
		var pairs = toPairs(group.ids);
		pairCounter += pairs.length;
		
		pairs.forEach(function(pair) {
			var line = sprintf("%09s\t%09s", pair[0], pair[1]);
			console.log(line);
		});

		if (pairCounter > TOTAL_PAIRS_TO_GENERATE) {
			break;
		}

	}
	process.stderr.write("Total pairs handled: " + pairCounter + "\n");

});

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
			pairs.push([first, second]);

		}

	});
	return pairs;
}

function normalizeValue(value) {
	var words = value.split(' ');
	words = words.sort();
	return words.join(' ');
}

var hash = {};

var currentValue = "";
var currentIds = [];

function blockToHash(value, id) {

	if (value === undefined) {
		return;
	}

	if (value != currentValue) {
		if (value < currentValue) {
			//var msg = sprintf("Data must be sorted!\n'%s' < '%s'", value, currentValue);
			//throw new Error(msg);
		}	

		if (currentIds.length > 1) {
			hash[currentValue] = currentIds;
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