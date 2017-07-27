/*
These wards are required for the simulation to run but are not real locations
The Pool contains patients that have been created by the simulator but have not reached A&E yet
The Exit contains patients that have been discharged from hospital
Changing the properties of these wards can allow very strange behaviour in the simulation 
It is not recommended to change anything apart from "fill_colour" without significant testing.
*/
virtual_wards = [{
name: "Exit",
capacity: Infinity,
resources: 1,
resource_distribution: "divide_evenly",
accept_overflow: "never",
queue_policy: "SimpleQueue",
fill_colour: "#083D77"
},
{
name: "Pool",
capacity: Infinity,
resources: 1,
resource_distribution: "divide_evenly",
accept_overflow: "never",
queue_policy: "SimpleQueue",
fill_colour: "#F4D35E"
}
]