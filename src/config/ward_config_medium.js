var ward_config = [
{
name: "Emergency",
capacity: 50,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "never",
queue_policy: "MaxPQ",
fill_colour: "#F6D8AE"
},
{
name: "Cardiology",
capacity: 25,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#4caf50"
},
{
name: "AcuteAssessment",
capacity: 30,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#6FB1FC"
},
{
name: "Elderly",
capacity: 20,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#f44336"
},
{
name: "General",
capacity: 30,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#2E4057"
},
{
name: "Stroke",
capacity: 10,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#673ab7"
},
{
name: "Neurology",
capacity: 30,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#0DE3FF"
},
{
name: "Surgery",
capacity: 25,
resources: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#DA4167"
}
]