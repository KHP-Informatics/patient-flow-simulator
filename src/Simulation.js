//classes for simulation

function Patient(config){
	this.required = {}
	this.required.wards = []//array where index 0 is A&E, ... , discharge
	this.required.waits = []
	this.required.resources = []
	this.required.attention = []
	this.to_export = []
	for(var k in config){
		this.required[k] = config[k]
		this.to_export.push(k)
	}
	this.required.progress = -1
	this.required.in_required_ward = false
	this.observed = {}
	this.observed.wards = []
	this.observed.entry_times = []
	this.observed.resources = []
	this.observed.attention = []
	this.when_wait_met = [] //the other remaining needs of the patient when their wait limit was met
	this.last_move_time = 0
	this.can_move = true
	this.target = this.required.wards[0]
	this.id = ""
	this.current_ward = ""
	this.target_resource_required = 0 //what are the resource needs for this patient in the next ward they have to visit. Used for priority queues.
	this.wait_met_logged = false //flag to ensure other needs are only logged once when wait met

	//export parameters for this patient so they can be saved and recreated
	//the returned object can be used with p = new Patient(cfg) to get this patient back
	this.export = function(){
		var cfg = {}
		for (var i = 0; i < this.to_export.length; i++) {
			var k = this.to_export[i]
			cfg[k] = this.required[k]
		}
		return cfg
	}

	//move to a new ward
	this.move = function(destination, time){
		this.observed.wards.push(destination.name)
		this.observed.entry_times.push(time)
		this.observed.resources.push(0)
		this.observed.attention.push(0)
		this.current_ward = destination

		//update timestamp
		this.last_move_time = time

		//reset ability to move
		this.can_move = false

		//reset flag for logging remaining needs
		this.wait_met_logged = false

		//has the patient moved into a required ward
		if(destination.name == this.required.wards[this.required.progress + 1]){
			this.required.progress += 1
			this.required.in_required_ward = true
			this.target = this.required.wards[this.required.progress + 1]
		} else {
			this.required.in_required_ward = false
		}

		//set resource needs for next target ward
		this.target_resource_required = this.required.resources[this.required.progress + 1]
	}

	this.consume_resources = function(amount){
		this.observed.resources[this.observed.resources.length - 1] += amount
	}

	this.consume = function(what, amount){
		this.observed[what][this.observed[what].length - 1] += amount
	}

	this.resource_need_remaining = function(){
		var amount = 0;
		if(this.required.in_required_ward){
			amount = this.required.resources[this.required.progress] - this.observed.resources[this.observed.resources.length-1]
		} 
		return amount;
	}

	this.need_remaining = function(what){
		var amount = 0;
		if(this.required.in_required_ward){
			amount = this.required[what][this.required.progress] - this.observed[what][this.observed[what].length-1]
		} 
		return amount;
	}

	this.update = function(time){
		//set target for next move
		//this is only necessary in the very first step
		//this.target = this.required.wards[this.required.progress + 1]

		//could the patient be transferred
		
		if(this.required.in_required_ward){
			//the observed resources per ward is not only required wards.
			//the last element is always the current ward
			var delta_wait = time - this.last_move_time
			if(isNaN(parseFloat(this.required.waits[this.required.progress]))){
				var wait_need_met = false
			} else{
				var wait_need_met = delta_wait >= this.required.waits[this.required.progress]
			}
			var resource_need_remaining = this.required.resources[this.required.progress] - this.observed.resources[this.observed.resources.length-1]
			var resource_needs_met = resource_need_remaining <= 0
			var attn_remaining = this.need_remaining('attention')
			var attention_needs_met = attn_remaining <= 0
			// if(this.required.in_required_ward){
			// 	console.log("id:", this.id,"attention met:", attention_needs_met, "wait met:", wait_need_met, "resource met", resource_needs_met)
			// }

			//state of other needs the first time wait need is met
			if(wait_need_met && !this.wait_met_logged){
				var other_needs = {}
				other_needs['current_ward'] = this.current_ward.name
				other_needs['target_ward'] = this.target
				other_needs['attention'] = attn_remaining
				other_needs['resources'] = resource_need_remaining
				other_needs['time_wait_met'] = time
				//are other needs met at the time the wait need is met
				//i.e. are pt moving as quickly as possible
				//ideally wouldn't separately calculate this here but avoids complicating can_move block
				other_needs['can_move'] = (attn_remaining <=0 && resource_need_remaining <= 0)
				this.when_wait_met.push(other_needs)
				this.wait_met_logged = true
			}

			if(wait_need_met && resource_needs_met && attention_needs_met){
				this.can_move = true
				var idx = this.when_wait_met.length - 1
				this.when_wait_met[idx]['time_others_met'] = time
				this.when_wait_met[idx]['delay'] = time - this.when_wait_met[idx]['time_wait_met']
			} else {
				this.can_move = false
			}

			
		} else {
			//can always move if not in a required ward
			this.can_move = true
		} 

	}


}

// ward queue API must have .add, .length and .next methods
// queues must not insert Patient objects that they already contain
function SimpleQueue(max_size){
	this.q = []
	this.max_size = max_size
	this.add = function(el){
		if(this.q.length < this.max_size & this.q.indexOf(el) == -1){
			this.q.push(el)
			return true
		} else {
			return false
		}
	}
	this.next = function(){
		var el = this.q.shift()
		return el;
	}
	this.length = function(){
		return this.q.length
	}
}

//a wrapper around FastPriorityQueue to work with Patient objects
//and conform to the Queue API expected by Ward objects
function MaxPQ(max_size){
	this.l = 0
	this.max_size = max_size
	this.q = new FastPriorityQueue(function (a, b) {
        return a.target_resource_required > b.target_resource_required;
    });

    this.add = function(el){
		if(this.l < this.max_size & this.q.array.indexOf(el) == -1){
			this.q.add(el)
			this.l += 1
			return true
		} else {
			return false
		}
    }
    this.next = function(){
    	var el = this.q.poll()
    	this.q.trim() //slower but required because of the internal structure of the FastPriorityQueue - nodes aren't always removed unless graph is trimmed
    	this.l -= 1
    	return el;
    }
    this.length = function(){
    	return this.l;
    }
}

//at the moment a minPQ is ok because transfers to free space don't use queues. If this is ever changed,
//a minPQ would produce weird behaviour because patients transferred to wards just to free space
//have resource requirement zero, so will always come first but will still consume resources in practice. 
function MinPQ(max_size){
	this.l = 0
	this.max_size = max_size
	this.q = new FastPriorityQueue(function (a, b) {
        return a.target_resource_required < b.target_resource_required;
    });

    this.add = function(el){
		if(this.l < this.max_size & this.q.array.indexOf(el) == -1){
			this.q.add(el)
			this.l += 1
			return true
		} else {
			return false
		}
    }
    this.next = function(){
    	var el = this.q.poll()
    	this.q.trim() //slower but required because of the internal structure of the FastPriorityQueue - nodes aren't always removed unless graph is trimmed
    	this.l -= 1
    	return el;
    }
    this.length = function(){
    	return this.l;
    }
}

function Ward(config){
	//properties
	/*
	config must define
		capacity = (Int) max number of patients
		resources = (any number) resources available per simulation step
		attention = (any number) staff available per simulation step
		name = (string) name of ward
		resource_distribution = "divide_evenly",
		accept_overflow = "always" or "never"
		queue_policy = "MaxPQ", "MinPQ" or "SimpleQueue"
	*/
	//defaults for values that should be in config
	this.capacity = 1 
	this.resources = 1
	this.attention = 1
	this.name = ""
	this.resource_distribution = "divide_evenly"
	this.accept_overflow = "always"
	for(var k in config){
		this[k] = config[k]
	}

	//internal values not set by config
	// no limit on number of patient who can wait elsewhere to get in
	this.create_queue = function(){
		if(this.queue_policy == "MaxPQ"){
		this.entry_queue = new MaxPQ(Infinity)
		} else if(this.queue_policy == "MinPQ"){
			this.entry_queue = new MinPQ(Infinity)
		} else {
			this.entry_queue = new SimpleQueue(Infinity)
		}
	}

	this.create_queue()
	this.admitted = []
	this.at_capacity = false

	//functions
	this.update_config = function(config){
		for(var k in config){
			this[k] = config[k]
		}
		var old_queue = this.entry_queue
		this.create_queue()
		//put any patients back on the queue
		//correct order will be established by the new queue
		while(old_queue.length() > 0){
			this.add_to_queue(old_queue.next())
		}
	}

	this.admit = function(patient, here, time){
		if(this.admitted.length < this.capacity){
			patient.move(here, time)
			this.admitted.push(patient)
			this.at_capacity = this.admitted.length == this.capacity
			return true
		}
		return false
	}
	this.add_to_queue = function(patient){
		this.entry_queue.add(patient)
	}
	this.admit_from_queue = function(here, time){
		var moved_count = 0
		while(!this.at_capacity & this.entry_queue.length() > 0){
			moved_count++ //need to do this before calling admit because admit changes at_capacity
			var p = this.entry_queue.next()
			//console.log("admit from queue: moving patient id",p.id,"from",p.current_ward.name,"to",this.name)
			p.current_ward.discharge(p)
			this.admit(p, here, time)
		}
		
		return moved_count
	}
	//admit a patient from wherever they are now
	//allows transfers to free space and also queue-jumping since this.input_queue is not checked
	//this will create errors if patient is actually in the input_queue
	this.admit_from = function(patient, here, time){
		if(this.admitted.length < this.capacity){
			//console.log("admit from ward: moving patient id",patient.id,"from",patient.current_ward.name,"to",this.name)
			patient.current_ward.discharge(patient)
			this.admit(patient, here, time)
			return true
		} else {
			return false
		}
	}
	this.discharge = function(patient){
		this.admitted.remove(patient)
		this.at_capacity = false
	}


	//spend any resource
	this.spend = function(what, amount){
		var policy = this.resource_distribution
		var available = this[what]

		if(policy == "divide_evenly"){
			var amount_per_patient = available/this.admitted.length
			this.admitted.forEach(function(el){
				el.consume(what, amount_per_patient)
			})
		} else if(policy == "lowest_first"){
			this.admitted.sort(function(a, b) {
				var remaining_A = a.need_remaining(what); 
				var remaining_B = b.need_remaining(what);
				if (remaining_A < remaining_B) {
					return -1;
				}
				if (remaining_A > remaining_B) {
					return 1;
				}

				// names must be equal
				return 0;
			});	
			
			this.admitted.forEach(function(el){
				var p_need = el.need_remaining(what)
				var p_gets = Math.min(available, p_need)
				available -= p_gets
				el.consume(what, p_gets)
			})

		} else if(policy == "highest_first" || policy == "biased_highest_first"){
			this.admitted.sort(function(a, b) {
				var remaining_A = a.need_remaining(what); 
				var remaining_B = b.need_remaining(what);
				if (remaining_A > remaining_B) {
					return -1;
				}
				if (remaining_A < remaining_B) {
					return 1;
				}

				// names must be equal
				return 0;
			});	
			if(policy == "highest_first"){
				//strictly highest need first, many patients likely to get nothing
				//only really useful as an example, not realistic
				this.admitted.forEach(function(el){
					var p_need = el.need_remaining(what)
					var p_gets = Math.min(available, p_need)
					available -= p_gets
					el.consume(what, p_gets)
				})
			} else if(policy == "biased_highest_first"){
				//biased highest-first
				//every patients gets a baseline amount, plus extra based on need
				var base_prop = 0.5 // proportion of available resource that is always shared between all pt
				var base_amount = (available * base_prop) / this.admitted.length
				var available_biased = (available * base_prop)
				var initial_value = 0
				var total_need = this.admitted.reduce(function(accumulator, current_pt) {
				  return accumulator + current_pt.need_remaining(what);
				}, initial_value);

				this.admitted.forEach(function(el){
					var p_need = el.need_remaining(what)
					var p_gets = available_biased * (p_need / total_need)
					p_gets += base_amount
					el.consume(what, p_gets)
				})
			}
			
		} 
	}
	this.will_accept_overflow = function(){
		if(this.accept_overflow == "always"){
			return true
		} else if (this.accept_overflow == "never"){
			return false
		}
	}

}

//generate patients
function PatientGenerator(config){
	//defaults for properties set in config
	this.config = config
	this.config.wait_limits.Exit = {
		 	min: Infinity,
		 	max: Infinity,
		 }
	//internal properties
	this.patients_created = 0


	this.get = function(){
		//var n_patients_arriving = getRandomInt(this.config.batch_arrival_min,this.config.batch_arrival_max)
		var n_patients_arriving = poisson(this.config.batch_arrival_lambda)
		n_patients_arriving = clamp(n_patients_arriving, this.config.batch_arrival_min, this.config.batch_arrival_max)
		var created = []
		for (var i = 0; i < n_patients_arriving; i++) {
			np = this.get_single()
			if(np != false){
				created.push(np)
			} 
		}
		return created
	}

	this.get_single = function(){
		if(this.patients_created < this.config.max_patients){
			var visit_data = this.generate_sequence()
			np = new Patient(visit_data)
			np.id = this.patients_created
			this.patients_created += 1
		} else {
			np = false
		}
		return np
	}

	this.generate_sequence = function(){
		var n_transfers = 0
		var current_ward = this.config.initial_ward
		var ward_sequence = [current_ward]
		var current_wait = this.generate_wait(current_ward)
		var wait_sequence = [current_wait] // should be generated
		var current_resource = this.generate_resource(current_ward)
		var current_attention = this.generate_attention(current_ward)
		var resource_sequence = [current_resource] // should be generated
		var attention_sequence = [current_resource] // should be generated
		while(n_transfers < this.config.max_transfers & current_ward != "Exit"){
			current_ward = this.get_next_ward(current_ward)
			ward_sequence.push(current_ward)
			//these should be generated
			wait_sequence.push(this.generate_wait(current_ward))
			resource_sequence.push(this.generate_resource(current_ward))
			attention_sequence.push(this.generate_attention(current_ward))
			n_transfers += 1
		}
		//if we exited because we reached the max number of transfers, add exit on the end
		if(current_ward != "Exit"){
			current_ward = "Exit"
			ward_sequence.push(current_ward)
			//these should be generated
			wait_sequence.push(this.generate_wait(current_ward))
			resource_sequence.push(this.generate_resource(current_ward))
			attention_sequence.push(this.generate_attention(current_ward))
		}
		return {wards: ward_sequence, waits: wait_sequence, resources: resource_sequence, attention: attention_sequence}
	}

	this.get_next_ward = function(ward){
		var rn = Math.random(), sum = 0, next = ""
		var poss_targets = this.config.transfer_probability[ward]
		for(var i = 0; i < poss_targets.length; i++){
			sum += poss_targets[i]['weight']
			if(rn <= sum){
				next = poss_targets[i]['name']
				break
			}
		}
		if(next == ""){
			console.log("no next ward found from ", ward)
			console.log("poss_targets", poss_targets)
			console.log("rn", rn, 'sum', sum)
		}
		return next
	}

	this.generate_resource = function(ward, type){
		var limits = this.config.resource_limits[ward]
		var r = 0
		if(ward == "Pool" || ward == "Exit"){
			r = getRandomInt(limits.min, limits.max)
		} else {
			r = poisson(limits.lambda)
		}
		return r;
	}

	this.generate_attention = function(ward){
		var limits = this.config.attention_limits[ward]
		var r = 0
		if(ward == "Pool" || ward == "Exit"){
			r = getRandomInt(limits.min, limits.max)
		} else {
			r = poisson(limits.lambda)
		}
		return r;
	}

	this.generate_wait = function(ward){
		var limits = this.config.wait_limits[ward]
		var r = 0
		if(ward == "Pool" || ward == "Exit"){
			r = getRandomInt(limits.min, limits.max)
		} else {
			r = poisson(limits.lambda)
		}
		return r;
	}
}

//same API as PatientGenerator but returns preset patients for each time step
function PresetPatientGenerator(config){
	this.time_to_patients = config
	//internal properties
	this.patients_created = 0
	this.current_time_idx = 0
	this.creation_times = _.keys(config).map(Number).sort(sortNumber)

	this.get = function(now){
		//call repeatedly to iterate through creation times in order
		//times may not be consistent with model times, e.g. if there is a jump between times in the config
		var created = []
		if(typeof now == "undefined"){
			now = this.creation_times[this.current_time_idx]
			this.current_time_idx += 1
		}
		this.time_to_patients[now].forEach(function(el){
			np = new Patient(el)
			created.push(np)
			this.patients_created += 1
		})

		return created
	}

	this.get_at = function(now){
		//get patients for a given simulation time
		this.time_to_patients[now].forEach(function(el){
			np = new Patient(el)
			created.push(np)
			this.patients_created += 1
		})
		return created
	}

}

/*
* Utility functions
* Used by the simulation classes or performing some basic calculations on them
* Some utilities modify object prototypes, e.g. Array
*/

// based Array Remove by John Resig which is MIT Licensed
Array.prototype.remove = function(element) {
	var from = this.indexOf(element)
	if(from > -1){
		  var rest = this.slice(from + 1 || this.length);
	  this.length = from < 0 ? this.length + from : from;
	  return this.push.apply(this, rest);
	} else {
		//console.log("ERROR",element,"not found in array")
		//return this
		 throw new ReferenceError('Element not found in array');

	}

};

function calculateWaitingTimes(patients){
	patients.forEach(function(el){
		el.observed.waits = {}
		el.observed.waits_arr = []
		el.observed.wards.forEach(function(w){
			el.observed.waits[w] = []
		})
		for (var i = 0; i < el.observed.wards.length - 1; i++) {
			var delta = el.observed.entry_times[i+1] - el.observed.entry_times[i]
			el.observed.waits[el.observed.wards[i]].push(delta)
			el.observed.waits_arr.push(delta)
		}
	})
}

//for sorting numeric arrays correctly
function sortNumber(a,b) {
    return a - b;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//count the number of times each value in arr is present
//results returned in SORTED order
function arrayCount(arr) {
    var a = [], b = [], prev;

    arr.sort(sortNumber);
    for ( var i = 0; i < arr.length; i++ ) {
        if ( arr[i] !== prev ) {
            a.push(arr[i]);
            b.push(1);
        } else {
            b[b.length-1]++;
        }
        prev = arr[i];
    }

    return {'values':a, 'counts':b};
}

function visitCounts(patients, ward){
	var all_visit_waits = []
	patients.forEach(function(el){
		if(el.observed.waits.hasOwnProperty(ward)){
			all_visit_waits = all_visit_waits.concat(el.observed.waits[ward])
		}
	})
	var counts = arrayCount(all_visit_waits)
	return counts
}

//delays are only logged for required wards
//for all patients ever admitted to ward who were required to be there
//how long where they delayed relative to the minumum time they had to spend there
function delayCounts(patients, ward){
	var all_visit_delays = []
	patients.forEach(function(el){
		el.when_wait_met.forEach(function(wwm){
			if(wwm.current_ward == ward){
				all_visit_delays.push(wwm.delay)
			}
		})
	})
	var counts = arrayCount(all_visit_delays)
	return counts
}

function cumulativeDistribution(patients, ward){
	var counts = visitCounts(patients, ward)
	var cumulative = [counts['counts'][0]]
	for (var i = 1; i < counts['counts'].length; i++) {
		cumulative.push(counts['counts'][i] + cumulative[i-1])
	}
	var total_visits = cumulative[cumulative.length - 1]
	points = []
	for (var i = 0; i < counts['counts'].length; i++) {
		points.push({'x': counts['values'][i], 'y': cumulative[i] / total_visits})
	}
	result = {"cumulative": points}
	return result
}

//waiting time in Emergency ward vs target
function emergencyWaitVsTarget(patients, target){
	var n_patients = patients.length
	var target_met = 0
	patients.forEach(function(el){
		var emergency_wait = el.observed.entry_times[2] - el.observed.entry_times[1]
		if(emergency_wait <= target){
			target_met += 1
		}
	})
	var percent_on_target = (target_met/n_patients)*100.0
	return percent_on_target
}

//generate random numbers from Poisson distribution
function poisson(lambda){ 
	var L = Math.exp(-lambda);
	var p = 1.0;
	var k = 0;
	 
	do {
	    k++;
	    p *= Math.random();
	} while (p > L);
	 
	return(k - 1);
}

//median of array
function median(values) {
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if(values.length % 2){
        return values[half];
    }
    else {
        return (values[half-1] + values[half]) / 2.0; //-1 as 0-based
    }
}

//clamp utility
function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
};
