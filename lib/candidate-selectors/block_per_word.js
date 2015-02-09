/* jshint node: true */
"use strict";

var byline = require('byline');
var sprintf = require('sprintf').sprintf;
var _ = require('underscore');
var fs = require('fs');

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);


input.on('data', function(line) {
	var cols = line.split("\t");
	var id = cols[0];
	var value = cols[1];

	value.split(' ').forEach(function(value) {
		block(value, id);
	});
	
});

input.on('end', function() {

	console.log(hash);

});

var hash = {};
function block(value, id) {
	if (value === undefined) return;
	/*if (hash[value] === undefined) {
		hash[value] = [];
	}
	hash[value].push(id);*/
	id = parseInt(id, 10);
	value = value.replace(/\//g, "_");
	fs.appendFileSync("out_per_word/i_" + value, id +"\n");
}