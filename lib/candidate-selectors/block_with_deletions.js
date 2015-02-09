/* jshint node: true */
"use strict";

var byline = require('byline');
var sprintf = require('sprintf').sprintf;
var program = require('commander');
var mmh3 = require('murmurhash3');
var stream = require('stream');
var q = require('q');

program
	.version('0.0.1')
	.option('-o, --output [file]', 'sqlite db to output resulting groups')
	.option('-v, --verbose')
	.option('-c, --count [amount]', 'How many items will be fed to parser. Makes estimates from this.')
	.parse(process.argv);

var hash = {};

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = cols[1];
	var value = cols[0];

	q.all(generateDeletionNeighbours(value).map(toHash))
	.then(function() {
		next();
	}).done();

	function toHash(value) {

		mmh3.murmur128Hex(value, function(err, res) {
			console.log(sprintf("%s\t%s", res, id));
		});
	}

};

function generateDeletionNeighbours(str) {
	var neighbours = [str];
	for (var i = 0;i < str.length; i++) {
		var tmp = str.split('');
		tmp.splice(i, 1);
		neighbours.push(tmp.join(''));
	}
	return neighbours;
}

var TOTAL_PAIRS_TO_GENERATE = 30 * 1000 * 1000; // 30M

var count = 0;
var totalBlocks = (program.count / 1000).toFixed(0);
var blocksSolved = 0;

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
		
		pairs.forEach(printPair);

		if (pairCounter > TOTAL_PAIRS_TO_GENERATE) {
			break;
		}

	}
	process.stderr.write("Total pairs handled: " + pairCounter + "\n");

});

function printPair(pair) {

	if (pair[0] !== pair[1] && !isPrinted(pair)) {
		var line = sprintf("%09s\t%09s", pair[0], pair[1]);
		console.log(line);
		setPrinted(pair);
	}

}

var printed = {};
function setPrinted(pair) {
	printed[pair.join()] = true;
}

function isPrinted(pair) {
	return printed[pair.join()] !== undefined;
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
			pairs.push([first, second]);

		}

	});
	return pairs;
}
