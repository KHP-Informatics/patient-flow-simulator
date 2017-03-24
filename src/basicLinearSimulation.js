function simple_ward_config(){
	var ward_config = [
		{
			name: "Pool",
			capacity: Infinity,
			resources: 1,
			resource_distribution: "divide_evenly"
		},
		{
			name: "A&E",
			capacity: 100,
			resources: 10,
			resource_distribution: "divide_evenly"
		},
		{
			name: "Medical",
			capacity: 20,
			resources: 10,
			resource_distribution: "divide_evenly"
		},
		{
			name: "Discharge Lounge",
			capacity: 30,
			resources: 10,
			resource_distribution: "divide_evenly"
		},
		{
			name: "Exit",
			capacity: Infinity,
			resources: 1,
			resource_distribution: "divide_evenly"
		},
		{
			name: "Surgery",
			capacity: 10,
			resources: 10,
			resource_distribution: "divide_evenly"
		},
		{
			name: "Recovery",
			capacity: 30,
			resources: 10,
			resource_distribution: "divide_evenly"
		}
	]
	return ward_config;
}


function basicLinearSimulation(){
	var ward_config = simple_ward_config()
	var wards = {}
	var ward_names = []
	ward_config.forEach(function(el){
		wards[el.name] = new Ward(el)
		ward_names.push(el.name)
	})

	// var p1 = new Patient()
	// p1.required.wards = ["A&E","Medical", "Discharge Lounge", "Exit"]
	// p1.required.waits = [0, 5, 5, Infinity]
	// p1.id = 1
	// var p2 = new Patient()
	// p2.required.wards = ["A&E","Medical", "Discharge Lounge", "Exit"]
	// p2.required.waits = [0, 5, 5, Infinity]
	// p2.id = 2
	// wards['Pool'].admit(p1, wards['Pool'], 0)
	// wards['Pool'].admit(p2, wards['Pool'], 0)
	// var patients = [p1, p2]

	var patients = []

	var limit = 300 
	var simulation_data = {}
	ward_names.forEach(function(name){
		simulation_data[name] = []
	})	

	patient_count = 0
	for (var time = 0; time < limit; time++) {
		console.log("step",time)
		ward_names.forEach(function(name){
			console.log(name, wards[name].admitted.length)
			simulation_data[name].push({'x':time, 'y':wards[name].admitted.length})
		})

		//add a random number of patients to the pool, with random required waiting times
		//they will immediately be transferred to A&E
		if(time < 50){
			n_patients_arriving = getRandomInt(1,10)
			for (var i = 0; i < n_patients_arriving; i++) {
				required_wards = ["A&E","Medical", "Surgery", "Recovery", "Discharge Lounge", "Exit"]
				required_waits = [0, getRandomInt(1,10), getRandomInt(1,10), getRandomInt(1,10), getRandomInt(1,10), Infinity]
				required_resources = [10,10,10,10,1,0]
				np = new Patient(required_wards, required_waits, required_resources)
				wards['Pool'].admit(np, wards['Pool'], time)
				patients.push(np)
				patient_count += 1
			}
		}
		
		
		//determine which patients could move
		patients.forEach(function(el){
			el.update(time)
			//put all patients that could move into the input queue for their targets
			if(el.can_move){
				wards[el.target].add_to_queue(el)
			}
		})

		//if there are any patients in queues to enter a ward that can move, move them
		var patients_moved = true
		while(patients_moved){
			//console.log("moving patients")
			var total_moved = 0
			ward_names.forEach(function(name){
				//console.log(name)
				var moved_here = wards[name].admit_from_queue(wards[name], time)
				total_moved += moved_here
			})
			if(total_moved == 0){
				patients_moved = false
				//console.log("no patients moved")
			}
		}

		//now all patients are in place, consume resources to treat them
		ward_names.forEach(function(el){
			wards[el].spend_resources()
		})
		
	} // end of simulation loop
	console.log("total patients:", patient_count)
	//update all patients with their waiting times
	calculateWaitingTimes(patients)

	var occ_plot = plotSimulationResults(simulation_data, "occupancy", "Ward Occupancy", "Time", "Number of patients", 600, 300)


	//plot waiting times
	//plotWaitingTimeCumulative(patients, "A&E", "waiting", 600, 300)
	var wait_plot = plotWaitingTimeFreq(patients, "A&E", "waiting", 600, 300)

}