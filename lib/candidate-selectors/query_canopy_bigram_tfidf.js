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
	.option('-f, --file [tokenlist]')
	.option('-l, --loose [amount]')
	.option('-t, --tight [amount]')
	.parse(process.argv);

var counter = require('./StreamCounter')(program.count);

var words = {};

var tokenList = fs.readFileSync(program.file, 'utf8').split("\n");
tokenList.forEach(function(line) {

	var cols = line.split("\t");
	var count = cols[0];
	var word = cols[1];
	var docIds = cols[2];
	
	words[word] = {
		count: count,
		docIds: docIds
	};
});
console.error("Tokenlist loaded.");

var documents = {};

var ws = stream.Writable();
ws._write = function(chunk, enc, next) {
	
	var line = chunk.toString();

	var cols = line.split("\t");
	var id = parseInt(cols[1], 10);
	var value = cols[0].trim();
	if (documents[id] === undefined) {
		documents[id] = value;
	} else {
		documents[id] += " " + value;
	}
	
	next();
};

process.stdin.setEncoding('utf8');
var input = byline(process.stdin);
input.pipe(counter).pipe(ws);

function norm(value) {
	return value.split(' ').filter(function(f) { return f !== "";});
}

input.on('end', function() {
	var prevTime = process.hrtime();
	var documentsLength = Object.keys(documents).length;

	var all_doc_ids = Object.keys(documents);

	//here starts the clustering.
	while (all_doc_ids.length > 0) {
	
		var randomIndex = Math.floor(Math.random() * all_doc_ids.length);
		var random_doc_id = all_doc_ids[randomIndex];
		
		all_doc_ids.splice(randomIndex, 1);
		var docId = random_doc_id;
		var doc = documents[random_doc_id];

		if (doc === undefined) {
			continue;
		}

		delete(documents[docId]);
		var tokens = norm(doc);
	
		var removals = [];

		var documentIdsToCheck = tokens.map(function(token) {
			if (token.length < 3) {
				return undefined;
			}
			if (words[token] === undefined) {
				//console.error("token missing from index: '" + token + "'");	
				return undefined;
			}
			
			return words[token].docIds.split(" ");
		});
		
		documentIdsToCheck = _.flatten(documentIdsToCheck);
		documentIdsToCheck = _.compact(documentIdsToCheck);

		//console.error("Documents to check: " , documentIdsToCheck.length);
	
		documentIdsToCheck.forEach(function(otherDocId) {

			var otherDoc = documents[otherDocId];
			if (otherDoc === undefined) {
				return;
			}

			var results = tokens.map(function(token) {
				if (words[token] === undefined) {
					return;
				}

				var idf = Math.log(documentsLength / words[token].count);
				var tf = norm(otherDoc).reduce(function(memo, val) { 
					if (val === token) {
						memo++;
					}
					return memo;
				}, 0);

				tf = tf === 0 ? 0 : Math.log(1 + tf);

				return tf * idf;

			});

			var total = results.reduce(function(memo, val) { return memo + val;}, 0);
		
			if (total > program.loose) {

				var first = docId;
				var second = otherDocId;
				if (first > second) {
					var tmp = first;
					first = second;
					second = tmp;
				}
			
				console.log(sprintf("%09s\t%09s\t%s", first, second, total));
			}
			if (total > program.tight) {
				removals.push(otherDocId);
			}
			
		});
		
		

		removals.forEach(function(otherDocId) {
			delete(documents[otherDocId]);
		});
		if (removals.length > 0) {
			console.error("Removed " + removals.length + " extra items");
		}

		var docsLeft = all_doc_ids.length;
		if (docsLeft % 1000 === 0) {
			var diff = process.hrtime(prevTime);
			var timePerBlock = diff[0] + (diff[1] / 1E9);
			var blocksTODO = docsLeft / 1000;
			var estimation = new Date();
			estimation.setSeconds(estimation.getSeconds() + blocksTODO * timePerBlock);
			console.error("Todo: ", docsLeft, estimation);
			prevTime = process.hrtime();
		}
		
	}

});
