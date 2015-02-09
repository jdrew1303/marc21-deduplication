/*jshint node:true */
"use strict";
var brain = require('brain');
var fs = require('fs');
var sprintf = require('sprintf').sprintf;
var byline = require('byline');
var _ = require('underscore');
var net = new brain.NeuralNetwork();

var program = require('commander');

program
  .version('0.0.1')
  .option('-n, --network <file>', 'JSON file to load trained network from')
  .option('-f, --file <file>', 'Vector file to check for similarity')
  .option('-s, --strategy <file>', 'file to load strategy (definitions) from. Note: network must be trained with same strategy!')
  .parse(process.argv);

if (program.network === undefined) {
	program.network = __dirname + "/networks/default.network.json";
}
if (program.file === undefined) {
	program.help();
}
if (program.strategy === undefined) {
	program.strategy = require(__dirname + "/../../strategies/default.strategy");
}

var attributes = _(program.strategy).pluck('name');

var networkJSON = fs.readFileSync(program.network, 'utf8');
net.fromJSON(JSON.parse(networkJSON));

var input = byline.createStream(fs.createReadStream(program.file));

input.on('data', function(data) {
	var line = data.toString();
	var cols = line.split("\t");
	var key = cols[0];
	var namedVector = vectorToObject( cols.slice(1).map(normalizeVectorValue) );

	var similarity = net.run(namedVector);

	process.stdout.write(sprintf("%s\t%s\n", Number(similarity).toFixed(10), key));

});

function normalizeVectorValue(value) {
	if (isNaN(value)) {
		return null;
	} else {
		return parseFloat(value);
	}
}

var attributes = ["title", "author", "has880", "ISBN", "ISSN", "ISMN", "ISRN", "F010", "author245c", "sarjat", "reprint", "years", "charsimilarity", "F015", "size", "publisher"];
function vectorToObject(vector) {
	var obj = {};
	vector.forEach(function(value, i) {
		obj[attributes[i]] = value;
	});

	return obj;
}
