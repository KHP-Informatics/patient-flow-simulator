//initialise cytoscape and return a reference to the graph instance
//creates a GLOBAL cy object so GUI can control it
initialise_graph = function(container){
	cy = cytoscape({
	  container: document.querySelector('#' + container),
	    
	  boxSelectionEnabled: false,
	  autounselectify: true,
	  minZoom: 0.5,
	  maxZoom: 10,
	  //zoomingEnabled: false,
	  //panningEnabled: false,
	  
	  style: cytoscape.stylesheet()
	    .selector('node')
	      .css({
	        'content': 'data(name)',
	        'text-valign': 'center',
	        'border-width': 1,
	        'background-color': "#FFF",
	        'border-color': 'data(fill_colour)',
	        'width': 'mapData(centrality, 0, 1, 10, 100)',
	        'height': 'mapData(centrality, 0, 1, 10, 100)'
	      })
	    .selector('edge')
	      .css({
	        'curve-style': 'bezier',
	        'target-arrow-shape': 'triangle',
	        'target-arrow-color': 'data(fill_colour)',
	        'line-color': 'data(fill_colour)',
	        'width': 'mapData(weight, 0, 1, 1, 20)'
	      })
	    .selector(':selected')
	      .css({
	        'background-color': 'black',
	        'line-color': 'black',
	        'target-arrow-color': 'black',
	        'source-arrow-color': 'black'
	      })
	    .selector('.faded')
	      .css({
	        'opacity': 0.25,
	        'text-opacity': 0
	      })
	});

	cy.on('tap', 'node', function(e){
	  var node = e.cyTarget; 
	  var neighborhood = node.neighborhood().add(node);
	  
	  cy.elements().addClass('faded');
	  neighborhood.removeClass('faded');
	});

	cy.on('tap', function(e){
	  if( e.cyTarget === cy ){
	    cy.elements().removeClass('faded');
	  }
	});

	return cy
}


/*
* analysis functions
*/


//type: one of "total" (default), "indegree", "outdegree"
function degree(type){
	type = type == undefined ? 'total' : type	 
	var nodes = cy.nodes()
	var centralities = {}
	var max = 0
	for (var i = 0; i < nodes.length; i++) {
		var id = "#" + nodes[i].id()
		var c = cy.$().dc({ root: id, directed: true })
		c['total'] = c.indegree + c.outdegree
		centralities[i] = c[type]
		if(centralities[i] > max){
			max = centralities[i]
		}
	}
	//normalise to 0:1
	for(var i = 0; i < nodes.length; i++) {
		nodes[i].data('centrality', centralities[i]/max)
	}
}

function betweenness(){
	var bc = cy.$().bc({directed:true})
	var nodes = cy.nodes()
	var centralities = {}
	var max = 0
	for (var i = 0; i < nodes.length; i++) {
		var id = "#" + nodes[i].id()
		var c = bc.betweenness(id)
		centralities[i] = c
		if(centralities[i] > max){
			max = centralities[i]
		}
	}
	//normalise to 0:1
	for(var i = 0; i < nodes.length; i++) {
		nodes[i].data('centrality', centralities[i]/max)
	}
}

//type: "unweighted" (default), "weighted"
function closeness(type){
	type = type == undefined ? "unweighted" : type
	var nodes = cy.nodes()
	var centralities = {}
	var max = 0
	for (var i = 0; i < nodes.length; i++) {
		var id = "#" + nodes[i].id()
		if(type == "unweighted"){
			var c = cy.$().cc({ root: id, directed: true })
		} else {
			//not correct
			var c = cy.$().cc({ root: id, directed: true, weight: function(){
				return 1 - this.data('weight')
				} 
			})
		}
		
		centralities[i] = c
		if(centralities[i] > max){
			max = centralities[i]
		}
	}
	//normalise to 0:1
	for(var i = 0; i < nodes.length; i++) {
		nodes[i].data('centrality', centralities[i]/max)
	}
}

function reset_style(){
	var nodes = cy.nodes()
	for(var i = 0; i < nodes.length; i++) {
		nodes[i].data('centrality', 0.5)
	}
}

/*
* generate networks from patient data
*/
//build a graph from patient trajectories
function buildTransferGraph(patients, wards, container){
	var cy = initialise_graph(container)

	//create a node for each ward
	var id_to_name = {}
	var name_to_id = {}
	var id_to_fill = {}
	var id = 0
	all_nodes = []
	for(var k in wards){
		var this_node_id = "n" + id
		var this_node_name = wards[k].name
		var col = wards[k].fill_colour
		if(this_node_name != "Pool"){
			id += 1
			all_nodes.push( {group: "nodes", data: { id: this_node_id, name: this_node_name, fill_colour: col, centrality: 0.5}} )
			id_to_name[this_node_id] = this_node_name
			name_to_id[this_node_name] = this_node_id
			id_to_fill[this_node_id] = col
		}
	}

	//calculate edge weights
	var weights_ST = {}
	var total_tfs = 0
	patients.forEach(function(el){
		var ward_seq = el.observed.wards
		for (var i = 0; i < ward_seq.length - 1; i++) {
			var edge_is_new = true
			var s_id = name_to_id[ward_seq[i]]
			var t_id = name_to_id[ward_seq[i+1]]
			//any nodes that were ignored for whatever reason will be undefined in the ID lookup
			if(s_id != undefined & t_id != undefined){
				if(weights_ST.hasOwnProperty(s_id)){
					if(weights_ST[s_id].hasOwnProperty(t_id)){
						weights_ST[s_id][t_id] += 1
					} else {
						weights_ST[s_id][t_id] = 1
					}
				} else {
					weights_ST[s_id] = {t_id: 1}
				}
				total_tfs += 1
			}
			
		}
	})
	//normalise to proportion of all transfers then scale to range 0-1
	//scaling to range 0-1 means that (at least) one edge will be the max size defined in the cytoscape css config
	//normalise
	var max_weight = 0
	for(var s in weights_ST){
		for(var t in weights_ST[s]){
			weights_ST[s][t] = weights_ST[s][t] / total_tfs
			if(weights_ST[s][t] > max_weight){
				max_weight = weights_ST[s][t]
			} 
		}
	}
	//scale
	for(var s in weights_ST){
		for(var t in weights_ST[s]){
			weights_ST[s][t] = weights_ST[s][t] / max_weight
		}
	}

	//create directed edges
	all_edges = []
	seen_ST = {} //seen edges as {source : [targets], }
	patients.forEach(function(el){
		var ward_seq = el.observed.wards
		for (var i = 0; i < ward_seq.length - 1; i++) {
			var edge_is_new = true
			var s_id = name_to_id[ward_seq[i]]
			var t_id = name_to_id[ward_seq[i+1]]
			//any nodes that were ignored for whatever reason will be undefined in the ID lookup
			if(s_id != undefined & t_id != undefined){
				if(seen_ST.hasOwnProperty(s_id)){
					if(seen_ST[s_id].indexOf(t_id) == -1){
						seen_ST[s_id].push(t_id)
					} else {
						edge_is_new = false
					}
				} else {
					seen_ST[s_id] = [t_id]
				}

				if(edge_is_new){
					var this_edge_weight = weights_ST[s_id][t_id]
					var fill = id_to_fill[s_id]
					all_edges.push({ group: "edges", data: { source: s_id, target: t_id, weight: this_edge_weight, fill_colour: fill }})
				}
			}

		}
	})
	console.log(all_nodes)
	console.log(all_edges)
	cy.load({
			nodes: all_nodes,
			edges: all_edges
		})
	// var options = {
 // 	 name: 'breadthfirst'
 // 	}
 	//var options = {name:'cose',  idealEdgeLength: function( edge ){ return 100; }, randomize: true, animate:false}
	var options = {name:'circle'}
	cy.layout(options)
}


//show the transfer probabilities definied in the patient config as a network
function buildProbabilityGraph(patient_config, container){
	var cy = initialise_graph(container)
	//create a node for each ward
	var name_to_id = {}
	var id = 0
	var all_nodes = []
	var all_edges = []
	var srcnodes = Object.keys(patient_config.transfer_probability)

	srcnodes.forEach(function(name){
		var this_node_id = "n" + id
		id += 1
		name_to_id[name] = this_node_id
		
		patient_config.transfer_probability[name].forEach(function(t){
			var tgtname = t.name
			this_node_id = "n" + id
			id += 1
			name_to_id[tgtname] = this_node_id
		})	
	})

	var all_node_names = Object.keys(name_to_id)
	all_node_names.forEach(function(name){
		all_nodes.push( {group: "nodes", data: { id: name_to_id[name], name: name, fill_colour: '#ccc', centrality: 0.5}} )
	})
	
	//edges
	srcnodes.forEach(function(name){
		var src_id = name_to_id[name]
		patient_config.transfer_probability[name].forEach(function(t){
			var tgt_name = t.name
			var tgt_id = name_to_id[tgt_name]
			all_edges.push({ group: "edges", data: { source: src_id, target: tgt_id, weight: t.weight, fill_colour: '#ccc' }})
		})
	})

	cy.load({
			nodes: all_nodes,
			edges: all_edges
		})
	// var options = {
 // 	 name: 'breadthfirst'
 // 	}
 	//var options = {name:'cose',  idealEdgeLength: function( edge ){ return 100; }, randomize: true, animate:false}
	var options = {name:'circle'}
	cy.layout(options)
}