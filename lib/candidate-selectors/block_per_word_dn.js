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
	var value = normalizeValue( cols[1] );

	value.split(' ').forEach(function(value) {

		var values = generateDeletionNeighbours(value);
		values.forEach(function(value) {
			block(value, id);
		});
	});
});


input.on('end', function() {

	console.log(hash);

});

function generateDeletionNeighbours(str) {
	var neighbours = [str];
	for (var i=0;i<str.length;i++) {
		var tmp = str.split('');
		tmp.splice(i,1);
		neighbours.push(tmp.join(''));
	}
	return neighbours;
}

function normalizeValue(value) {
	var words = value.split(' ');
	words = words.sort();
	return words.join(' ');
}

var hash = {};
function block(value, id) {
	if (value === undefined) return;
	/*if (hash[value] === undefined) {
		hash[value] = [];
	}
	hash[value].push(id);*/
	value = value.replace(/\//g, "_");
	id = parseInt(id, 10);
	fs.appendFileSync("out_per_word_dn/i_" + value, id +"\n");
}