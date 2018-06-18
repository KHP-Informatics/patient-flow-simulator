// interact with GUI to control simulation
//wards are defined by ward_config.js
"use strict";
window.run_number = 0;
window.prev_result = {};
window.performance_history = []

function run(){
	save_patient_changes() //get changes to configuration from editor
	save_simulation_changes()
	default_simulation_summary()
	reset_buttons()
	var reset_results = reset_when_run()
	var preset_patients = preset_patients_set()
	var start_time = 0
	var patient_creation_times = {} // time: [index of each patient in patients array]
	if(reset_results || window.run_number == 0){ //always have to reset on first run
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

		var patients = []
		if(!preset_patients){ 
			var seed_patients = true
			
			if(seed_patients){
				var seeded = seed(wards, patient_config, 0.8)
				wards = seeded['wards']
				patients = seeded['patients']
			}
		}
		
	} else {
		var wards = window.prev_result.wards
		var ward_names = []
		var patients = []
		//collect references to patients who are currently admitted to hospital
		//put them in the patients list so they can be updated and tracked
		ward_config.forEach(function(el){
			ward_names.push(el.name)
			patients = patients.concat(wards[el.name].admitted)
			wards[el.name].update_config(el) //make any changes to ward config based on GUI. Admitted patients are kept. 
		})
		virtual_wards.forEach(function(el){
			ward_names.push(el.name)
		})
		start_time = window.prev_result.end_time + 1 //needed so times work out for patients still in hospital
		
	}
	//true whether or not the simulation is reset
	var end_time = start_time + simulation_config.steps
	
	if(preset_patients){
		var patient_generator = new PresetPatientGenerator(patientset)
	} else {
		var patient_generator = new PatientGenerator(patient_config)
	}
	

	var simulation_data = {occupancy:{}, config: ward_config, virtual_wards: virtual_wards}
	simulation_data['queues'] = {}
	ward_names.forEach(function(name){
		simulation_data.occupancy[name] = []
		simulation_data.queues[name] = []
	})	

	var patient_count = patients.length
	var transfers_to_free_space = 0
	var all_patients_created = false
	for (var time = start_time; time < end_time; time++) {
		console.log("step",time)
		patient_creation_times[time] = []
		ward_names.forEach(function(name){
			//console.log(name, wards[name].admitted.length)
			simulation_data.occupancy[name].push({'x':time, 'y':wards[name].admitted.length})
			simulation_data.queues[name].push({'x':time, 'y':wards[name].entry_queue.length()})
		})

		//add a random number of patients to the pool, with random required waiting times
		//they will immediately be transferred to A&E
		if(!all_patients_created){
			var new_patients = patient_generator.get(time)
			new_patients.forEach(function(np){
				wards['Pool'].admit(np, wards['Pool'], time)
				patients.push(np)
				patient_creation_times[time].push(patient_count)
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
		console.log("wards at capacity with queues: ", ward_freeing_order)
		console.log("wards with free space: ", wards_with_space)
		var destination_ward_index = 0 //index in wards_with_space
		ward_freeing_order.forEach(function(el){
			//on the target ward, "here" is the ward with the overflow
			//ward.admit_from(patient, here, time)
			//while ward.admit_from returns true, keep sending patients

			//patients that can be moved
			var to_move = wards[el].admitted.filter(function(p){
				return p.can_move
			})
			console.log(to_move.length, " patients can move from ward ", el)
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
	var occ_plot = plotSimulationResults(simulation_data, 'occupancy', "occupancy", "Ward Occupancy", "Time", "Number of patients", 600, 300, true)


	//plot waiting times
	//plotWaitingTimeCumulative(patients, "A&E", "waiting", 600, 300)
	var select = document.getElementById("wait-plot-list");
	select.value = "Emergency" //reset dropdown in case it was changed since last run
	var wait_time = plotWaitingTimeFreq(patients, "Emergency", "waiting", 600, 300,"mean-wait-time")

	var wait_target = showEmergencyWaitVsTarget(patients, simulation_config.emergency_wait_target, "patients-on-target")

	//generate graph
	buildTransferGraph(patients, wards, 'cy', true)

	//plot path lengths
	plotPathLengthDistribution(patients, "path-length", 600, 300, "total-unique-paths", "top-paths-list", 5)


	//queue length
	var q_plot = plotSimulationResults(simulation_data, "queues", "queues", "Queue length", "Time", "Number of patients", 600, 300, false)
	var delay_tbl = delay_table(patients)

	//update global tracking
	var output_obj = {'simulation_data': simulation_data, 'patients': patients, 'wards':wards, 'end_time': time, 'creation_times': patient_creation_times}
	window.prev_result = output_obj
	window.run_number += 1
	var res_summary = get_resource_summary()
	var summary = {}
	summary['management'] = res_summary
	summary['perc_under_4h'] = wait_target
	summary['mean_emergency_wait'] = wait_time
	summary['ward_config'] = copy_ward_config(ward_config)
	window.performance_history.push(summary)

	//performance between runs - must be after window.performance_history is updated
	update_performance_history()


	return output_obj
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
	$("#patient-batch-lambda").val(patient_config.batch_arrival_lambda)

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

	//waiting time plot toggle
	build_wait_time_dropdown()

	//performance history table
	clear_performance_history()

}

function show_resource_summary(){
	var summary = get_resource_summary()
	
	//resource used
	$('#total-resource-use').text(summary['resources']['amount'])
	$('#total-resource-cost').text(summary['resources']['cost'])
	//capacity
	$('#total-capacity').text(summary['capacity']['amount'])
	$('#total-capacity-cost').text(summary['capacity']['cost'])
	//staff
	$('#total-staff').text(summary['staff']['amount'])
	$('#total-staff-cost').text(summary['staff']['cost'])
	//overall cost
	$('#total-cost').text(summary['total_cost'])
	
}

function get_resource_summary(){
	var summary = {}
	var total_resources = 0
	var total_capacity = 0
	var total_staff = 0
	ward_config.forEach(function(el){
		if(el.name != "Exit" & el.name != "Pool"){
			total_resources += el.resources
			total_capacity += el.capacity
			total_staff += el.attention
		}
	})
	summary['staff'] = {'amount':total_staff}
	summary['capacity'] = {'amount':total_capacity}
	summary['resources'] = {'amount':total_resources}
	//costs
	var resource_cost = simulation_config.resource_cost * total_resources
	var staff_cost = simulation_config.staff_cost * total_staff
	var capacity_cost = simulation_config.bed_cost * total_capacity
	summary['resources']['cost'] = resource_cost
	summary['staff']['cost'] = staff_cost
	summary['capacity']['cost'] = capacity_cost
	summary['total_cost'] = resource_cost + capacity_cost + staff_cost
	return summary
}

function show_simulation_summary(patients){
	$('#patients-simulated').text(patients.length)
	$("#simulation-complete").text('Yes')

	var admitted = 0;
	var discharged = 0;
	var remaining = 0;
	var transfers = 0;
	patients.forEach(function(el){
		if(el.observed.wards.length >=2){
			admitted += 1
			transfers += el.observed.wards.length - 2 //only want to count transfers for patients who were admitted
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
	patient_config.batch_arrival_lambda = parseFloat($("#patient-batch-lambda").val())
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
	return percent_on_target
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

//fill wards to specified occupancy
function seed(wards, patient_config, target_occ){
	var local_patient_conf = Object.assign({}, patient_config) //needed because config is global
	var patient_generator = new PatientGenerator(local_patient_conf)
	var patients = []
	patient_generator.config.max_patients = Infinity
	var ward_names = Object.keys(wards)
	ward_names.forEach(function(el){
		var free_beds = wards[el].capacity - wards[el].admitted.length
		if(!isFinite(free_beds) || free_beds == 0){
			console.log("not filling ward", el, "with free space = ", free_beds)
		} else {
			var n_seed = Math.floor(free_beds * target_occ)
			patient_generator.config.initial_ward = el
			for (var i = 0; i < n_seed; i++) {
				var pt = patient_generator.get_single()
				wards[el].admit(pt, wards[el], 0)
				patients.push(pt)
			}
		}

	})
	return {'wards': wards, 'patients': patients}
}


//function to build dropdown to toggle ward waiting time
function build_wait_time_dropdown(){
	var select = document.getElementById("wait-plot-list");
	ward_config.forEach(function(el){
		if(el.name != "Exit" & el.name != "Pool"){
			var opt = document.createElement('option');
			opt.value = el.name;
            opt.innerHTML = el.name;
            select.appendChild(opt);
		}
	})
}

function select_wait_plot_ward(){
	var select = document.getElementById("wait-plot-list");
	var ward = select.value
	var wait_plot = plotWaitingTimeFreq(window.prev_result.patients, ward, "waiting", 600, 300,"mean-wait-time")

}


//to investigate causes of delay
//may make opimisation too obvious for real use but makes dev easier
function delayed_by(patients){
	var delay_resource = []
	var delay_attn = []
	var all_pt = []
	patients.forEach(function(el){
		el.when_wait_met.forEach(function(wwm){
			if(wwm.delay > 0){
				if(wwm.attention > 0){
					delay_attn.push(wwm.current_ward)
				}
				if(wwm.resources > 0){
					delay_resource.push(wwm.current_ward)
				}
			}
			all_pt.push(wwm.current_ward)
		})
	})
	var res_count = strCount(delay_resource)
	var attn_count = strCount(delay_attn)
	var total_pt = strCount(all_pt)
	var res_norm = {}
	var attn_norm = {}	
	var wards = _.keys(total_pt)
	wards.forEach(function(el){
		res_norm[el] = res_count[el] / total_pt[el]
		attn_norm[el] = attn_count[el] / total_pt[el]
	})
	return {'res_count': res_count, 'res_norm': res_norm, 'attn_count': attn_count, 'attn_norm': attn_norm, 'total': total_pt}
}

function strCount(arr){
	var counts = {};

	for (var i = 0; i < arr.length; i++) {
	  var num = arr[i];
	  counts[num] = counts[num] ? counts[num] + 1 : 1;
	}
	return counts
}

function delay_table(patients){
	var delays = delayed_by(patients)
	var wards = _.keys(delays.total)
	var tbl = '' 
	tbl += '<thead><tr><th>Ward</th><th>Attention delays (count)</th><th>Attention delays (prop)</th><th>Resource delays (count)</th><th>Resource delays (prop)</th></tr></thead>'
	tbl += '<tbody>'
	for (var i = 0; i < wards.length; i++) {
		var w = wards[i]
		
		tbl += '<tr>'
		tbl += '<td>' + w + '</td>'
		tbl += '<td>' + delays.attn_count[w] + '</td>'
		tbl += '<td>' + delays.attn_norm[w].toFixed(2) + '</td>'
		tbl += '<td>' + delays.res_count[w] + '</td>'
		tbl += '<td>' + delays.res_norm[w].toFixed(2) + '</td>'
		tbl += '</tr>'
	}
	tbl += "</tbody>"
	$('#delay-table').html(tbl)
}

function reset_when_run(){
	return $('input[name=resume-mode-radios]:checked').val() == "reset"
}

function clear_performance_history(){
	window.performance_history = []
	var tbl = '' 
	tbl += '<thead><tr><th>Run</th><th>Under 4h (%)</th><th>Mean Emergency wait</th><th>Total Staff</th><th>Total capacity</th><th>Total resources</th><th>Total cost</th><th>Load</th></tr></thead>'
	tbl += '<tbody></tbody>'
	$('#history-table').html(tbl)
}

function update_performance_history(){
	var tbl = document.getElementById('history-table')
	var row = tbl.insertRow(-1) //position 0 will insert above the header
	//add the last result
	var run_num = window.performance_history.length - 1 
	var dt = window.performance_history[run_num]
	var c0 = row.insertCell(0)
	c0.innerText = window.run_number
	var c1 = row.insertCell(1)
	c1.innerText = dt.perc_under_4h.toFixed(2)
	var c2 = row.insertCell(2)
	c2.innerText = dt.mean_emergency_wait.toFixed(2)
	var c3 = row.insertCell(3)
	c3.innerText = dt.management.staff.amount
	var c4 = row.insertCell(4)
	c4.innerText = dt.management.capacity.amount
	var c5 = row.insertCell(5)
	c5.innerText = dt.management.resources.amount
	var c6 = row.insertCell(6)
	c6.innerText = dt.management.total_cost
	var c7 = row.insertCell(7)
	//c7.innerHTML = "<button onclick='load_previous_config(" + window.performance_history.length - 1 + ")'>Load</button>"
	c7.innerHTML = "<button onclick='load_previous_config(" + run_num + ")'>Load</button>"

}


function export_patients(patients, times){
	var configs = {}
	var ts = _.keys(times)
	ts.forEach(function(el){
		configs[el] = []
		times[el].forEach(function(pt_idx){
			configs[el].push(patients[pt_idx].export())
		})
	})
	return configs
}

function download_patients(patients, times){
	var config = export_patients(patients, times)
	var config_text = JSON.stringify(config)
	var blob = new Blob([config_text], {type: "text/plain;charset=utf-8"});
	saveAs(blob, 'patient_set.json.txt');
}

//quick convenience function to automatically download the definition of the previous run's patients
function download_previous_patients(){
	download_patients(window.prev_result.patients, window.prev_result.creation_times)
}

function preset_patients_set(){
	return $('input[name=patient-mode-radios]:checked').val() == "preset"
}

function copy_ward_config(config){
	var copy = []
	for (var i = 0; i < config.length; i++) {
		copy.push(Object.assign({},config[i]))
	}
	return copy
}

function load_previous_config(history_idx){
	var cfg = window.performance_history[history_idx].ward_config
	window.ward_config = cfg

	//refresh the ward editor
	show_config('Emergency')
}