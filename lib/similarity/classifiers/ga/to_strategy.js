"use strict";

var _ = require('underscore');
var strategy = require("../strategies/all");
var attributes = _(strategy).pluck('name');

var solution = {   weights: [ 2, 2, 5, 4, 2, 5, 3, 4, 2, 3, 2, 4, 2, 2, 2, 2, 2, 5, 2, 3, 5, 2, 5 ],
     adjusts: 
      [ 'qi',
        'qd',
        'co',
        'li',
        'qi',
        'ld',
        'ld',
        'co',
        'qd',
        'li',
        'li',
        'li',
        'co',
        'co',
        'qi',
        'qi',
        'qd',
        'li',
        'co',
        'li',
        'li',
        'qd',
        'qi' ]
};



var items = attributes.map(function(key, i) {
	return {
		name: key,
		weight: solution.weights[i],
		adjust: solution.adjusts[i],
	//	association: solution.associations[i],
	};
});
console.log(JSON.stringify(items,null,"\t"));