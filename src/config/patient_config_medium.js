var patient_config = { 
	transfer_probability : { 
		"Emergency" : [
			{name: "Cardiology", weight: 0.01},
			{name: "AcuteAssessment", weight: 0.41},
			{name: "Elderly", weight: 0.02},
			{name: "General", weight: 0.30},
			{name: "Stroke", weight: 0.06},
			{name: "Neurology", weight: 0.01},
			{name: "Surgery", weight: 0.19}
		],
		"Cardiology" : [
			{name: "Surgery", weight: 0.17},
			{name: "Exit", weight: 0.83}
		],
		"AcuteAssessment" : [
			{name: "Elderly", weight: 0.02},
			{name: "General", weight: 0.10},
			{name: "Stroke", weight: 0.01},
			{name: "Neurology", weight: 0.01},
			{name: "Exit", weight: 0.79},
			{name: "Surgery", weight: 0.07}
		],
		"Elderly" : [
			{name: "Exit", weight: 1.00}
		],
		"General" : [
			{name: "Surgery", weight: 0.03},
			{name: "Exit", weight: 0.85},
			{name: "Elderly", weight: 0.12}
		],
		"Stroke" : [
			{name: "Neurology", weight: 0.02},
			{name: "Exit", weight: 0.98}
		],
		"Neurology" : [
			{name: "Surgery", weight: 0.11},
			{name: "Exit", weight: 0.89}
		],
		"Surgery" : [
			{name: "Exit", weight: 0.95},
			{name: "Elderly", weight: 0.01},
			{name: "General", weight: 0.04}
		]
	},
	wait_limits : { 
		"Emergency" : {
			min:1,
			max:10,
			lambda:3
		},
		"Cardiology" : {
			min:1,
			max:10,
			lambda:3
		},
		"AcuteAssessment" : {
			min:1,
			max:10,
			lambda:3
		},
		"Elderly" : {
			min:1,
			max:10,
			lambda:3
		},
		"General" : {
			min:1,
			max:10,
			lambda:3
		},
		"Stroke" : {
			min:1,
			max:10,
			lambda:3
		},
		"Neurology" : {
			min:1,
			max:10,
			lambda:3
		},
		"Surgery" : {
			min:1,
			max:10,
			lambda:3
		},
		"Exit" : {
			min: Infinity,
			max: Infinity,
		},
		"Pool" : {
			min: 1,
			max: 1,
		}
	},
	resource_limits : { 
		"Emergency" : {
			min:1,
			max:10,
			lambda:3
		},
		"Cardiology" : {
			min:1,
			max:10,
			lambda:3
		},
		"AcuteAssessment" : {
			min:1,
			max:10,
			lambda:3
		},
		"Elderly" : {
			min:1,
			max:10,
			lambda:3
		},
		"General" : {
			min:1,
			max:10,
			lambda:3
		},
		"Stroke" : {
			min:1,
			max:10,
			lambda:3
		},
		"Neurology" : {
			min:1,
			max:10,
			lambda:3
		},
		"Surgery" : {
			min:1,
			max:10,
			lambda:3
		},
		"Exit" : {
			min: 1,
			max: 1,
		},
		"Pool" : {
			min: 1,
			max: 1,
		}
	},
max_transfers : 10,
max_patients : 2000,
batch_arrival_min : 1,
batch_arrival_max : 4,
batch_arrival_lambda : 2,
initial_ward : "Emergency"
}
