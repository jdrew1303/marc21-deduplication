/*node jshint: true */
"use strict";

var fs = require('fs');
var sprintf = require('sprintf').sprintf;
var adjust = require('../core.adjust');
var rnorm = require('randgen').rnorm;
var Task = require('genetic').Task;

var strategy = require("../strategies/all");

var options = { 
		getRandomSolution : getRandomSolution,
		popSize : 150,
		stopCriteria : stopCriteria,
		fitness : fitness,
		minimize : false,
		mutateProbability : 0.05,
		mutate : mutate,
		crossoverProbability : 0.15,
		crossover : crossover
};

var run_generations = 2000;

var weightMin = 2;
var weightMax = 5;
var elementCount = strategy.length;
var adjustFuncs = ['qi', 'li', 'co', 'ld', 'qd'];


var non_duplicates = fs.readFileSync('non_duplicate.vec', 'utf8');
var duplicates = fs.readFileSync('duplicate.vec', 'utf8');

non_duplicates = non_duplicates.split("\n");
duplicates = duplicates.split("\n");

non_duplicates = non_duplicates.filter(hasNumElements(elementCount+1));
duplicates = duplicates.filter(hasNumElements(elementCount+1));

non_duplicates = non_duplicates.map(parseLine);
duplicates = duplicates.map(parseLine);



function parseLine(line) {
	var testItem = line.split("\t").slice(1);
	return parseItem(testItem);
}

function hasNumElements(num) {
	return function(line) {
		return line.split("\t").length === num;
	};
}

console.log('=== TEST BEGINS === ');
var testStartedDate = new Date();
var t = new Task(options);
// t.on('run start', function () { console.log('run start'); util.log('run') })
// t.on('run finished', function (results) { console.log('run finished - ', results); util.log('run')})
// t.on('init start', function () { console.log('init start') })
// t.on('init end', function (pop) { console.log('init end', pop) })
// t.on('loop start', function () { console.log('loop start') })
// t.on('loop end', function () { console.log('loop end') })
t.on('iteration start', function (generation) { 
	var now = new Date();
	var diff = now - testStartedDate;
	
	if (generation == 1) {
		var averageGenerationTime = diff;
	} else {
		var averageGenerationTime = diff / (generation-1);
	}

	var generationsTodo = run_generations - (generation-1);
	var timeTodo = generationsTodo * averageGenerationTime;
	var complete = new Date();
	complete.setMilliseconds(timeTodo);

	console.log('iteration start - ',generation, complete.toString()); 
});
/* t.on('iteration end', function () { 
 	console.log('iteration end', this.generation );
 }); */
// t.on('calcFitness start', function () { console.log('calcFitness start') })
// t.on('calcFitness end', function (pop) { console.log('calcFitness end', pop) })
// t.on('parent selection start', function () { console.log('parent selection start') })
// t.on('parent selection end', function (parents) { console.log('parent selection end ',parents) })
// t.on('reproduction start', function () { console.log('reproduction start') })
// 
// t.on('find sum', function () { console.log('find sum') })
// t.on('find sum end', function (sum) { console.log('find sum end', sum) })

 t.on('statistics', function (statistics) { 
 	console.log('statistics',statistics); 
 	printSolution( statistics.max );
 });
// 
// t.on('normalize start', function () { console.log('normalize start') })
// t.on('normalize end', function (normalized) { console.log('normalize end',normalized) })
// t.on('child forming start', function () { console.log('child forming start') })
// t.on('child forming end', function (children) { console.log('child forming end',children) })
// t.on('child selection start', function () { console.log('child selection start') })
// t.on('child selection end', function (population) { console.log('child selection end',population) })
// 
// t.on('mutate', function () { console.log('MUTATION!') })
// 
// 
// t.on('reproduction end', function (children) { console.log('reproduction end',children) })
// 
t.on('error', function (error) { console.log('ERROR - ', error); });
t.run(function (stats) { console.log('results', stats); });


function crossover(parent1, parent2, callback) {
  	var child = {
  		weights: [],
  		adjusts: [],
  	};

	for (var i=0;i<elementCount;i++) {
		if (Math.random() < 0.5) {
			child.weights[i] = parent1.weights[i];
			child.adjusts[i] = parent1.adjusts[i];
		
		} else {
			child.weights[i] = parent2.weights[i];
			child.adjusts[i] = parent2.adjusts[i];
		
		}		
	}

 	callback(child);
}

function mutate(solution, callback) {

	for (var i=0;i<elementCount;i++) {
		if (Math.random() < 1/elementCount/2) {
			solution.weights[i] = generateRandomWeight();
		}
		if (Math.random() < 1/elementCount/2) {
			solution.adjusts[i] = generateRandomAdjust();
		}
		
	}

	callback(solution);
}


function getRandomSolution(callback) {

	callback({
		weights: randomWeights(),
		adjusts: randomAdjusts()
	});

	function randomWeights() {
		var arr = [];
		for (var i=0;i < elementCount;i++) {
			arr.push( generateRandomWeight() );
		}
		return arr;
	}
	
	function randomAdjusts() {
		var arr = [];
		for (var i=0;i<elementCount;i++) {
			arr.push( generateRandomAdjust() );
		}
		return arr;
	}
	function randomAssociations() {
		var arr = [];
		for (var i=0;i<elementCount;i++) {
			arr.push( generateRandomAssociation(i) );
		}
		return arr;
	}
}

function generateRandomWeight() {
	var weight = Math.floor( weightMin + Math.random() * (weightMax-weightMin+1) );
	/*
	var rand;
	do {
		rand = rnorm(6,5.25);
	} while (rand <= 1);

	var weight = Math.floor(rand);
	*/
	return weight;
}
function generateRandomAdjust() {
	var idx = Math.floor(Math.random() * adjustFuncs.length);
	return adjustFuncs[idx];
}

function generateRandomAssociation(i) {
	if (Math.random() < 0.7) {
		return null;
	}
	var idx = Math.floor(Math.random() * elementCount);
	if (idx == i) {
		return null;
	}

	return idx;
}

function stopCriteria() {
  return (this.generation == run_generations);
}

function fitness(solution, callback) {
	var i,idx,fitnessValue;
	var cumulativeFitnessValue = 0;

	var runs = 200;

	for (i=0;i<runs;i++) {
		idx = Math.floor( Math.random() * duplicates.length );
		var testItem = duplicates[idx];

		fitnessValue = testSolutionAgainstItem(solution, testItem, true);

		cumulativeFitnessValue += fitnessValue;

	}

	for (i=0; i<runs; i++) {
		idx = Math.floor( Math.random() * non_duplicates.length );
		var testItem = non_duplicates[idx];
		
		fitnessValue = testSolutionAgainstItem(solution, testItem, false);

		cumulativeFitnessValue += fitnessValue;

	}

	callback(cumulativeFitnessValue / (runs*2) * 100);
}

function testSolutionAgainstItem(solution, testItem, isDuplicate) {

	var cumValue = 0;
	var maxValue = 0;
	for (var i=0;i<elementCount;i++) {

		if (testItem[i] !== null) {
			
			var itemValue = testItem[i];

			/*
			var associatedIdx = solution.associations[i];
			if (associatedIdx !== null) {
				var associatedValue = testItem[associatedIdx];
				if (associatedValue !== null) {
					itemValue = (itemValue + associatedValue) / 2;
				}
			}
			*/

			var adjustFunc = adjust[solution.adjusts[i]];
			
			var weightAdjustment = adjustFunc(testItem[i]);
			var value = itemValue * solution.weights[i] * weightAdjustment;
			
			var doc = sprintf("%f * %s(%f)*%f", itemValue, solution.adjusts[i], itemValue, solution.weights[i]);
			//console.log( doc, value );

			cumValue += value;
			maxValue += solution.weights[i];
		}

	}

	var fitness;
	if (isDuplicate) {
		//if duplicate, we want as close to the 1 as possible
		fitness = cumValue / maxValue;
	} else {
		//if not double, we want as close to the 0 as possible
		fitness = 1-(cumValue / maxValue);
	}

	return fitness;
}

function parseItem(item) {

	var parsed = [];
	item.forEach(function(component) {
		if (isNaN(component)) {
			parsed.push(null);	
		} else {
			parsed.push( parseFloat(component) );
		}
	});
	return parsed;

}

function printSolution(solution) {

	var cw = 4; //columnWidth
	function col(str) {
		return sprintf("%"+cw+"s", str);
	}


	strategy.forEach(function(w) {
		process.stdout.write( col(w.name.substr(0,cw-1)) );
	});

	process.stdout.write("\n");

	solution.weights.forEach(function(w) {
		process.stdout.write( col(w) );
	});

	process.stdout.write("\n");

	solution.adjusts.forEach(function(w) {
		process.stdout.write( col(w) );
	});

	process.stdout.write("\n");
	

}