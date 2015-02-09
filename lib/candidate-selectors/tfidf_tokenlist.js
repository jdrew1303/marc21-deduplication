"use strict";

var byline = require('byline');
var stream = require('stream');
var program = require('commander');
var fs = require('fs');
var _ = require('underscore');
var sprintf = require('sprintf').sprintf;

program
	.version('0.0.1')
	.option('-o, --output [file]', 'sqlite db to output resulting groups')
	.option('-v, --verbose')
	.option('-c, --count [amount]', 'How many items will be fed to parser. Makes estimates from this.')
	.option('-f, --file [tfidffile]')
	.parse(process.argv);

var counter = require('./StreamCounter')(program.count);

var MIN_WORD_LENGTH = 3;

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = cols[1];
	var values = cols[0].split(" ").filter(function(f) { return f !== ""; });

	values.forEach(function(value) {
		if (value.length < MIN_WORD_LENGTH) {
			return;
		}

		console.log(sprintf("%s\t%s", value, id));
	});
	
	next();
};

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);
input.pipe(counter).pipe(ws);

input.on('end', function() {

});
