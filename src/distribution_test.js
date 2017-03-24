//test that the different resource distribution methods work
//change the resource policy of the Medical ward in the GUI, then call this function in the console
//at the end it prints the locations of the two patients
function run_dist_test(ward_config, patient_config, simulation_config){
	console.log('test')
	save_patient_changes() //get changes to configuration from editor
	save_simulation_changes()
	var wards = {}
	var ward_names = []
	ward_config.forEach(function(el){
		wards[el.name] = new Ward(el)
		ward_names.push(el.name)
	})


	p1 = new Patient()
	p1.required.wards = ['Emergency','Medical','Exit']
	p1.required.waits = [1,1,Infinity]
	p1.required.resources = [1,10000,1]
	p1.target = 'Emergency'
	p1.id = 1
	p2 = new Patient()
	p2.required.wards = ['Emergency','Medical','Exit']
	p2.required.waits = [1,1,Infinity]
	p2.required.resources = [1,1,1]
	p2.target = 'Emergency'
	p2.id = 2
	patients = [p1,p2]
	patients.forEach(function(np){
			wards['Pool'].admit(np, wards['Pool'], time)
		})

	var simulation_data = {}
	ward_names.forEach(function(name){
		simulation_data[name] = []
	})	

	var patient_count = patients.length
	var transfers_to_free_space = 0
	var all_patients_created = false
	for (var time = 0; time < simulation_config.steps; time++) {
		console.log("step",time)
		ward_names.forEach(function(name){
			//console.log(name, wards[name].admitted.length)
			simulation_data[name].push({'x':time, 'y':wards[name].admitted.length})
		})		
		
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
	console.log("total transfers made to free space:", transfers_to_free_space)
	console.log("high resource patient is in ", p1.current_ward.name)
	console.log("low resource patient is in ", p2.current_ward.name)
	//update all patients with their waiting times
	calculateWaitingTimes(patients)

	var occ_plot = plotSimulationResults(simulation_data, "occupancy", "Ward Occupancy", "Time", "Number of patients", 600, 300)


	//plot waiting times
	//plotWaitingTimeCumulative(patients, "A&E", "waiting", 600, 300)
	var wait_plot = plotWaitingTimeFreq(patients, "Emergency", "waiting", 600, 300)

	//generate graph
	buildTransferGraph(patients, wards, 'cy')
}