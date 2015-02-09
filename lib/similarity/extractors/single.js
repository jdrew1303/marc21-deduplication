/* jshint node:true */
"use strict";

var docopt = require('docopt').docopt;
var Q = require('q');
var xml2js = require('xml2js');
var fs = require('fs');
var Similarity = require('./similarity');
var _ = require('underscore');
var sprintf = require('sprintf').sprintf;
var print = require('./core.print');


var doc = [
"Usage:",
"  similarity [-v] <check> <record1> <record2>",
"  similarity [-v] strategy <strategy> <record1> <record2>",
"  similarity -h | --help | --version",
""
].join("\n");

var options = docopt(doc, {version: 0.1});

var displayOptions = {
	displayUnder: 1,
	displayOver: -2, 
	displaySkipped: true,
	verbose: options['-v'] || false,
	humanReadableSummary: true
};

var strategy;
if (options["<strategy>"]) {
	strategy = require(sprintf('./strategies/%s', options["<strategy>"]));
} else {
	strategy = [{
		name: options['<check>'],
		weight: 1
	}];
}

compareFiles(options["<record1>"], options["<record2>"]);

function compareFiles(file1, file2) {

	Q.all([
		Q.nfcall(xml2js.parseString, fs.readFileSync(file1, 'utf8') ),
		Q.nfcall(xml2js.parseString, fs.readFileSync(file2, 'utf8') ),
	]).then(function(res) {
		var record1 = res[0].collection.record[0];
		var record2 = res[1].collection.record[0];

		record1.filename = file1;
		record2.filename = file2;

		var similarity = new Similarity(strategy, {
			displayUnder: 1,
			displayOver: -2, 
			displaySkipped: true
		} );
		

	
		var comparison = similarity.compareRecords(record1, record2);
	
		print.displayRecords(comparison, displayOptions);
		print.displaySummary(comparison, displayOptions);

		if (comparison.similarity === null) {
			console.log(sprintf("Total similarity: SKIPPED"));	
		} else {
			console.log(sprintf("Total similarity: %f", comparison.similarity));
		}

	}).done();

}
