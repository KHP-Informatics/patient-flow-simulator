//this is a very simple simulation to check that diversion works properly
//patients are specified so that a transfer is guaranteed to be made to free space, and the simulation runs long enough
//that both patients should eventually make it to the exit
//the only random element at the moment is what the target of the transfer made to free space ends up being

function simple_diversion_ward_config(){
	var ward_config = [
		{
			name: "Pool",
			capacity: Infinity,
			resources: 1,
			resource_distribution: "divide_evenly",
			accept_overflow: "never"
		},
		{
			name: "A&E",
			capacity: 1,
			resources: 10,
			resource_distribution: "divide_evenly",
			accept_overflow: "never"
		},
		{
			name: "Medical",
			capacity: 1,
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
			resource_distribution: "divide_evenly",
			accept_overflow: "never"
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
		},
		{
			name: "Overflow",
			capacity: Infinity,
			resources: 10,
			resource_distribution: "divide_evenly"
		}
	]
	return ward_config;
}


function simulationSimpleDiversion(){
	//var ward_config = simple_ward_config()
	var ward_config = simple_diversion_ward_config()
	var wards = {}
	var ward_names = []
	ward_config.forEach(function(el){
		wards[el.name] = new Ward(el)
		ward_names.push(el.name)
	})

	var patients = []

	var limit = 30

	var simulation_data = {}
	ward_names.forEach(function(name){
		simulation_data[name] = []
	})	

	var patient_count = 0
	var transfers_to_free_space = 0
//create a specific sequence of patients
//p1 will create a delay in the medical ward
var patient_sequence = []
required_wards = ["A&E","Medical", "Exit"]
required_waits = [0, 3, Infinity]
required_resources = [1,1,0]
p1 = new Patient(required_wards, required_waits, required_resources)
p1.id = 1
patient_sequence.push(p1)
//p2 follows in the next step and will be delayed
required_wards = ["A&E","Medical", "Exit"]
required_waits = [0, 10, Infinity]
required_resources = [1,1,0]
p2 = new Patient(required_wards, required_waits, required_resources)
p2.id = 2
patient_sequence.push(p2)


	for (var time = 0; time < limit; time++) {
		console.log("step",time)
		ward_names.forEach(function(name){
			//console.log(name, wards[name].admitted.length)
			simulation_data[name].push({'x':time, 'y':wards[name].admitted.length})
		})


		if(patient_count < patient_sequence.length){
			np = patient_sequence[patient_count]
			wards['Pool'].admit(np, wards['Pool'], time)
			patients.push(np)
			patient_count += 1
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

		//make any transfers to free up space
		//might move patients that are at the front of the queue to go somewhere else, but
		//they'll just be immediately transfererred on again in the next round
		//this might mean we aren't freeing the theoretical maximum space possible, but is probably realistic enough
		//(which might be to move everyone we can, then free up beds?)
		//at this point wards have a good idea of their input strain - they have their complete input queues
		//because nobody else has arrived yet, so it's a good point to decide whether to free up space
		//freeing after making any possible transfers means patients moved only to free space
		//can never block somebody who is currently in the input queue (which could currently happen if freeing done before
		//required transfers)

		//iterate over wards in a random order and free up space
		//because wards are also added as targets to recieve patients in this order, 
		//wards also receive overflow patients in a random order
		console.log("begin freeing space")
		var ward_check_order = _.shuffle(ward_names) //get in random order
		var ward_freeing_order = []
		var wards_with_space = []
		//iterate over wards in the random order, if the ward is at capacity then add it to the list
		//of wards that want to free up space
		ward_check_order.forEach(function(el){
			if(wards[el].at_capacity){ //for the sake of this simple test, don't need to also check the queue
				ward_freeing_order.push(el)
			} else {
				wards_with_space.push(el)
			}
		})
		var destination_ward_index = 0 //index in wards_with_space
		ward_freeing_order.forEach(function(el){

			//patients that can be moved
			var to_move = wards[el].admitted.filter(function(p){
				return p.can_move
			})
			var i = 0
			while(i < to_move.length & destination_ward_index < wards_with_space.length){
				//before any patients move, we know there is capacity in the destination
				var dest_name = wards_with_space[destination_ward_index]
				console.log("freeing space with transfer from el",el,"to dest_name", dest_name)
				var moved = wards[dest_name].admit_from(to_move[i], wards[dest_name], time)
				transfers_to_free_space += 1
				//check whether the destination is now at capacity, if so move on to next dest
				var dest_at_capacity = wards[dest_name].at_capacity
				if(dest_at_capacity){
					destination_ward_index += 1
				}
				i += 1
			}
		})

		//now all patients are in place, consume resources to treat them
		ward_names.forEach(function(el){
			wards[el].spend_resources()
		})
		
	} // end of simulation loop
	console.log("total patients:", patient_count)
	console.log("total transfers made to free space:", transfers_to_free_space)
	//update all patients with their waiting times
	calculateWaitingTimes(patients)

	var occ_plot = plotSimulationResults(simulation_data, "occupancy", "Ward Occupancy", "Time", "Number of patients", 600, 300)


	//plot waiting times
	//plotWaitingTimeCumulative(patients, "A&E", "waiting", 600, 300)
	var wait_plot = plotWaitingTimeFreq(patients, "A&E", "waiting", 600, 300)
}