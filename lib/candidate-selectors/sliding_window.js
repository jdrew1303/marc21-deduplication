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
	var value = normalizeValue( cols[0] );
		
	newItem(value, id);
	next();
		

};

var count = 0;
var start = new Date();
var counter = stream.Transform();
counter._transform = function (data, encoding, next) {
	count++;
	if (count % 1000 === 0) {
		var now = new Date();
		var diff = now - start;
	
		var timePerItem = Math.round(diff/count*100)/100;

		process.stderr.write(sprintf("%s %s\n", count, timePerItem));
	}
	next(null, data);
};

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);
input.pipe(counter).pipe(ws);

input.on('end', function() {

	process.stderr.write("Done.\n");

});

function normalizeValue(value) {
	var words = value.split(' ');
	words = words.sort();
	return words.join(' ');
}

var WINDOW_SIZE = 5;
var recordWindow = [];

function newItem(value, id) {

	if (value === undefined) {
		return;
	}

	if (recordWindow.indexOf(id) !== -1) {
		return;
	}

	// generate pairs with id and the items left in the window
	generateComparisonsWith(id, recordWindow);

	recordWindow.push(id);
	while (recordWindow.length > WINDOW_SIZE - 1) {
		recordWindow.shift();
	}

}

function generateComparisonsWith(id, recordWindow) {

	var pairs = recordWindow.map(function(windowId) {
		return [windowId, id];
	}).map(sortPair);

	pairs.forEach(function(pair) {
		var line = sprintf("%09s\t%09s", pair[0], pair[1]);
		console.log(line);
	});
}

function sortPair(pair) {

	var first = pair[0];
	var second = pair[1];
	if (first > second) {
		var tmp = first;
		first = second;
		second = tmp;
	}
	return [first, second];
}
