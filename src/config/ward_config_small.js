//template
/*
{
	name: ,
	capacity: ,
	resources: ,
	resource_distribution: ,
}
*/

//definition of wards
var ward_config = [
	{
		name: "Emergency",
		capacity: 50,
		resources: 50,
		resource_distribution: "divide_evenly",
		accept_overflow: "never",
		fill_colour: "#F6D8AE",
		queue_policy: "MaxPQ"
	},
	{
		name: "Medical",
		capacity: 20,
		resources: 30,
		resource_distribution: "divide_evenly",
		accept_overflow: "always",
		fill_colour: "#2E4057",
		queue_policy: "MaxPQ"
	},
	// {
	// 	name: "Discharge Lounge",
	// 	capacity: 30,
	// 	resources: 10,
	// 	resource_distribution: "divide_evenly",
	// 	accept_overflow: "never"
	// },
	{
		name: "Surgery",
		capacity: 10,
		resources: 20,
		resource_distribution: "divide_evenly",
		accept_overflow: "always",
		fill_colour: "#DA4167",
		queue_policy: "MaxPQ"
	},
	{
		name: "Recovery",
		capacity: 15,
		resources: 35,
		resource_distribution: "divide_evenly",
		accept_overflow: "always",
		fill_colour: "#F4D35E",
		queue_policy: "MaxPQ"
	},
	{
		name: "Observation",
		capacity: 20,
		resources: 40,
		resource_distribution: "divide_evenly",
		accept_overflow: "always",
		fill_colour: "#6FB1FC",
		queue_policy: "MaxPQ"
	}
]