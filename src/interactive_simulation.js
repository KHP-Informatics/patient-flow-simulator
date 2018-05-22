// interact with GUI to control simulation
//wards are defined by ward_config.js

function run(ward_config, patient_config, simulation_config, virtual_wards){
	save_patient_changes() //get changes to configuration from editor
	save_simulation_changes()
	default_simulation_summary()
	reset_buttons()
	var wards = {}
	var ward_names = []
	ward_config.forEach(function(el){
		wards[el.name] = new Ward(el)
		ward_names.push(el.name)
	})
	virtual_wards.forEach(function(el){
		wards[el.name] = new Ward(el)
		ward_names.push(el.name)
	})

	var patient_generator = new PatientGenerator(patient_config)
	patients = []

	var simulation_data = {results:{}, config: ward_config, virtual_wards: virtual_wards}
	ward_names.forEach(function(name){
		simulation_data.results[name] = []
	})	

	var patient_count = 0
	var transfers_to_free_space = 0
	var all_patients_created = false
	for (var time = 0; time < simulation_config.steps; time++) {
		console.log("step",time)
		ward_names.forEach(function(name){
			//console.log(name, wards[name].admitted.length)
			simulation_data.results[name].push({'x':time, 'y':wards[name].admitted.length})
		})

		//add a random number of patients to the pool, with random required waiting times
		//they will immediately be transferred to A&E
		if(!all_patients_created){
			var new_patients = patient_generator.get()
			new_patients.forEach(function(np){
				wards['Pool'].admit(np, wards['Pool'], time)
				patients.push(np)
				patient_count += 1
			})
			if(new_patients.length == 0){
				all_patients_created = true
			}
		}
		
		
		//determine which patients could move
		patients.forEach(function(el){
			el.update(time)
			//put all patients that could move into the input queue for their targets
			if(el.can_move){
				//console.log(el)
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
		//iterate over wards in the random order, if the ward is at capacity and has patients in its queue then add it to the list
		//of wards that want to free up space. Wards that are not at capacity cannot have a queue so they become destinations
		ward_check_order.forEach(function(el){
			if(wards[el].at_capacity){ 
				if(wards[el].entry_queue.length() > 0){
					ward_freeing_order.push(el)
				}
			} else {
				if(wards[el].will_accept_overflow()){
					wards_with_space.push(el)
				}	
			}
		})
		var destination_ward_index = 0 //index in wards_with_space
		ward_freeing_order.forEach(function(el){
			//on the target ward, "here" is the ward with the overflow
			//ward.admit_from(patient, here, time)
			//while ward.admit_from returns true, keep sending patients

			//patients that can be moved
			var to_move = wards[el].admitted.filter(function(p){
				return p.can_move
			})
			var i = 0
			while(i < to_move.length & destination_ward_index < wards_with_space.length){
				console.log("freeing space")
				//before any patients move, we know there is capacity in the destination
				var dest_name = wards_with_space[destination_ward_index]
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
			wards[el].spend('resources')
			wards[el].spend('attention')
		})
		
	} // end of simulation loop

	//simulation summary
	show_simulation_summary(patients)
	console.log("total patients:", patient_count)
	console.log("total transfers made to free space:", transfers_to_free_space)
	$("#overflow-transfers").text(transfers_to_free_space)
	//update all patients with their waiting times
	calculateWaitingTimes(patients)
	console.log(simulation_data)
	var occ_plot = plotSimulationResults(simulation_data, "occupancy", "Ward Occupancy", "Time", "Number of patients", 600, 300)


	//plot waiting times
	//plotWaitingTimeCumulative(patients, "A&E", "waiting", 600, 300)
	var wait_plot = plotWaitingTimeFreq(patients, "Emergency", "waiting", 600, 300,"mean-wait-time")

	var wait_target = showEmergencyWaitVsTarget(patients, simulation_config.emergency_wait_target, "patients-on-target")

	//generate graph
	buildTransferGraph(patients, wards, 'cy')

	//plot path lengths
	plotPathLengthDistribution(patients, "path-length", 600, 300, "total-unique-paths", "top-paths-list", 5)

	return {'simulation_data': simulation_data, 'patients': patients}
}


//generate the ward list UI
//uses GLOBAL variables ward_config, patient_config
function init_user_interface(patient_config, ward_config, graph_container){
	var ward_names = []
	ward_config.forEach(function(el){
		if(el.name != "Exit" & el.name != "Pool"){
			ward_names.push(el.name)
		}
	})

	//update list of wards
	var list = ""
	ward_names.forEach(function(el){
		 list = list + '<button id="ward-btn-'+el+'" type="button" class="list-group-item" onclick="show_config('+"'"+el+"'"+')">'+el+'</button>'
	})
	$("#ward-list").html(list)

	//update patient parameters
	$("#patient-creation-limit").val(patient_config.max_patients)
	$("#patient-batch-min").val(patient_config.batch_arrival_min)
	$("#patient-batch-max").val(patient_config.batch_arrival_max)

	//update simulation parameters
	$("#simulation-steps").val(simulation_config.steps)
	$("#simulation-emergency-target").val(simulation_config.emergency_wait_target)

	//graph
	buildProbabilityGraph(patient_config, graph_container)

	//resources and capacity
	show_resource_summary()

	//simulation summary
	default_simulation_summary()

	//callback for network tab
	$('#network-tab-link').on('shown.bs.tab', function (e) {
	 	cy.resize()
		cy.fit()
	})

}

function show_resource_summary(){
	var total_resources = 0
	var total_capacity = 0
	ward_config.forEach(function(el){
		if(el.name != "Exit" & el.name != "Pool"){
			total_resources += el.resources
			total_capacity += el.capacity
		}
	})

	//resource used
	$('#total-resource-use').text(total_resources)
	//capacity
	$('#total-capacity').text(total_capacity)
}

function show_simulation_summary(patients){
	$('#patients-simulated').text(patients.length)
	$("#simulation-complete").text('Yes')

	var admitted = 0;
	var discharged = 0;
	var remaining = 0;
	var transfers = 0;
	patients.forEach(function(el){
		transfers += el.observed.wards.length - 2
		if(el.observed.wards.length >=2){
			admitted += 1
		}
		if(el.observed.wards[el.observed.wards.length - 1] == "Exit"){
			discharged += 1
		}
	})
	remaining = admitted - discharged
    $("#patients-admitted").text(admitted.toString())
    $("#patients-discharged").text(discharged.toString())
    $("#patients-remaining").text(remaining.toString())
    $("#total-transfers").text(transfers.toString())

}

function default_simulation_summary(){
	$("#simulation-complete").text("Not started")
    $("#patients-simulated").text("0")
    $("#patients-admitted").text("0")
    $("#patients-discharged").text("0")
    $("#patients-remaining").text("0")
    $("#total-transfers").text("0")
    $("#overflow-transfers").text("0")
    $("#mean-wait-time").text("0")
    $("#patients-on-target").text("0")
    $("#total-unique-paths").text("0")
}

//generate the ward configuration panel
function show_config(ward){
	//set the value of the hidden input to the selected ward
	$("#selected-ward").val(ward)
	var selected_ward_config = ward_config.filter(function(el){
		return el.name == ward
	})
	selected_ward_config = selected_ward_config[0]
	//update the rest of the panel
	$('#selected-ward-name').text('Editing ' + ward)
    $("#ward-capacity").val(selected_ward_config.capacity)
    $("#ward-resources").val(selected_ward_config.resources)
    $("#ward-attention").val(selected_ward_config.attention)
    $('#ward-resource-policy').val(selected_ward_config.resource_distribution);
    $('#ward-overflow-policy').val(selected_ward_config.accept_overflow);
    $('#ward-queue-policy').val(selected_ward_config.queue_policy);

    //unselect all ward buttons
    $("button[id^=ward-btn]").removeClass('selected')
    //add class 'selected' to this button
    $('#ward-btn-'+ward).addClass('selected')
}

function save_ward_changes(){
	//get the selected ward from the hidden input
	var ward = $("#selected-ward").val()
	var selected_ward_config = ward_config.filter(function(el){
		return el.name == ward
	})
	selected_ward_config = selected_ward_config[0]

	//update that ward
	selected_ward_config.capacity = parseFloat($("#ward-capacity").val())
    selected_ward_config.resources = parseFloat($("#ward-resources").val())
    selected_ward_config.attention = parseFloat($("#ward-attention").val())
    selected_ward_config.resource_distribution = $('#ward-resource-policy').val()
    selected_ward_config.accept_overflow = $('#ward-overflow-policy').val()
    selected_ward_config.queue_policy = $('#ward-queue-policy').val()

    //total resources and capacity
    show_resource_summary()
}

//save changes made to patient_config
function save_patient_changes(){
	patient_config.max_patients = parseFloat($("#patient-creation-limit").val())
	patient_config.batch_arrival_min = parseFloat($("#patient-batch-min").val())
	patient_config.batch_arrival_max = parseFloat($("#patient-batch-max").val())
}

function save_simulation_changes(){
	simulation_config.steps = parseFloat($("#simulation-steps").val())
	simulation_config.emergency_wait_target = parseFloat($("#simulation-emergency-target").val())
}

function network_analysis(type){
	$('.active-analysis').removeClass('active-analysis')
	$("#" + type).addClass('active-analysis')
	if(type == "total" | type == "indegree" | type == "outdegree"){
		degree(type)
	} else if(type == "betweenness"){
		betweenness()
	} else if(type == "closeness"){
		closeness()
	} else if(type == "reset"){
		reset_style()
	}
}

//reset anything in the UI that might be left in an active state when a new simulation is started
function reset_buttons(){
	$('.active-analysis').removeClass('active-analysis')
}

//waiting time in Emergency ward vs target
function showEmergencyWaitVsTarget(patients, target, text_output){
	var percent_on_target = emergencyWaitVsTarget(patients, target)
	$("#" + text_output).text(percent_on_target.toFixed(2) + "%")
}

//change to a different preset
function change_preset(){
	var preset = $('#select-hospital-preset').val()
}

//upload a configuration file
function upload_config(){
	var fileInput = document.getElementById('file_upload');
	var file = fileInput.files[0];
	console.log('processing upload of:' + file.name + ' detected type: ' + file.type);
	var reader = new FileReader();
	//define function to run when reader is done loading the file
	reader.onload = function(e) {
		//detect the type of file
		var textType = /text.*/
		if(file.type.match(textType) ){
			console.log('file type ok ')
			uploaded_config = JSON.parse(reader.result)
			patient_config = uploaded_config.patient_config
			ward_config = uploaded_config.ward_config
			simulation_config = uploaded_config.simulation_config
			init_user_interface(patient_config, ward_config, 'cy')
			$("#change-hospital-modal").modal('hide')
			
		} else {
			alert("Error: Not a valid file type.")
		}

	}
	
	//now load the files
	reader.readAsText(file);
}

//save the current config to file
function download_current_config(){
	var config = {"patient_config" : patient_config, "ward_config" : ward_config, "simulation_config" : simulation_config}
	var config_text = JSON.stringify(config)
	var blob = new Blob([config_text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, 'patient_flow_config.json.txt');
}