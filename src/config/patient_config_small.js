//configuration of patient transfer probabilities

var patient_config = {
	//given a patient is in ward W, what are the possible next wards and how likely is each
	transfer_probability : {
		"Emergency" : [
			{name: "Observation", weight: 0.8},
			{name: "Medical", weight: 0.15},
			{name: "Surgery", weight: 0.05}
		],
		"Observation" : [
			{name: "Medical", weight: 0.3},
			{name: "Exit", weight: 0.7}
		],
		"Medical" : [
			{name: "Surgery", weight: 0.2},
			{name: "Exit", weight: 0.8}
		],
		"Surgery" : [
			{name: "Recovery", weight: 1}
		],
		"Recovery" : [
			{name: "Exit", weight: 1}
		]
	}, 
	//what are the min and max resources a patient might require in each ward
	resource_limits : {
		"Emergency" : {
			min: 1,
			max: 10,
			lambda: 10
		},
		"Observation" : {
			min: 1,
			max: 10,
			lambda: 15
		},
		"Medical" : {
			min: 1,
			max: 10,
			lambda: 17
		},
		"Surgery" : {
			min: 1,
			max: 10,
			lambda: 20
		},
		"Recovery" : {
			min: 1,
			max: 10,
			lambda: 7
		},
		"Exit": {
			min: 1,
			max: 1
		},
		"Pool": {
			min: 1,
			max: 1
		}
	},
	//what is the min and max time a patient might require in each ward
	wait_limits : {
		"Emergency" : {
			min: 1,
			max: 10,
			lambda: 10
		},
		"Observation" : {
			min: 1,
			max: 10,
			lambda: 7
		},
		"Medical" : {
			min: 1,
			max: 10,
			lambda: 15
		},
		"Surgery" : {
			min: 1,
			max: 10,
			lambda: 10
		},
		"Recovery" : {
			min: 1,
			max: 10,
			lambda: 12
		},
		// this is now hardcoded in the patient generator to support saving as JSON,
		// which does not support Infinity
		// "Exit": {
		// 	min: Infinity,
		// 	max: Infinity
		// },
		"Pool": {
			min: 1,
			max: 1
		}
	},
	//what is the maxumum number of transfers before the patient is sent to exit
	max_transfers : 10,
	max_patients : 200,
	batch_arrival_min : 0,
	batch_arrival_max : 2,
	batch_arrival_lambda : 5,
	initial_ward : "Emergency"
}