var patient_config = { 
	transfer_probability : { 
		"Emergency" : [
		//typically only 20% of all A+E arrivals are admitted
		//the flow to all other wards should therefore add up to 0.2
			{name: "Exit", weight:0.6},
			{name: "Cardiology", weight: 0.01},
			{name: "AcuteAssessment", weight: 0.14},
			{name: "CriticalCare", weight: 0.02},
			{name: "Elderly", weight: 0.02},
			{name: "General", weight: 0.14},
			{name: "Stroke", weight: 0.02},
			{name: "Neurology", weight: 0.01},
			{name: "Surgery", weight: 0.04}
		],
		"Cardiology" : [
			{name: "Surgery", weight: 0.15},
			{name: "Exit", weight: 0.6},
			{name: "CriticalCare", weight: 0.1},
			{name: "Elderly", weight: 0.05},
			{name: "General", weight: 0.1}
		],
		"AcuteAssessment" : [
			{name: "Elderly", weight: 0.08},
			{name: "General", weight: 0.10},
			{name: "Stroke", weight: 0.05},
			{name: "Neurology", weight: 0.09},
			{name: "Exit", weight: 0.5},
			{name: "Surgery", weight: 0.09},
			{name: "Cardiology", weight: 0.09}
		],
		"Elderly" : [
			{name: "Exit", weight: 0.8},
			{name: "General", weight: 0.05},
			{name: "CriticalCare", weight: 0.05},
			{name: "Surgery", weight: 0.05},
			{name: "Stroke", weight: 0.05},
		],
		"General" : [
			{name: "Surgery", weight: 0.02},
			{name: "Exit", weight: 0.68},
			{name: "Elderly", weight: 0.1},
			{name: "CriticalCare", weight: 0.1},
			{name: "Cardiology", weight: 0.1}
		],
		"Stroke" : [
			{name: "Neurology", weight: 0.03},
			{name: "Exit", weight: 0.85},
			{name: "Surgery", weight: 0.04},
			{name: "General", weight: 0.04},
			{name: "Elderly", weight: 0.02},
			{name: "CriticalCare", weight: 0.02}
		],
		"Neurology" : [
			{name: "Surgery", weight: 0.12},
			{name: "Exit", weight: 0.75},
			{name: "CriticalCare", weight: 0.06},
			{name: "General", weight: 0.03},
			{name: "Elderly", weight: 0.02},
			{name: "Stroke", weight: 0.02}
		],
		"Surgery" : [
			{name: "Exit", weight: 0.70},
			{name: "Elderly", weight: 0.02},
			{name: "General", weight: 0.12},
			{name: "CriticalCare", weight: 0.08},
			{name: "Neurology", weight: 0.03},
			{name: "Cardiology", weight: 0.03},
			{name: "Stroke", weight: 0.02}
		],
		"CriticalCare" : [
			{name: "Exit", weight: 0.18},
			{name: "Elderly", weight: 0.04},
			{name: "General", weight: 0.17},
			{name: "Cardiology", weight: 0.25},
			{name: "Surgery", weight: 0.23},
			{name: "Neurology", weight: 0.09},
			{name: "Stroke", weight: 0.04}
		]
	},
	wait_limits : { 
		"Emergency" : {
			min:1,
			max:2,
			lambda:1
		},
		"Cardiology" : {
			min:5,
			max:50,
			lambda:10
		},
		"AcuteAssessment" : {
			min:1,
			max:10,
			lambda:4
		},
		"Elderly" : {
			min:10,
			max:100,
			lambda:50
		},
		"General" : {
			min:4,
			max:30,
			lambda:15
		},
		"Stroke" : {
			min:5,
			max:40,
			lambda:4
		},
		"Neurology" : {
			min:5,
			max:50,
			lambda:20
		},
		"Surgery" : {
			min:2,
			max:30,
			lambda:5
		},
		"CriticalCare" : {
			min:5,
			max:50,
			lambda:5
		},
		// this is now hardcoded in the patient generator to support saving as JSON,
		// which does not support Infinity
		// "Exit" : {
		// 	min: Infinity,
		// 	max: Infinity,
		// },
		"Pool" : {
			min: 1,
			max: 1,
		}
	},
	resource_limits : { 
		"Emergency" : {
			min:1,
			max:2,
			lambda:1
		},
		"Cardiology" : {
			min:10,
			max:30,
			lambda:20
		},
		"AcuteAssessment" : {
			min:5,
			max:10,
			lambda:8
		},
		"Elderly" : {
			min:10,
			max:30,
			lambda:15
		},
		"General" : {
			min:20,
			max:40,
			lambda:30
		},
		"Stroke" : {
			min:20,
			max:50,
			lambda:30
		},
		"Neurology" : {
			min:20,
			max:50,
			lambda:30
		},
		"Surgery" : {
			min:10,
			max:30,
			lambda:15
		},
		"CriticalCare" : {
			min:30,
			max:50,
			lambda:25
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
	attention_limits : { 
		"Emergency" : {
			min:1,
			max:2,
			lambda:1
		},
		"Cardiology" : {
			min:10,
			max:30,
			lambda:15
		},
		"AcuteAssessment" : {
			min:5,
			max:15,
			lambda:10
		},
		"Elderly" : {
			min:10,
			max:40,
			lambda:20
		},
		"General" : {
			min:10,
			max:40,
			lambda:20
		},
		"Stroke" : {
			min:10,
			max:40,
			lambda:20
		},
		"Neurology" : {
			min:10,
			max:40,
			lambda:20
		},
		"Surgery" : {
			min:10,
			max:40,
			lambda:20
		},
		"CriticalCare" : {
			min:20,
			max:40,
			lambda:30
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
batch_arrival_min : 5,
batch_arrival_max : 8,
batch_arrival_lambda : 2,
initial_ward : "Emergency"
}
