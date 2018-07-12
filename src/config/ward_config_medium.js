var ward_config = [
{
name: "Emergency",
capacity: 50,
resources: 30,
attention: 30,
resource_distribution: "divide_evenly",
accept_overflow: "never",
queue_policy: "MaxPQ",
fill_colour: "#F6D8AE",
begin_boarding_after: 8
},
{
name: "Cardiology",
capacity: 10,
resources: 10,
attention: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#4caf50"
},
{
name: "AcuteAssessment",
capacity: 15,
resources: 10,
attention: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#6FB1FC"
},
{
name: "Elderly",
capacity: 30,
resources: 10,
attention: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#f44336"
},
{
name: "General",
capacity: 30,
resources: 30,
attention: 30,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#2E4057"
},
{
name: "Stroke",
capacity: 10,
resources: 10,
attention: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#673ab7"
},
{
name: "Neurology",
capacity: 10,
resources: 10,
attention: 10,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#0DE3FF"
},
{
name: "Surgery",
capacity: 20,
resources: 15,
attention: 15,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#DA4167"
},
{
name: "CriticalCare",
capacity: 10,
resources: 20,
attention: 20,
resource_distribution: "divide_evenly",
accept_overflow: "always",
queue_policy: "SimpleQueue",
fill_colour: "#DA4167"
}
]