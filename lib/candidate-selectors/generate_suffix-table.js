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
	.option('-c, --count [amount]', 'How many items will be fed to parser. Makes estimates from this.')
	.parse(process.argv);

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = cols[1];
	var value = cols[0];

	q.all(generateSuffixes(value).map(toHash))
	.then(function() {
		next();
	}).done();

	function toHash(value) {
		console.log(sprintf("%s\t%s", value, id));

	}

};

function generateSuffixes(str) {
	var tokens = str.split(' ').filter(function(f) { return f !== "";});
	tokens.sort();

	var suffixes = [tokens.join(' ')];
	while (tokens.length > 1) {
		tokens = tokens.slice(1);
		suffixes.push(tokens.join(' '));
	}
	return suffixes;
}

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
