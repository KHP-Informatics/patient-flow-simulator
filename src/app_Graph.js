/*
### Copyright 2014 Dan Bean
###
### This program is free software: you can redistribute it and/or modify
### it under the terms of the GNU Lesser General Public License as published by
### the Free Software Foundation, either version 3 of the License, or
### (at your option) any later version.
###
### This program is distributed in the hope that it will be useful,
### but WITHOUT ANY WARRANTY; without even the implied warranty of
### MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
### GNU Lesser General Public License for more details.
###
### You should have received a copy of the GNU Lesser General Public License
### along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
interactive app for construction of binary networks
@author dmb57

Duplicate edges ARE allowed

TODO
-allow edge label to be mapped to interaction type?
-allow edge colour to be mapped to interaction type?
-allow node size to be mapped to degree/ set arbitrarily by the user?
-directed vs undirected - checkbox to select which?
	-would need to determine direction from interaction data somehow?
	-would need to add to addFromInt() in getInteractions.js


*/

//set up global variables
window.nmode = true;
window.editingEnabled = true;
window.sourcenode = -1; //will track the id of the source node in edge creation
window.sourcetype = -1; //will track the type of the course node in edge creation
window.ntype = "place" //type of node to be added
window.etype = "normal" //type of edge to be added
window.nodecounter = 0; //to keep track of the number of nodes that have been created

//window.currentNwName is set up by cytoscape onload
window.workingID = "none"; //the ID to use for the current stack when saving. If "none" then we are starting a new stack and will be given an ID to use

//network data stack
window.stack = {}
window.stack['metadata'] = {} //to keep track of stack-level properties e.g. number of nodes
window.stack.metadata['nodecounter'] = 0;
window.stack.metadata['edgecounter'] = 0; //keep track of the number of edges that have been created - otherwise if you delete edges you can't add new ones any more
//call the place and transition trackers the same as window.ntype so that can be used to access the correct data
window.stack.metadata['place'] = {}; //object for all stack place names to keep track of adding disperse places
window.stack.metadata['transition'] = {}; //object for all transition names to prevent duplicates - could use a list? this way they're accessed the same as pnames
//trackers for place classes. Entries only exist of they are not default (normal place with no classes)
window.stack.metadata['contains'] = {} //what places are a sub class of each coarse place
window.stack.metadata['isa'] = {} //what coarse places each node is a sub class of
//keep track of disperse places
window.stack.metadata['disperse'] = {} //keyed by disperse place NAME -> network: [id(s)]
//keep track of parameter k - for compatibility with models, this will never be used for diagrams
window.stack.metadata['k'] = {} //keyed by place NAME -> k (if a name is not a key for this network we know k is 1)
//citations for elements
window.stack.metadata.citations = {}; //keyed by element id -> [pmid]
//experimental system type
window.stack.metadata.systems = {} //keyed by edge id -> [systems]





$('#cy').cytoscape({
showOverlay: false, //turn off the cytoscape.js text in the bottom right
boxSelectionEnabled: false, //turn off click and drag


  layout: {
    name: 'preset', //must be 'preset' for 2.3.0+
    //ready: loadNet(TOPLEVEL)
  },
	maxZoom: 4,
	minZoom: 0.1,
  
  style: cytoscape.stylesheet()
    .selector('node')
      .css({
      	'color': '#000000',
        'content': 'data(name)',
        'text-valign': 'center',
        'background-color': '#FFFFFF',
        'border-width': 1,
        'border-color': '#707070'
      })
    .selector('node.nolabel')
    	.css({
    		'content': ''
    	})
	.selector('node.disperse')
      .css({
        'border-width': 2,
        'border-color': '#2980b9'
      })
      .selector('node.input2')
      .css({
        'border-width': 2,
        'background-color': '#FF99CC'
      })
      .selector('node.interactorsinput2')
      .css({
        'border-width': 2,
        'background-color': '#CC66FF'
      })
      .selector('node.input3')
      .css({
        
      })
      .selector('node.interactorsinput3')
      .css({
        
      })
	.selector('node.contains')
      .css({
		  'background-color':'#e67e22'
      })
	  .selector('node.coarsetransition')
      .css({
		  'border-width': 2,
		  'border-color':'#27ae60'
      })
    .selector('node:selected')
      .css({
        'border-width': 3,
		'background-color': '#f1c40f'
      })

      .selector('node.inPath')
 		.css({'background-color': '#FF0000',
 			'width': '50',
             'height': '50',
 		})

 		.selector('node.inPath2')
 		.css({'background-color': '#FF00FF',
 			'width': '50',
             'height': '50',
 		})
	
	  .selector('node.resize')
       .css({
             'width': 'data(score)',
             'height': 'data(score)',
        })
		
		.selector('node.excluded')
		.css({'background-color': '#5F9EA0',
		})

    .selector('edge')
      .css({ 
        // content: 'data(multiplicity)', // maps node label to data.label
        'width': 3,
        'line-color': '#000'
      }) 
	.selector('edge:selected')
      .css({ 
	  'width':3,
        'line-color': '#f1c40f', 
		'source-arrow-color': '#f1c40f',
        'target-arrow-color': '#f1c40f' 
      }) 
      
    .selector('edge.directed')
      .css({
        'target-arrow-shape': 'triangle',
		 'source-arrow-color': '#000000',
        'target-arrow-color': '#000000' 
      })

    .selector('edge.genetic')
    	.css({
    		'line-color': '#006c15',
			'source-arrow-color': '#006c15',
        'target-arrow-color': '#006c15'
    	})
    .selector('edge.physical')
    	.css({
    		'line-color': '#de7b09',
			'source-arrow-color': '#de7b09',
        'target-arrow-color': '#de7b09' 
    	})
    .selector('edge.suppressible')
    	.css({
    		'line-color': '#B22400',
			'source-arrow-color': '#B22400',
        'target-arrow-color': '#B22400' 
    	})
    .selector('edge.enhanceable')
    	.css({
    		'line-color': '#2980b9',
			'source-arrow-color': '#2980b9',
        'target-arrow-color': '#2980b9' 
    	})
    .selector('edge.complex')
    	.css({
    		'line-color': '#6E2D96',
			'source-arrow-color': '#6E2D96',
        'target-arrow-color': '#6E2D96'
    	})
    .selector('edge.drug')
    	.css({
    		'line-color': '#000099',
			'source-arrow-color': '#000099',
        'target-arrow-color': '#000099'
    	})
    	
    	.selector('edge.excluded')
    	.css({'line-color': '#5F9EA0',
    	})

		.selector('edge.inPath')
 		.css({'line-color': '#FF0000',
 			'source-arrow-color': '#FF0000',
        	'target-arrow-color': '#FF0000', 
 			'width': 7
 			})
		.selector('edge.inPath2')
 		.css({'line-color': '#FF00FF',
 			'source-arrow-color': '#FF00FF',
        	'target-arrow-color': '#FF00FF', 
 			'width': 7
 		}),

  


  ready: function(){
  	console.log('binary builder app loaded')
    var cy = this;
	//if we have been given a project id, load that project
	if(window.esynOpts.projectid != -1 || window.esynOpts.publishedid != -1){
		load_from_server()	
	} else {
		//otherwise we are starting a new prject, give the network a default name
		
		window.currentNwName = getDefaultNwName();
		document.getElementById('nw_name').value = window.currentNwName;

		//generate a network if requested
		if(window.esynOpts.query != -1){
			console.log('generate network')
			window.esynOpts.includeInteractors = JSON.parse(window.esynOpts.includeInteractors)
			window.esynOpts.query = decodeURIComponent(window.esynOpts.query)
			//set the dropdowns in the get interactions tool for convenience
			//setItneractionOptions(window.esynOpts)

			if(window.esynOpts.source == 'biogrid'){
				console.log('using biogrid as source')
				if(window.esynOpts.interactionType == '-1' || window.esynOpts.interactionType == 'any'){
					console.log('any edge type')
					var nwname = 'Generated interation network';
					window.currentNwName = nwname;
					document.getElementById('nw_name').value = window.currentNwName;
					fromBiogrid(window.esynOpts.query.split("|"),window.esynOpts.organism,window.esynOpts.includeInteractors,false,'json','any', window.esynOpts.throughput, nwname, addFromBiogrid)
				}
				 else if(window.esynOpts.interactionType == 'genetic'){
					//for now only load the genetic edges, in the future load everything but hide the physical edges
					console.log('only genetic edges')
					var nwname = 'Generated genetic interation network';
					window.currentNwName = nwname;
					document.getElementById('nw_name').value = window.currentNwName;
					fromBiogrid(window.esynOpts.query.split("|"),window.esynOpts.organism,window.esynOpts.includeInteractors,false,'json','genetic', window.esynOpts.throughput, nwname, addFromBiogrid)
				}
				else if (window.esynOpts.interactionType == 'physical') {
					//for now only load the genetic edges, in the future load everything but hide the genetic edges
					console.log('only physical edges')
					var nwname = 'Generated physical interation network';
					window.currentNwName = nwname;
					document.getElementById('nw_name').value = window.currentNwName;
					fromBiogrid(window.esynOpts.query.split("|"),window.esynOpts.organism,window.esynOpts.includeInteractors,false,'json','physical', window.esynOpts.throughput, nwname, addFromBiogrid)
				} else {
					console.log('unexpected interaction type, ', window.esynOpts.interactionType)
					alert("It looks like you're trying to generate a network from bioGRID, but the interaction type was not recognised. The requested type was: " + window.esynOpts.interactionType + ". Please use 'physical', 'genetic' or 'any'. If this problem persists please contact info@esyn.org")
				}
			} else if(window.esynOpts.source == 'pombase'){
				console.log('using pombase as source')
				var nwname = 'Generated interaction network';
				window.currentNwName = nwname;
				document.getElementById('nw_name').value = window.currentNwName;
				//loadCuratedPombe(genes, inttype, includeInteractors, identifierType, networkName
				loadCuratedPombe(window.esynOpts.query.split("|"), window.esynOpts.interactionType, window.esynOpts.includeInteractors, window.esynOpts.identifierType, nwname)
				
			} else if(window.esynOpts.source == "intermine"){
				//genes, intType, organism
				console.log("generate graph from intermine data")

				//user specifies options to use with our default query
				fromIntermine(window.esynOpts.query.split('|'),window.esynOpts.interactionType,window.esynOpts.organism, window.esynOpts.includeInteractors, window.esynOpts.identifierType ,intermineToGraph)
			
			} else if(window.esynOpts.source == "flybase"){
				console.log("generate from flybase data")
				var nwname = 'Generated interaction network';
				window.currentNwName = nwname;
				document.getElementById('nw_name').value = window.currentNwName;

				loadFlybase(window.esynOpts.query.split("|"), window.esynOpts.interactionType, window.esynOpts.includeInteractors, window.esynOpts.colourSource, window.esynOpts.colourCommInteract, window.esynOpts.interInter, window.esynOpts.identifierType, nwname,window.esynOpts.layout)
			

			}
		} else if(window.esynOpts.term != -1){
			//build a network for a GO term
			window.esynOpts.includeInteractors = JSON.parse(window.esynOpts.includeInteractors)
			if(window.esynOpts.source == 'biogrid'){
				//load from biogrid
				console.log('GO network with biogrid as data source')
				var nwname = window.esynOpts.term + ' network';
				window.currentNwName = nwname;
				document.getElementById('nw_name').value = window.currentNwName;
				goTermBiogrid(window.esynOpts.term, window.esynOpts.interactionType, window.esynOpts.includeInteractors, window.esynOpts.throughput, nwname)
				//automatically select the appropriate option in the interactive search
				$('#organisms').val("4896") //go term networks currently only available for pombe
			} else if(window.esynOpts.source == 'pombase'){
				//load from pombase
				console.log('GO network with pombase as data source')
				var nwname = window.esynOpts.term + ' network';
				window.currentNwName = nwname;
				document.getElementById('nw_name').value = window.currentNwName;
				fromGoTerm(window.esynOpts.term, window.esynOpts.interactionType, window.esynOpts.includeInteractors, 'id', nwname);
				//automatically select the appropriate option in the interactive search
				$('#organisms').val("pombase")
			}
		} else if (window.esynOpts.where != -1 && window.esynOpts.root != -1){
			//user specified query
			console.log("intermine PRO version")
			fromInterminePro(window.esynOpts.root, window.esynOpts.where)
		}
	
	};
	//initialise the navigator overview panel
	// $('#cy').cytoscapeNavigator({
	//     container: false,
	//     viewLiveFramerate: 0,
	//     thumbnailEventFramerate: 30,
	//     thumbnailLiveFramerate: false,
	//     dblClickDelay: 2
	// })
	$('#cy').cytoscapeNavigator({
	    container: false,
	    viewLiveFramerate: 0,
	    thumbnailEventFramerate: 1,
	    thumbnailLiveFramerate: 1,
	    dblClickDelay: 2
	})
  }
});


var cy = $("#cy").cytoscape("get") //get global reference to $cy to use for click events etc

//printState();


//ONCLICK EVENTS - ADD NODES AND EDGES
//use a cy.one function that will fire the first time the background is clicked
cy.one('click', function(evt){
  console.log('User interaction detected, add confirmation on page exit');
  if(window.esynOpts.embedded != "true"){
	  window.onbeforeunload = confirmOnPageExit;
  }
});
//onclick for nodes
cy.on('vclick', 'node', function(evt){

  var node = evt.cyTarget;
  console.log( 'tapped ' + node.id() ); //node.id() is a shortcut to get the id
  
  //if in edge mode, check whether sourcenode set, if so then draw an edge between the selected node and the sourcenode then clear sourcenode
  if(window.nmode==false && window.currentNwName != 'Merge-result'){
	  if(window.sourcenode != -1){
		//this is the second node so draw an edge
		//group: "edges", data: { id: "e0", source: "n0", target: "n1" }
		//check that the source and target nodes have different classes
		
		var setID = window.stack.metadata.edgecounter.toString();
		cy.add([{
			group: "edges",
			data: {
				id: "e" + setID,
				source: window.sourcenode,
				target: node.id(),
				multiplicity: 1 //initialise as 1. Both normal and inhibitor edges can have a multiplicity greater than 1 
			},
			classes: window.etype
		}])  
		clear();
		window.sourcenode = -1;
		window.stack.metadata.edgecounter += 1;
			

	  }else{
		//this is the first node
		
			window.sourcenode = node.id()  
			window.sourcetype = node.hasClass('place') ? 'place' : 'transition' //if it is a place, window.sourcetype = 'place', else 'transition'
			clear();
			print('Creating ' + window.etype + ' edge from: ' + node.data('name'));
			//create a button that will allow the user to cancel edge creation
			print('<button type="button" id="cancel" class="btn btn-danger" onclick="cancel_edge()">Cancel edge creation</button>')
			
	  }
  } else{
	//in node mode, click a node to display and edit info
	display_info(node)
}
  
});

//special event for two-finger tap or right click, jump to contained network for coarse node
cy.on('cxttap', 'node', function(evt){
	console.log('cxttap')
	var node = evt.cyTarget;
	if(window.stack.hasOwnProperty(node.data('name'))){
		goTo(node.data('name'))
	}

})

function display_info(node){
	//print information to the #info div. call after modifying a node to update the div
	clear()
  	//print("Selected: " + node.id())
  	if(window.currentNwName == 'Merge-result'){
  		print('<form onkeypress="return event.keyCode != 13;">Name<sup><button type="button" class="btn btn-link btn-xs btn-tight" data-toggle="modal" data-target="#namingModal">[?]</button></sup>:<br /><input type="text" name="set_node_name" id="set_node_name" value ="'+node.data('name')+'"></form>')
  		print('<p class="bg-warning">Save merge result as new project to edit</p>')
  	} else{
	  	if(node.hasClass('place')){
			print('<form onkeypress="return event.keyCode != 13;">Name<sup><button type="button" class="btn btn-link btn-xs btn-tight" data-toggle="modal" data-target="#namingModal">[?]</button></sup>:<br /><input type="text" name="set_node_name" id="set_node_name" value ="'+node.data('name')+'"></form>')
			//print('<form onkeypress="return event.keyCode != 13;">Marking:<br /><input type="text" name="set_marking" id="set_marking" value ="'+node.data('marking')+'"></form>')
			if(/^DB[0-9]{5}/.test(node.data("name")) == true){
				//if the format is "DB" followed by exactly 9 digits, we assume it's a DrugBank identifier
				print("<a href='http://www.drugbank.ca/drugs/"+node.data("name")+"' target='_blank'>Drug details</a>")
			}
			if(window.editingEnabled == true){
				print('<button type="button" id="set" class="btn btn-success" onclick="set(' + "'" + node.id() + "'"+ ')">Set</button>')
			}
			
			//if the place doesn't contain a network, show a button to put a network inside, otherwise show a button to load that network
			//button to nest a network inside the selected node - i.e. make it into a transition
			if(window.stack.hasOwnProperty(node.data('name'))){
				print('<button type="button" id="jump" class="btn btn-primary" onclick="goTo(' + "'" + node.data('name') + "'"+ ')">Go to network</button>')
			} else if(window.editingEnabled == true) {
				print('<button type="button" id="nest" class="btn btn-primary" onclick="nestWithin(' + "'" + node.data('name') + "'"+ ')">Nest network inside</button>')
			};


			

			/*
			We no longer allow the creation of coarse nodes in a Diagram. The functions called still exist but won't be called 
			If we re-enable this, will need to check change_coarse and change_parents to make sure they work with any other changes
			Removed on 24.03.14, issue #25.
			*/
			//adding classes to places
			//print('<button type="button" id="edit_coarse_place" class="btn btn-default" onclick="change_coarse(' + "'" + node.data('name') + "'"+ ')">Edit as coarse place</button>')
			//fill in the #contains div
			//change_coarse(node.data('name'));

			//fill in the #isa div
			//change_parents(node.data('name'));
	 	} else {
			print('<form onkeypress="return event.keyCode != 13;">Name:<br /><input type="text" name="set_node_name" id="set_node_name" value ="'+node.data('name')+'"></form>')
			if(window.editingEnabled == true){
				print('<button type="button" id="setid" class="btn btn-success" onclick="set(' + "'" + node.id() + "'"+ ')">Set</button>')
			}
			//expand button will be enabled later
	  		//print('<button type="button" id="expander" onclick="loadNet(' + "'" + node.id() + "'" + ')">Expand</button>')
	  } 
	  
	  //option to remove the selected node
	  if(window.editingEnabled == true){
		  print('<button type="button" id="remove" class="btn btn-danger" onclick="remove_element(' + "'" + node.id() + "'"+ ')">Delete</button>') 
	  }
  }
  //linkout to ensembl
  //print('<a href="http://www.ensembl.org/Multi/Search/Results?q='+node.data('name')+';site=ensembl", target="_blank">Search Ensembl for this gene</a>');
  //form element
  print('<form target="_blank" action="http://www.ensembl.org/Multi/Search/Results"><input type="hidden" name="q" value="'+node.data('name')+'" /><input type="hidden" name="site" value="ensembl_all" /><button type="submit" class="btn btn-info">Search Ensembl</button></form>');

if(window.editingEnabled == true){
print('<button class="btn btn-info"  onclick="goToTab(&#39;interactions&#39;)">Extend Network</button>');
//print('<button  class="btn btn-link"  data-toggle="tab" onclick="goToTab(interactions)" >Find A Path</button>');
}


};

//function to set node values - same function for places and transitions
function set(nodeID){
	var newName = document.getElementById('set_node_name').value //the name can be set for both places and transitions
	//check the name is allowed
	//name != 'nodes'

	//remove any special characters, replace with a space
	var cpy = newName //copy so we can compare at the end and alert if changed
	newName = newName.match(/[ a-zA-Z0-9_-]+/g).join(" ")//letters, numbers, space, underscore, dash are allowed
	if(newName != cpy){
		alert("Node names can't contain special characters, they have been removed from the name. Names can only contain letters, numbers, spaces, dashes and underscores.")
	}


	if(newName == 'nodes'){
		//this name is not allowed, used in network upload to determine whether the file is a single graph or a stack
		alert('The name "nodes" is not allowed')	
	} else if(/^n[0-9]+[^?!() A-Za-z]+$/.test(newName) == true){ //the space in the NOT set is important
		alert("Names of the format 'n followed by digits' are reserved for programmatic use only.")

	} else {
		var change = cy.$('#'+nodeID); //get a reference to the node to be changed
		//check if it is a place or transition
		if(change.hasClass('place')){ 
		//action if it's a place
			//var newMarking = parseInt(document.getElementById('set_marking').value)
			var newMarking = 1 //for now just always set an allowed value rather than removing all references to marking
			if(newMarking < 0){
				alert('marking must be >= 0, not changing anything')
			} else {
				//marking is allowed
				//if the name has already been used, it will become a disperse place

				//if renaming a place that contains a network, alert the user that the relationship will be lost
				if(change.data('name') in window.stack){
					alert('You have renamed a node that is linked to a network - to maintain the link you must rename the network ' + change.data('name') + ' to ' + newName)
				}
				
				if(newName == window.currentNwName){
					//a node can't contain the network it is in
					alert("A node can't contain the network it's in")
				} else {
					//the name is allowed, check whether it has already been used
					if(newName in window.stack.metadata.place){ //the name has already been used - either by this node and we should just update it or by a different node and we should make this node an occurence of a disperse place
						if(newName == change.data('name')){ //if the name field hasn't been changed, update the marking
							//if newName is not already a disperse place, just update it. Otherwise update all members
							if(newName in window.stack.metadata.disperse){
								//update the marking for all occurences of the disperse place
								console.log('changing marking for all occurences of the disperse place: ' + newName);
								change_disperse_marking(newName, newMarking);
								
							} else { //a normal place so just change the marking, the name is the same
								change.data('marking',newMarking);
								window.stack.metadata.place[newName] = newMarking;	
							}
							
						} else{ //the name has been set to a name already in use
							//creating a disperse place
							//set the name and update the marking for all apperances
							if(change.data('name') in window.stack.metadata.disperse){
								//trying to make all members of a disperse place into members of another existing place
								alert("adding to disperse places this way around is not possible")
								
								//temporarily rename the place that all members of the disperse place will become members of
								//the problem is it might not be found in the current network so would have to search for it,
								//get its marking
								//also if the other place is already a disperse place I need to change all of their names
								//change_place(other place, '__TEMPORARY_NAME__',otherplace.data('marking'))
								//OR
								//change_disperse_name(other place name, '__TEMPORARY_NAME__')
								
								//now rename change the current disperse place to have the original name and marking of the new place
								//change_disperse_name(change.data('name'),newName)
								//change_disperse_marking(change.data('name'), marking of the other place)
								
								//now change the original place back
								//make_disperse(other place, newName)
								
								
							} else {
								alert('you have created an apperance of a disperse place') //swich to alerting function with option to disable
								//update disperse metadata
								make_disperse(change, newName); //this automatically deletes data on the old name from the metadata
							
							}
							
						}
					} else { //the name hasn't been used yet
						//if the selected place is a disperse place, decide whether to rename them all or just this one
						if(change.data('name') in window.stack.metadata.disperse){
							var changeall = confirm('Press OK to use this name for all occurences of this place or cancel to rename this place only, making it separate from the disperse place')
							
							if(changeall){ //apply the changes to all members
								change_disperse_marking(change.data('name'),newMarking);
								change_disperse_name(change.data('name'),newName);
								
							} else { //apply to this member onle i.e. make it no longer a disperse place
								//rename this place and remove it from the list of places associated with the disperse place
								make_not_disperse(change,change.data('name'),nodeID,newName,newMarking);
							
							}
						} else { 
							//These can both be true at the same time:
							//if the selected place contains other places, we have to update the contains metadata
							//if the selected place is containd by other places, we have to update the isa metadata
						
							//just a normal place
							update_place(change,newName,newMarking);
						
						}
						
					}
					
				}
			}
			
		} else {
			//transition
			if(newName in window.stack.metadata.place | newName in window.stack.metadata.transition){
				alert('The name "' + newName + '" is already in use. Please choose another name.')	
			} else if(newName == window.currentNwName){
				alert("A transition can't contain the network it's in!")
			} else {
				
				//if the name was the same as a network in the stack but now isn't, alert the user that they are making a transition not coarse and remove the visual style class
				if(change.data('name') in window.stack){
					alert('The selected node will no longer contain the network: ' + change.data('name'))
					change.removeClass('coarsetransition');
				};
				
				//if the name is the same as a network in the stack, add the visual style class
				if(newName in window.stack){
					alert('You have created a coarse transition containing the network: ' + newName);
					change.addClass('coarsetransition');
				};
				window.stack.metadata.transition[newName] = window.stack.metadata.transition[change.data('name')]
				delete window.stack.metadata.transition[change.data('name')]
				change.data('name', newName).flashClass('nolabel',1); //quickly remove and reapply the node label so it's updated
				change.flashClass('nolabel', 1) //quickly remove and reapply the node label so that it is updated
			
			}
		}
		
	}
	
	//recently added, make sure it doens't create problems
	display_info(cy.filter("node[id = '" + nodeID+"']"))
	
	//update style - could add to each individual function? now this will duplicate work sometimes
	remove_style();
	update_style();

};

//function to properly rename nodes after cytoscape 2.3.0 - have to force the renderer to redraw the name
function myrename(node, name){
	node.data('name',name) //change the name in the data model

	//remove the node label
	node.addClass('nolabel')

	//manually remove the class - using removeClass leaves the class as undefined, which then becomes true again when loaded from JSON
	delete node._private.classes.nolabel

	node.updateStyle()
}

//function to rename and change marking for a normal place
function update_place(node,newName,newMarking){
	//at the point this function is called, we know the place is not disperse
	//delete the old data from the metadata
	delete window.stack.metadata.place[node.data('name')];
	var oldName = node.data('name');
	
	//if the node is coarse, update the metadata.contains
	//copy the data under the old name into a new entry under the new name, delete the data under the old name
	if(oldName in window.stack.metadata.contains){
		var contained = window.stack.metadata.contains[oldName];
		window.stack.metadata.contains[newName] = contained;
		delete window.stack.metadata.contains[oldName];	
		
		//update the isa data for all places contained by this place
		for(var i=0; i<contained.length; i++){
			var old = window.stack.metadata.isa[contained[i]];
			old.splice(old.indexOf(oldName),1);
			old.push(newName);
			window.stack.metadata.isa[contained[i]] = old;
		};
	}
	
	//if the place is contained by other places, update the metadata.isa AND update the contains metadata for those places
	if(oldName in window.stack.metadata.isa){
		var contained_by = window.stack.metadata.isa[oldName];
		
		//replace the entry for the selected node
		window.stack.metadata.isa[newName] = contained_by;
		delete window.stack.metadata.isa[oldName];	
		
		//update the contains metadata for all places that contain the selected place
		for(var i=0; i<contained_by.length; i++){
			var old = window.stack.metadata.contains[contained_by[i]];
			old.splice(old.indexOf(oldName),1);
			old.push(newName);
			window.stack.metadata.contains[contained_by[i]] = old;
		};
	};
	
	//update the node itself
	node.data('name', newName).flashClass('nolabel',1); //quickly remove and reapply the node label so it's updated
	node.data('marking',newMarking);
	
	//create the new metadata
	window.stack.metadata.place[newName] = newMarking;
};

//This function generates the GUI used for editing coarse places, it doesn't actually do the editing
function change_coarse(coarse_node_name){
	
	//add place it contains
	if($('#add_coarse').length == 0){ //so the function can be called to update the display area, only create the element if it doesn't exist yet
		document.getElementById('contains').innerHTML += '<div id="add_coarse"></div>';
	};
	var pselect = $('#add_coarse')
	
	//if the selected node is already contained by some other places, get a list of them and prevent them appearing as options
	var exclude = [coarse_node_name];
	if(coarse_node_name in window.stack.metadata.isa){
		exclude = exclude.concat( window.stack.metadata.isa[coarse_node_name]	); //exclude places that contain the selected node
	};

	//if it's a node that contains a network, it can't have other child nodes
	if(window.stack.hasOwnProperty(coarse_node_name)){
		var pOpts = "A node that contains a network cannot be a parent node";
	} else {
	
		var pOpts = 'Add a child node:<select id="to_add"><option selected="selected" value="">Select a node</option>'
		for(val in window.stack.metadata.place){
			if(exclude.indexOf(val) < 0){
				if(coarse_node_name in window.stack.metadata.contains){ 
				//if the place already contains some other places, don't show them as options
				//if there are places that contain networks, don't show them as options
					if(window.stack.metadata.contains[coarse_node_name].indexOf(val) <0 && !window.stack.hasOwnProperty(val)){
						bit = '<option value ="' + val + '">' + val + '</option>'
						pOpts += bit
					};
				} else {
					if(!window.stack.hasOwnProperty(val)){
						bit = '<option value ="' + val + '">' + val + '</option>'
						pOpts += bit
					}
				}
			};
		};
		pOpts += '</select>'
		
		//add button to make the change - changed to ownName from coarse_node_id
		pOpts += '<button class="btn btn-default" onclick="place_contains_button(' + "'" +coarse_node_name +"'" +')">Add</button>'
			
	}
	pselect.html(pOpts)
	
	//////////////////////////////
	//remove places it contains
	if(coarse_node_name in window.stack.metadata.contains){
		if($('#remove_coarse').length == 0){ //so the function can be called to update the display area, only create the element if it doesn't exist yet
			document.getElementById('contains').innerHTML += '<div id="remove_coarse"></div>';
		};
		
		var pselect = $('#remove_coarse')
		
		var pOpts = 'Child nodes:<select id="to_remove"><option selected="selected" value="">Children</option>'
		var contained = window.stack.metadata.contains[coarse_node_name];
		for(var i=0; i<contained.length; i++ ){
			bit = '<option value ="' + contained[i] + '">' + contained[i] + '</option>'
			pOpts += bit
		};
		pOpts += '</select>'
		
		//add button to make the change
		pOpts += '<button class="btn btn-danger" onclick="place_notcontain_button(' + "'" +coarse_node_name +"'" +')">Remove</button>'
			
		pselect.html(pOpts)
	} else {
		if($('#remove_coarse').length > 0){
			//the node is not coarse but there is something in the remove_coarse div, which shouldn't be there
			$('#remove_coarse').remove();
		}

	}
	
};

function change_parents(isa_node_name){
	//this function is used to remove a parent-child relationship when the user starts from selecting the child node
	//first we populate a dropdown list showing the places that contain the selected place

	//add isa relationship
	if($('#add_isa').length == 0){ //so the function can be called to update the display area, only create the element if it doesn't exist yet
		document.getElementById('isa').innerHTML += '<div id="add_isa"></div>';
	};
	var pselect = $('#add_isa')
	
	//if the selected node is already contained by some other places, get a list of them and prevent them appearing as options
	var exclude = [isa_node_name];
	if(isa_node_name in window.stack.metadata.isa){
		exclude = exclude.concat( window.stack.metadata.isa[isa_node_name]	); //exclude places that contain the selected node
	};

	if(window.stack.hasOwnProperty(isa_node_name)){
		var pOpts = "A node that contains a network cannot be a child node";
	} else {
	
		var pOpts = 'Add a parent node:<select id="parent_to_add"><option selected="selected" value="">Select a node</option>'
		for(val in window.stack.metadata.place){
			if(exclude.indexOf(val) < 0){
				if(isa_node_name in window.stack.metadata.contains){ 
				//if the place already contains some other places, don't show them as options
				//if there are places that contain networks, don't show them as options
					if(window.stack.metadata.contains[isa_node_name].indexOf(val) <0 && !window.stack.hasOwnProperty(val)){
						bit = '<option value ="' + val + '">' + val + '</option>'
						pOpts += bit
					};
				} else {
					if(!window.stack.hasOwnProperty(val)){ //a node can't be contained by a node that contains a network
						bit = '<option value ="' + val + '">' + val + '</option>'
						pOpts += bit;
					}
				}
			};
		};
		pOpts += '</select>'
		
		//add button to make the change - changed to ownName from coarse_node_id
		pOpts += '<button class="btn btn-default" onclick="place_containedby_button(' + "'" +isa_node_name +"'" +')">Add</button>'
			
	}
	pselect.html(pOpts)

	//remove isa relationship - list places that currently contain this place
	if(isa_node_name in window.stack.metadata.isa){
		if($('#remove_isa').length == 0){ //so the function can be called to update the display area, only create the element if it doesn't exist yet
			document.getElementById('isa').innerHTML += '<div id="remove_isa"></div>';
		};
		
		var pselect = $('#remove_isa')
		
		var pOpts = 'Parent nodes:<select id="parent_to_remove"><option selected="selected" value="">Parents</option>'
		var contained_by = window.stack.metadata.isa[isa_node_name];
		for(var i=0; i<contained_by.length; i++ ){
			bit = '<option value ="' + contained_by[i] + '">' + contained_by[i] + '</option>'
			pOpts += bit
		};
		pOpts += '</select>'
		
		//add button to make the change - the parameter is the currently selected node
		pOpts += '<button class="btn btn-danger" onclick="place_notcontainedby_button(' + "'" +isa_node_name +"'" +')">Remove</button>'
			
		pselect.html(pOpts)
	} else {
		if($('#remove_isa').length > 0){
			//the node is not coarse but there is something in the remove_coarse div, which shouldn't be there
			$('#remove_isa').remove();
		}

	}
}

//////////////////////////////////////////////////////////////////
//functions for creating and manipulating disperse places

function make_disperse(node, becomes_name){ //orig is the ID, becomes is the NAME of the disperse place
	//update the visual style
	node.addClass('disperse')
	if(becomes_name in window.stack.metadata.contains){
		//if the disperse place name contains other places, add that class to this node too
		node.addClass('contains');	
	}


	////////////////////////// the first thing to do is clean up old data about the selected place - BEFORE we modify it
	//the original node is effectively deleted, remove any contains/ isa relationships it had
	//use the code from remove_element
	var deleted_name = node.data('name')
	//if the place is a coarse place, now it doesn't contain anything
	if(deleted_name in window.stack.metadata.contains){
		console.log('coarse place, name: '+deleted_name+ ' id: ' + node.data('id') + 'made into a disperse place, so removing its coarse metadata');
		//we deleted an element that contains other element(s) - remove that relationship/ those relationships
		var children = window.stack.metadata.contains[deleted_name] //we will need to update isa for these
		delete window.stack.metadata.contains[deleted_name]
		//now update the isa relationships
		for(var j = 0; j<children.length; j++){
			//for each child node, remove the isa relationship to the deleted node
			window.stack.metadata.isa[children[j]].splice(window.stack.metadata.isa[children[j]].indexOf(deleted_name),1)
			if(window.stack.metadata.isa[children[j]].length == 0){
				delete 	window.stack.metadata.isa[children[j]]; //if we deleted the only place containing the child place then delete its entry in the isa object
			};
		};
	};
	
	//if the place is contained by other places, now they don't contain it
	if(deleted_name in window.stack.metadata.isa){
		console.log('child node, name: '+deleted_name+ ' id: ' + node.data('id') + 'made into a disperse place, removing old metadata about places containing it');
		//get the parent nodes for this place and remove the contains relationship from them
		var parents = window.stack.metadata.isa[deleted_name];
		for(var j=0; j<parents.length; j++){
			window.stack.metadata.contains[parents[j]].splice(window.stack.metadata.contains[parents[j]].indexOf(deleted_name),1)
			if(window.stack.metadata.contains[parents[j]].length == 0){
				//the parent place no longer contains anything, so is not coarse
			
				delete window.stack.metadata.contains[parents[j]];	
			} //end if the parent is no longer coarse
			
		}; //end loop through parents
		
		delete window.stack.metadata.isa[deleted_name];	
	}; //end sorting out isa
	
	/////////////////now make it a disperse place
	
	//get the current disperse places
	var disp = Object.keys(window.stack.metadata.disperse);
	//if becomes is already a disperse place, we are adding a new member. Otherwise we are creating a new disperse place
	if(disp.indexOf(becomes_name) >= 0){
		//adding to an existing disperse place 
		//delete orig from places
		delete window.stack.metadata.place[node.data('name')]
		//set the name of orig to newname
		node.data('name',becomes_name).flashClass('nolabel',1); //quickly remove and reapply the node label so it's updated

		//set the marking of orig to the marking of the disperse place
		node.data('marking', window.stack.metadata.place[becomes_name])
		//update disperse place metadata
		if(Object.keys(window.stack.metadata.disperse[becomes_name]).indexOf(window.currentNwName) >= 0){
			//there is already a reference to the disperse place in this network, append the new one
			window.stack.metadata.disperse[becomes_name][window.currentNwName].push(node.id())
			
		} else {
			window.stack.metadata.disperse[becomes_name][window.currentNwName] = [node.id()]
		};
		
	} else {
		//creating a new disperse place
		
		//find the node that the selected node is becoming
		var allNwNames = Object.keys(window.stack)
		allNwNames.splice(allNwNames.indexOf('metadata'),1) //remove metadata from the list of networks
		if(allNwNames.indexOf(window.currentNwName) >=0){//don't search the current network as it might have been modified
			allNwNames.splice(allNwNames.indexOf(window.currentNwName),1) 
		};
		
		//we need to find the name of the network that contains the other appearance of the newly created disperse place
		//for now this has to be done by searching for it, it could be in any of the networks in the stack
		var found_in = '';
		var found_id = '';
		var changeclass = false;
		//this code only executes when you're first creating a disperse place
		//we know that the selected node is in the current network but the other member could be anywhere
		//have to search all other networks until we find it, and then update its classes and the metadata
		for(var i=0; i<allNwNames.length; i++){
			var tmp = JSON.parse(window.stack[allNwNames[i]]); //load network data - doesn't get displayed
			var tmp_n = Object.keys(tmp.nodes)
			for(var j=0; j<tmp_n.length;j++){ //search for a node with the same name
				if(tmp.nodes[tmp_n[j]].data.name == becomes_name){
					console.log(becomes_name + ' found in:' + allNwNames[i]);
					found_in = allNwNames[i];
					found_id = tmp.nodes[tmp_n[j]].data.id;
					
					//don't need to udpate the visual style class as it isn't in the currently loaded network
				}
			};
		};
		
		//if we haven't found it by searching all other networks then it must be in the current network 
		if(found_in == ''){
			//alert('not found in any other network, must be in current network')
			var bec = cy.filter("node[name = '" + becomes_name+"']")
			if(bec.length == 1){
				found_in = window.currentNwName;
				found_id = bec.id()
				//update the classes
				bec.addClass('disperse')
			} else {
				alert('more than one matching original node found in the current network')	
			}
		};
		
		//now the code below is all that's needed to update the visual style in the current network
		var bec = cy.filter("node[name = '" + becomes_name+"']"); //if there is another appearance in the current network, this will update its visual style class, otherwise it won't do anything
		bec.addClass('disperse');
		
		//delete orig from places
		delete window.stack.metadata.place[node.data('name')]
		//set the name of orig to newname
		node.data('name',becomes_name).flashClass('nolabel',1); //quickly remove and reapply the node label so it's updated
		//set the marking of orig to the marking of the disperse place
		node.data('marking', window.stack.metadata.place[becomes_name])
		//update disperse place metadata
		window.stack.metadata.disperse[becomes_name] = {};
		window.stack.metadata.disperse[becomes_name][window.currentNwName] = [node.id()]
		if(window.currentNwName == found_in){ //if they are both in the same network then push both IDs
			window.stack.metadata.disperse[becomes_name][found_in].push(found_id)
		} else {
			window.stack.metadata.disperse[becomes_name][found_in] = [found_id]
		};
		
	};
	
	
	
};

function make_not_disperse(change, disperse_name, remove_id, newName, newMarking){
	//change = the node to change
	//disperse = NAME of the disperse place, remove_id = the ID of the place to be removed from the group, newName = the new name for the place remove_id, newMarking = the marking for the place remove_id
	//this function will make the given node NOT a member of a disperse place any more
	//if the node was one of only two members, the original member will also be reset to a normal place
	
	// DON'T USE update_place - it will delete the reference to other members of the disperse place from the place metadata!
	//update the selected place
	change.data('name', newName).flashClass('nolabel',1); //quickly remove and reapply the node label so it's updated;
	change.data('marking',newMarking);
	//remove the visual style
	change.removeClass('disperse');
	
	//create the new metadata
	window.stack.metadata.place[newName] = newMarking;
	
	////// check whether the current network contains any other appearances of the disperse place
	///// if it doesn't then remove it from the list of networks that contain the disperse place
	//we know that the selected node is in the currently viewed network
	var thisNwMembers = window.stack.metadata.disperse[disperse_name][window.currentNwName]
	//if this node is the only appearance in the current network, delete the current network from the list
	//otherwise only delete the reference to this node
	if(thisNwMembers.length > 1){
		thisNwMembers.splice(thisNwMembers.indexOf(remove_id),1);
		window.stack.metadata.disperse[disperse_name][window.currentNwName] = thisNwMembers;	
	} else { //the selected node is the only appearance of the disperse place in the current network so just delete the current network from the list of networks that contain an appearance of the disperse place
		delete window.stack.metadata.disperse[disperse_name][window.currentNwName];
	}
	
	/////// check whether there is now only one appearance of the disperse place left - i.e. it is not disperse any more
	//check whether the disperse place is still disperse after the removal of the selected node
	var allMembers = window.stack.metadata.disperse[disperse_name];
	var allMembersNws = Object.keys(window.stack.metadata.disperse[disperse_name]);
	if(allMembersNws.length == 1){
		//must be disperse if there is more than one network that contains an appearance of the place
		//if there is only one, check how many references it contains to the disperse place
		//if it's only one then it is no longer a disperse place
		if(allMembers[allMembersNws[0]].length == 1){ //only one network contains a reference to this place and that network only contains one reference to it -> not a disperse place any more
			//no longer a disperse place
			//the remaining nodes name will still connect it to window.stack.metadata.place
			delete window.stack.metadata.disperse[disperse_name];
			
			/* no longer needed - visual style classes are no longer saved
			/////////////////////
			//new bit to remove class - need to check whether the remaining node is in the current network
			//if so then use cy removeClass, otherwise update the stack
			//update the classes for the remaining node
			var otherplace_nw = JSON.parse(window.stack[allMembersNws[0]]);
			var otherplace_nodes = otherplace_nw.nodes;
			for(var j = 0; j<otherplace_nodes.length; j++){ //we know there is only one node that will match
				if(otherplace_nodes[j].data.name == disperse_name){
					var oldclass = otherplace_nodes[j].classes;
					var newclass = oldclass.replace(' disperse','') //note preceeding space - otherwise they'll accumulate
					otherplace_nw.nodes[j].classes = newclass;
				};
			};
			window.stack[allMembersNws[0]] = JSON.stringify(otherplace_nw)//update the stack
			*/
			
			//if there is an appearance of the disperse place in the current network then update its visual style classes
			var toupdate = cy.filter("node[name = '" + disperse_name+"']");
			toupdate.removeClass('disperse');
		};
		
	};
};

function change_disperse_marking(name,newMarking){
	//track down all members of the disperse place and change their marking
	var nwToLoad = Object.keys(window.stack.metadata.disperse[name]); //this is an array of network names
	
	//remove the current network and edit separately
	if(nwToLoad.indexOf(window.currentNwName) >= 0){ //might not be saved to the stack yet
		nwToLoad.splice(nwToLoad.indexOf(window.currentNwName),1);
	};
	var tochange = window.stack.metadata.disperse[name][window.currentNwName] //nodes to update in the current network
	for(var i=0; i<tochange.length; i++){
		console.log('changing marking in current network')
		cy.$('#' + tochange[i]).data('marking',newMarking)	
	};
	
	//load each of the networks and edit the nodes based on ID
	for(var i=0; i<nwToLoad.length; i++){
		var tmp = JSON.parse(window.stack[nwToLoad[i]]); //load network data - doesn't get displayed
		var tmp_n = Object.keys(tmp.nodes)
		for(var j=0; j<tmp_n.length;j++){ //search for a node with the same name
			if(window.stack.metadata.disperse[name][nwToLoad[i]].indexOf(tmp.nodes[tmp_n[j]].data.id) >= 0){
				console.log(name + ' found in:' + nwToLoad[i] + ", changing multiplicity");
				tmp.nodes[tmp_n[j]].data.marking = newMarking;
			};
		};
		//replace the stack data
		window.stack[nwToLoad[i]] = JSON.stringify(tmp)
	};
	
	//update the global places marking
	window.stack.metadata.place[name] = newMarking;
};

function change_disperse_name(oldName,newName){
	//track down all members of the disperse place and change their name
	var nwToLoad = Object.keys(window.stack.metadata.disperse[oldName]); //this is an array of network names
	
	//remove the current network and edit separately
	if(nwToLoad.indexOf(window.currentNwName) >= 0){ //might not be saved to the stack yet
		nwToLoad.splice(nwToLoad.indexOf(window.currentNwName),1);
	};
	var tochange = window.stack.metadata.disperse[oldName][window.currentNwName]; //nodes to update in the current network
	for(var i=0; i<tochange.length; i++){
		console.log('changing name in current network')
		cy.$('#' + tochange[i]).data('name',newName).flashClass('nolabel', 1) //quickly remove and reapply the node label so that it is updated	
	};
	
	//load each of the networks and edit the nodes based on ID
	for(var i=0; i<nwToLoad.length; i++){
		var tmp = JSON.parse(window.stack[nwToLoad[i]]); //load network data - doesn't get displayed
		var tmp_n = Object.keys(tmp.nodes);
		for(var j=0; j<tmp_n.length;j++){ //search for a node with the same name
			if(window.stack.metadata.disperse[oldName][nwToLoad[i]].indexOf(tmp.nodes[tmp_n[j]].data.id) >= 0){
				console.log(oldName + ' found in:' + nwToLoad[i] + ", changing name");
				tmp.nodes[tmp_n[j]].data.name = newName;
			};
		};
		//replace the stack data
		window.stack[nwToLoad[i]] = JSON.stringify(tmp)
	};
	
	//update the global places marking
	var marking = window.stack.metadata.place[oldName];
	window.stack.metadata.place[newName] = marking;
	delete window.stack.metadata.place[oldName];
	
	//update the disperse place metadata so that the new name is listed as a disperse place
	window.stack.metadata.disperse[newName] = window.stack.metadata.disperse[oldName]; //the associated places remain the same
	delete window.stack.metadata.disperse[oldName];

	///////////// update coarse place metadata
	//if the disperse place is coarse, update the metadata.contains
	//copy the data under the old name into a new entry under the new name, delete the data under the old name
	if(oldName in window.stack.metadata.contains){
		var contained = window.stack.metadata.contains[oldName];
		window.stack.metadata.contains[newName] = contained;
		delete window.stack.metadata.contains[oldName];	
		
		//update the isa data for all places contained by this place
		for(var i=0; i<contained.length; i++){
			var old = window.stack.metadata.isa[contained[i]];
			old.splice(old.indexOf(oldName),1);
			old.push(newName);
			window.stack.metadata.isa[contained[i]] = old;
		};
	}
	
	//if the place is contained by other places, update the metadata.isa AND update the contains metadata for those places
	if(oldName in window.stack.metadata.isa){
		var contained_by = window.stack.metadata.isa[oldName];
		
		//replace the entry for the selected node
		window.stack.metadata.isa[newName] = contained_by;
		delete window.stack.metadata.isa[oldName];	
		
		//update the contains metadata for all places that contain the selected place
		for(var i=0; i<contained_by.length; i++){
			var old = window.stack.metadata.contains[contained_by[i]];
			old.splice(old.indexOf(oldName),1);
			old.push(newName);
			window.stack.metadata.contains[contained_by[i]] = old;
		};
	};
	
};

function set_edge(id){
	//change the interaction type for an edge
	var newtype = $('#edgeTypeOptions').val();
	var change = cy.$('#'+id);

	//remove all edge type classes - then add back only the required one.
	//if setting to none there will be no class
	change.removeClass('genetic');
	change.removeClass('physical');
	if(newtype == 'genetic'){
		change.addClass('genetic');
	} else if(newtype == 'physical'){
		change.addClass('physical');
	}

	//update the info panel
	printEdgeOptions(id);
	
};

//remove elements from the graph
function remove_element(id){
	//updated to remove ALL SELECTED ELEMENTS not just the last selected element
	var selected = cy.elements(":selected")
	
	
	//update the metadata

	//for each selected element
	for(var i=0; i<selected.length; i++){
		var el = selected[i]
		if(el.data.hasOwnProperty('target') == false){
			if(el.hasClass('place')){
				var deleted_name = el.data('name');
				if(el.data('name') in window.stack.metadata.disperse){
					console.log('deleting disperse node, name: '+el.data('name')+ ' id: ' + el.data('id'));
					//find the reference to this node and delete it
					//we know the selected node is on the currently loaded network
					var current = window.stack.metadata.disperse[el.data('name')][window.currentNwName] //current refs to the disperse place in the current network - if we deleted the final reference then delete the entry for this network
					current.splice(current.indexOf(window.currentNwName),1);
					if(current.length == 0){ //if we deleted the only appearance then delete the current network from the list
						delete window.stack.metadata.disperse[el.data('name')][window.currentNwName];
					} else {
						window.stack.metadata.disperse[el.data('name')][window.currentNwName] = current;
					};
					
					//check whether there is still more than one member of the disperse place, if not then make the only member back into a normal place
					var allMembers = window.stack.metadata.disperse[el.data('name')];
					var allMembersNws = Object.keys(window.stack.metadata.disperse[el.data('name')]);
					if(allMembersNws.length == 1){
					//must be disperse if there is more than one network that contains an appearance of the place
					//if there is only one, check how many references it contains to the disperse place
					//if it's only one then it is no longer a disperse place
						if(allMembers[allMembersNws[0]].length == 1){ //only one network contains a reference to this place and that network only contains one reference to it -> not a disperse place any more
						//no longer a disperse place
						//the remaining nodes name will still connect it to window.stack.metadata.place
						delete window.stack.metadata.disperse[el.data('name')];
					
						};
					
					};
					
				} else {
					console.log('deleting unique (not disperse) place, name: '+el.data('name')+ ' id: ' + el.data('id'));
					//if it isn't a disperse place, we can delete the place from the global list of places
					delete window.stack.metadata.place[el.data('name')]	
				//}; - used to end the else here but moved below so that isa/contains only changed for non-disperse places
				//the remaining places should still have the coarse relationship!
				
					//if the deleted place was a normal (unique) place, it now can't contain anythung
					//but if it was a disperse place and there is still at least one place left with the name then the
					//contains/ isa relationships SHOULD NOT be deleted
					//i.e. even if the remaining place is not disperse any more, it should still keep the coarse property
					
					//if the place is a coarse place, now it doesn't contain anything
					if(deleted_name in window.stack.metadata.contains){
						console.log('deleting coarse place, name: '+deleted_name+ ' id: ' + el.data('id'));
						//we deleted an element that contains other element(s) - remove that relationship/ those relationships
						var children = window.stack.metadata.contains[deleted_name] //we will need to update isa for these
						delete window.stack.metadata.contains[deleted_name]
						//now update the isa relationships
						for(var j = 0; j<children.length; j++){
							//for each child node, remove the isa relationship to the deleted node
							window.stack.metadata.isa[children[j]].splice(window.stack.metadata.isa[children[j]].indexOf(deleted_name),1)
							if(window.stack.metadata.isa[children[j]].length == 0){
								delete 	window.stack.metadata.isa[children[j]]; //if we deleted the only place containing the child place then delete its entry in the isa object
							};
						};
					};
				
				}; //end if not disperse - moved here so that contains/isa not removed if a disperse place deleted
				
				//if the place is contained by other places, now they don't contain it
				if(deleted_name in window.stack.metadata.isa){
					console.log('deleting child node, name: '+deleted_name+ ' id: ' + el.data('id'));
					//get the parent nodes for this place and remove the contains relationship from them
					var parents = window.stack.metadata.isa[deleted_name];
					for(var j=0; j<parents.length; j++){
						window.stack.metadata.contains[parents[j]].splice(window.stack.metadata.contains[parents[j]].indexOf(deleted_name),1)
						if(window.stack.metadata.contains[parents[j]].length == 0){
							delete window.stack.metadata.contains[parents[j]];	
						}
					};
					delete window.stack.metadata.isa[deleted_name];	
				};
				
				
					
			//end if place
			} else {
				//transition
				//if it's a coarse transition, prompt to also delete the network it contains
				console.log('deleting transition node, name: '+el.data('name')+ ' id: ' + el.data('id'));
				if(el.data('name') in window.stack){
					alert('You have deleted a coarse transition but not the network it contains')	
				}
				delete window.stack.metadata.transition[el.data('name')]
			}
		} else {
			console.log('element is an edge, id: ',el.data('id'))
			//remove citation data
			if(window.stack.metadata.citations.hasOwnProperty(el.data('id'))){
				console.log('deleting citation data')
				delete window.stack.metadata.citations[el.data('id')];
			}
		}
	};
	
	
	//delete the elements
	selected.remove();
	
	//clear visual styles then reapply
	remove_style();
	update_style();
	
	//to remove just the last selected element
	//var rm = cy.$('#'+id);
	//cy.remove(rm);
};


//click the background to add a node at that position    
cy.on('click', function (e,nmode) {
    if (e.cyTarget === cy && window.editingEnabled == true){ 
    	if( window.currentNwName != 'Merge-result') {
			if (window.nmode == true ){                     
				var offset = $("#cy").offset()                   
				var xPos = e.originalEvent.pageX - offset.left;
				var yPos = e.originalEvent.pageY - offset.top;
				var default_name = "n" + window.stack.metadata['nodecounter']; //also the default id
				var default_marking = 0;
				console.log(xPos.toString(), yPos.toString())
				cy.add([{
					group : "nodes",
					data : {
						id : default_name,
						name : default_name,
						marking : default_marking //always initialise as 0, transitions will have multiplicity = 0, doesn't matter
						
					},
					classes: window.ntype,
					renderedPosition : {
						x : xPos, // x position,
						y : yPos // y position
					},
				}]);
				
				//update counter
				window.stack.metadata['nodecounter'] += 1;
				
				//update node/place name metadata
				window.stack.metadata[window.ntype][default_name] = default_marking;
				
			};
	    } else {
	    	clear();
	    	print('<p class="bg-warning">Save merge result as new project to edit</p>')
	    }
    }
});

//onlick for edges
cy.on('tap','edge', function(evt){
	var edge = evt.cyTarget;
	console.log('tapped ' + edge.id())
	
	//update info panel
	printEdgeOptions(edge.id());
	
});

function printEdgeOptions(id){
	var edge = cy.$('#'+id);
	//fill in the info panel with info about the selected edge and options for editing it
	clear()
	print("Source: " + cy.filter("node[id = '" + edge.data('source')+"']").data('name'))
	print("Target: " + cy.filter("node[id = '" + edge.data('target')+"']").data('name'))
	
	/*
	print('<form onkeypress="return event.keyCode != 13;">Multiplicity:<br /><input type="text" name="set_multiplicity" id="set_multiplicity" value ="'+edge.data('multiplicity')+'"></form>')
	print('<button class="btn btn-success" type="button" id="set" onclick="set_edge(' + "'" + edge.id() + "'"+ ')">Set</button>')
	*/
	var systemData = false
	if(window.stack.metadata.hasOwnProperty("systems")){
		if(window.stack.metadata.systems.hasOwnProperty(id)){
			systemData = true
		}
	}

	//show and set the edge type
	if(edge.hasClass('genetic')){
		if(systemData == true){
			print('Type: Genetic <button class="btn btn-primary btn-sm" type="button" id="systems-btn" onclick="setupedgemodal('+"'"+id+"'"+')">Details</button>')
		} else {
			print("Type: Genetic")
		}
		
	} else if (edge.hasClass('physical')) {
		if(systemData == true){
			print('Type: Physical <button class="btn btn-primary btn-sm" type="button" id="systems-btn" onclick="setupedgemodal('+"'"+id+"'"+')">Details</button>')
		} else {
			print("Type: Physical")
		}
	} else if (edge.hasClass('complex')){
		//we don't have system data for pombe
		print("Type: Physical (complex)")
	} else if(edge.hasClass('suppressible')){
		print("Type: Suppressible genetic")
	} else if(edge.hasClass('enhanceable')){
		print("Type: Enhanceable genetic")
	} else {
		print("Type: None")
	}

	if(window.currentNwName != 'Merge-result' && window.editingEnabled == true){
	print('Set the type of this edge:')
	print('<select id="edgeTypeOptions"><option>Select a type</option><option value="genetic">Genetic</option><option value="physical">Physical</option><option value="nothing">None</option></select>')
	print('<button class="btn btn-success" type="button" id="set" onclick="set_edge(' + "'" + id + "'"+ ')">Set type</button>')

	//delete edge button
	print('<button type="button" class="btn btn-danger" id="remove" onclick="remove_element(' + "'" + id + "'"+ ')">Delete</button>') 

	//citations for the edge
	buildCitationInterface(id);


	buildCitationList(id);

	} else {
			print('Citations:')
		    print('<div class="control-group"><div class="controls"><select id="selectcitation" name="selectcitation" class="input-sm wide" multiple="multiple"></select></div></div>')
		    print('<div class="control-group"><button id="gocitation" class="btn btn-primary" onclick="goToCitation()">Go to selected</button></div>')
		    buildCitationList(id);
	}
	if(window.currentNwName == 'Merge-result'){
		//don't put this in the else block above because then it gets printed for unmerged networks whenever editing is disabled
	    print('<p class="bg-warning">Save merge result as new project to edit</p>')

	}


};




// SWITCHING MODE
//buttons to set input type
window.onload=function() {
  var radios = document.type_form.types;
  for (var i = 0; i < radios.length; i++)
    radios[i].onclick=RadioClicked;
}

function RadioClicked() {
	//console.log(this.value)
    if (this.value == "n-p") {
      window.nmode = true
	  window.ntype = 'place'
	  window.sourcenode = -1
	  cancel_edge();
   } else if (this.value == "n-t") {
       window.nmode = true
	  window.ntype = 'transition'
	  window.sourcenode = -1
	  cancel_edge();
   } else if (this.value == "e-n") { //undirected edge
       window.nmode = false
	  window.etype = 'normal'
	  window.sourcenode = -1
	  cancel_edge();
   } else if (this.value == "e-d") { //directed edge
       window.nmode = false
	  window.etype = 'directed'
	  window.sourcenode = -1
	  cancel_edge();
   } else {
		console.log("error with editor type form - value not recognised")   
   }
   
   //update info panel
   //printState();
}

///////////////////////// ADD AND REMOVE PLACE CLASSES
function place_contains(place, contains){
	//both place and contain are NAMES now
	if(place == contains){ //this is prevented by the gui now
		alert('A place cannot contain itself.')
	} else if(contains == "" || place == ""){
		alert('Not a valid place name')
	} else {
		//the IDs are ok
		if(place in window.stack.metadata.contains){
			window.stack.metadata.contains[place].push(contains);
		} else {
			window.stack.metadata.contains[place] = [contains];
		}
		if(contains in window.stack.metadata.isa){
			window.stack.metadata.isa[contains].push(place);
		} else {
			window.stack.metadata.isa[contains] = [place];
		}
		
		//update visual style - this will catch all occurences of a disperse place in a network because it searches by name
		var toupdate = cy.filter("node[name = '" + place+"']");
		toupdate.addClass('contains'); //add a way to only add the class if it doesn't already have it - can't use cy.filter because you can use hasClass on a collection - so if there is more than one appearance of the dipserse place in the current network it will break
		
		//check the current network separately - it is likely to have been edited since it was loaded from the stack
			
		
		/* this is now not needed because visual style classes are not saved
		//REMOVE THE CURRENT NETWORK FROM THE LIST OF NETWORKS
		//now check whether the place is disperse and if so update any members in other networks
		if(place in window.stack.metadata.disperse){
			var nws_data = window.stack.metadata.disperse[place]; //networks containing nodes to be updated - nodes are IDs
			var nws = Object.keys(nws_data);
			nws.splice(nws.indexOf(window.currentNwName),1);
			for(var i=0; i<nws.length; i++){
				var tmp = JSON.parse(window.stack[nws[i]]);
				for(var j=0; j<tmp.nodes.length; j++){
					if(nws_data[nws[i]].indexOf(tmp.nodes[j].data.id) >= 0){
						//the current node id is in the list of ids that are part of the disperse place in the current network
						var oldclass = tmp.nodes[j].classes;
						var newclass = oldclass + ' contains';
						tmp.nodes[j].classes = newclass;
						changeclass = true;
					};
				};
				if(changeclass){
					window.stack[nws[i]] = JSON.stringify(tmp)
				};
			};
		};
		*/
		
	};
	
}; 

function place_contains_button(place){
	//for use with the gui
	var contains = $('#to_add').val()
	place_contains(place,contains)	
	
	//update the display
	change_coarse(place);
	change_parents(place);
}

//wrapper to add a parent-child relationship when the user starts from the child node
function place_containedby_button(place){
	//the place passed in is the currently selected node - i.e. the child node
	//for use with the gui
	var contained_by = $('#parent_to_add').val()
	place_contains(contained_by, place);	
	
	//update the display
	change_coarse(place);
	change_parents(place);
}

function place_notcontain(place,notcontain){
	if(notcontain == "" || place == ""){
		alert("not a valid place name")
	} else {
		//make a place no longer contain another place
		//both place and notcontain are IDs - but if whole system changed to name it will still work
		//if we deleted the only contained place then remove place from list of coarse places
		window.stack.metadata.contains[place].splice(window.stack.metadata.contains[place].indexOf(notcontain),1);
		if(window.stack.metadata.contains[place].length == 0){
			delete window.stack.metadata.contains[place];
		};
		window.stack.metadata.isa[notcontain].splice(window.stack.metadata.isa[notcontain].indexOf(place),1);
		if(window.stack.metadata.isa[notcontain].length == 0){
			delete window.stack.metadata.isa[notcontain];
		};
		//update visual style - don't need to use the full clear/ update for all nodes here as disperse relationships are not affected
		var toupdate = cy.filter("node[name = '" + place+"']");
		toupdate.removeClass('contains');
		
		/* this is no longer needed because visual style classes are not saved
		
		//if the place is a disperse place, also update the visual style classes for all the other appearances
		if(place in window.stack.metadata.disperse){
			//any appearances in the current network will already have been updated above (because cy.filter used with NAME)
			//check for any appearances in other networks
			var nws_data = window.stack.metadata.disperse[place]; //networks containing nodes to be updated - nodes are IDs
			var nws = Object.keys(nws_data);
			nws.splice(nws.indexOf(window.currentNwName),1);
			for(var i=0; i<nws.length; i++){
				var tmp = JSON.parse(window.stack[nws[i]]);
				for(var j=0; j<tmp.nodes.length; j++){
					if(nws_data[nws[i]].indexOf(tmp.nodes[j].data.id) >= 0){
						//the current node id is in the list of ids that are part of the disperse place in the current network
						var oldclass = tmp.nodes[j].classes;
						var newclass = oldclass.replace(' contains','')
						tmp.nodes[j].classes = newclass;
						changeclass = true;
					};
				};
				if(changeclass){
					window.stack[nws[i]] = JSON.stringify(tmp)
				};
			};
		};
		*/
	};
};

function place_notcontain_button(place){
	//wrapper for place_notcontain so it works with button
	var notcontain = $('#to_remove').val()
	place_notcontain(place,notcontain);
	
	//update the display
	change_coarse(place);
	change_parents(notcontain);
};

//wrapper for place_notcontain used to remove the parent-child relationship when the user selects the child node first
function place_notcontainedby_button(place){
	//wrapper for place_notcontain so it works with button
	var notcontain_by = $('#parent_to_remove').val()
	place_notcontain(notcontain_by, place);
	
	//update the display
	change_coarse(notcontain_by);
	change_parents(place);
};





//DISPLAY INFORMATION IN SIDE PANEL
//function to print app status
function printState(){
	if(window.nmode){
		$("#state").text("Node mode: "+ window.ntype)	
	}
	else{
		$("#state").text("Edge mode: "+ window.etype)	
	}
	
}

//functions for displaying node info
function clear() {
	document.getElementById("info").innerHTML = "";
	/* we don't allow creation of coarse nodes in Diagrams any more, 24.03.14, issue #25 */
	//document.getElementById('contains').innerHTML = "Edit child nodes";
	//document.getElementById('isa').innerHTML = "Edit parent nodes";

	//clear the interactions panel
	document.getElementById('int-results').innerHTML = ''
}
                
function print(msg) {
	document.getElementById("info").innerHTML += "<p>" + msg + "</p>";
}

//SAVE AND UPLOAD GRAPH
//JSON.stringify(cy.json()['elements']) //cy.json() has cyclic references so have to get different parts individually
//I don't think saving the rest is necessary as the style will always be the same

//function to decide what information should be saved and whether the calling function should be executed
//this function will automatically update the network stack as required
//any function that needs to change the data in the viewer should look like:
/*
function changes_view(){
	var exec = check_changes()
	if(exec){
		//what to do if all the changes have been saved correctly or discarded
		cy.load(new_network)
	};
};
*/

//this function is used to decide whether an action that would swap data between the stack and the viewer should be carried out
//will update the stack so all the calling function needs to do is continue to load the new data
function check_changes(){ 
	var name = document.getElementById('nw_name').value
	var do_fn = true //whether or not to actually do the calling function
	
	//check whether the save operation needs to be cancelled
	//cancel if there is a network in the viewer that has not been named and should be saved
	
	//is the network name the default name?
		//yes
			//does the user want to keep the network or not?
				//yes
					//prompt to enter a name, cancel saving
				
				//no
					//don't update stack
					//do execute
		//no
			//is the name already being used?
				//yes
					//overwrite data currently associated with that name with the data from the viewer?
						//yes
							//update stack
							//do execute
						//no
							//save changes under a different name?
								//yes
									//don't update stack
									//don't save
								//no
									//don't update stack
									//do execute
				//no
					//update stack
					//do execute
					
////////////////////////////////////////////////////////////////////////////////////////////////
	
	//is the network name the default name?
	if(name == 'network_name'){
		//yes
			//does the user want to keep the network or not?
			var r = confirm('Do you want to include the current network? (Hit cancel to discard it)')
			if(r == true){
				//yes
					//prompt to enter a name, cancel saving
					alert('Please enter a name for this network in the control panel')
					do_fn = false
			} else {
				//no
					//don't update stack
					//do save
					do_fn = true
			}
	} else {
		//no
			//is the name already being used?
			if(window.stack.hasOwnProperty(name)){
				//yes the name is being used
					//overwrite data currently associated with that name with the data from the viewer?
					var r = confirm('Save changes to network: ' + name + '? (Hit cancel to save changes under a different name or discard changes)' )
					if (r == true){
						//yes do overwrite
							//remove visual styles
							remove_style();
						
							//update stack
							var jdata = cy.json()['elements'];
							if('nodes' in jdata ){ //it would break if you could save an empty network to the stack
								window.stack[name] = JSON.stringify(jdata);
							} else {
								alert('the current network is empty and will not be saved')	
							};
							//save
							do_fn = true
					} else {
						//no don't overwrite
							//save changes under a different name?
							var r = confirm('Save changes to network: ' + name + ' under a different name? (Hit cancel to discard)' )
							if(r == true){
								//yes
									//don't update stack
									//don't save
									do_fn = false
							} else {
								//no
									//don't update stack
									//do save
									var do_fn = true
							}
					}
									
									
			} else {					
				//no
					// remove visual style classes
					remove_style();
					//update stack
					
					var jdata = cy.json()['elements'];
					if('nodes' in jdata){ //it breaks if you can save an empty network to the stack
						window.stack[name] = JSON.stringify(cy.json()['elements']);
					} else {
						alert('the current network is empty and will not be saved')	
					}; 
					//save
					do_fn = true
			}
	}
		
	
	return do_fn //should the calling function be executed
}

function updateStack(){
	//this function replaces the check_changes dialogues - now we always save changes to the stack
	// remove visual style classes
	remove_style();
	//unselect
	var selected = cy.elements(":selected")
	selected.unselect()
	var jdata = cy.json()['elements'];
	if('nodes' in jdata){ //it breaks if you can save an empty network to the stack
		window.stack[window.currentNwName] = JSON.stringify(cy.json()['elements']);
	}
};

//download data - either just the current view or the whole network stack
function save(what){
	if(what == 'view'){
		//convert the current view for saving
		var network_json = JSON.stringify(cy.json()['elements']);
	};
	if(what == 'all'){
		//save the whole stack
		//check whether the current view is stored in the stack
		var name = document.getElementById('nw_name').value
		
		updateStack(); //update the stack data for the currently loaded network
		
		window.stack.metadata = JSON.stringify(window.stack.metadata); //stringify the metadata - don't have to stringify-parse separately but it makes the metadata consistent with the network data
		var network_json = JSON.stringify(window.stack) //this can be parsed back to a functional stack with JSON.parse
		
		if($('#set_filename_form').length != 0){ //if the project id is not -1 we won't be able to edit the name because the form is deleted so length ==0
			var filename = document.getElementById('set_filename').value;
		} else {
			var currentdate = new Date(); 
			var filename = "Saved project: " + currentdate.getDate() + "/"
            + (currentdate.getMonth()+1)  + "." 
            + currentdate.getFullYear() + " @ "  
            + currentdate.getHours() + ":"  
            + currentdate.getMinutes() + ":" 
            + currentdate.getSeconds();
		}
		var blob = new Blob([network_json], {type: "text/plain;charset=utf-8"});
		saveAs(blob, filename + ".esynGraph.txt");	
		
		window.stack.metadata = JSON.parse(window.stack.metadata) //reset so it's functional again after saving!
	

	}
};

//javascript to show or hide the upload controls for csv files
function showDiv(selector){
	$(selector).collapse('show')
}
function hideDiv(selector){
	if($(selector).hasClass('in')){
		//only hide the content if it is currently visible
		$(selector).collapse('hide')
	}
}

//function to validate the upload form unput
function validUpload(){
	var colnums = ['#srcColNum','#tgtColNum'];
	var forms = ['#srcColForm','#tgtColForm'];
	var allok = true;
	clearUploadClasses(); //remove any previous warnings

	for (var i = 0; i < colnums.length; i++) {
		if($.isNumeric( $(colnums[i]).val() ) == false){
			$(forms[i]).addClass('has-error');
			allok = false;
		} 
		
	};

	//the type column can be 'none' or a number
 	var typeColVal = $('#typeColNum').val();
	if(!($.isNumeric(typeColVal)) && typeColVal != 'none'){
		$('#typeColForm').addClass('has-error');
		allok = false;
	}
	
	if(allok == true){
		uploadFile();
	} else {
		alert('Upload parameters not valid, please check.')
	}

}

function clearUploadClasses(){
	var forms = ['#srcColForm','#tgtColForm','#typeColForm'];
	for (var i = 0; i < forms.length; i++) {
		
		if($(forms[i]).hasClass('has-error')){
			$(forms[i]).removeClass('has-error');
		}
		
	};
}

//function to upload a file and determine the appropriate function to use to process it
function uploadFile(){
	//disable the button while uploading
	$('#file-upload-btn').prop('disabled','disabled')
	//process the selected file, attempt to use it to create a stack
	var fileInput = document.getElementById('file_upload');
	var file = fileInput.files[0];
	console.log('processing upload of:' + file.name + ' detected type: ' + file.type);
	/*file types:
	.csv -> "text/csv"
	.txt -> "text/plain" - i.e. tsv or esyn
	.cyjs -> "" (nothing)
	*/
	if(file.name.indexOf('esynPetriNet') >=0){
		alert('This is an esyN Petri Net file, please use the Petri Net tool.')
	} else {
		//alert($('input[name=upfiletype]:checked').val()); //get type from radio buttons

		var reader = new FileReader();
		//define function to run when reader is done loading the file
		reader.onload = function(e) {
			//detect the type of file
			var textType = /text.*/
			var excelType = /.ms-excel/
			if(file.type.match(textType) || file.type.search(excelType) >=0){
				console.log('text type')
				//esyn session, csv or tsv
				if(file.type.match('text/csv') || file.type.search(excelType) >=0){
					//a csv file
					console.log('csv')
					var srcCol = parseInt($('#srcColNum').val());
					var tgtCol = parseInt($('#tgtColNum').val());
					var typeCol = $('#typeColNum').val();
					if(typeCol != 'none'){
						typeCol = parseInt(typeCol);
					}
					var directed = $('#isDirected').is(':checked');
					var header = $('#hasHeader').is(':checked');

					uploadFromTC(reader.result,',',header,srcCol,tgtCol,typeCol,directed); //uploadFromTC(upfile, sep, header,srcCol,tgtCol,typeCol,directed)
					//uploadFromTC(reader.result,',',false);

					$('#myModal').modal('hide')
				} else {
					console.log('esyn session')
					//try to read as esyn session
					var uploaded_json = tryJSON(reader.result) // will be the JSON data if the text is JSON, otherwise false
					if(uploaded_json.hasOwnProperty('metadata')){
						//esyn session
						uploadFromEsyn(uploaded_json)
						$('#myModal').modal('hide')
					} else {
						alert("Error: Not a valid file type.")
					}
					
				}
				
			} else if(file.name.indexOf('.cyjs') >= 0){
				console.log('cyjs')
				//json data from cytoscape
				var uploaded_json = JSON.parse(reader.result)
				if(uploaded_json.hasOwnProperty('elements')){ //this is a .cyjs file from cytoscape desktop 
					console.log('cyjs test passed')
					uploadFromCytoscape(uploaded_json);
					$('#myModal').modal('hide')
				}
			} else {
				alert("Error: Not a valid file type.")
			}

		}
		
		//now load the files
		reader.readAsText(file);

	}

	//re-enable the button
	$('#file-upload-btn').prop('disabled',false);
};

/*
fileInput.addEventListener('change', function(e) {
	var file = fileInput.files[0];
	var textType = /text.*/ /*;
	console.log(file.type)
	if (file.type.match(textType) || file.name.indexOf('.cyjs') >= 0) {
		var reader = new FileReader();

		reader.onload = function(e) {
			//alert(reader.result)
			var uploaded_json = JSON.parse(reader.result)
			if(uploaded_json.hasOwnProperty('nodes')){
				//the uploaded file is a single network not a stack
				cy.load(uploaded_json) //load and display the network
				cy.layout({name:'preset'})
				console.log('network loaded')
			} else if(uploaded_json.hasOwnProperty('elements')){ //this is a .cyjs file from cytoscape desktop 
				var doload = confirm("Warning: uploading from Cytoscape will erase everything in the current session. Are you sure you want to continue?")
				if(doload){
					uploadFromCytoscape(uploaded_json);
				};
			} else {
				//the file is a network stack
				if(file.name.indexOf('esynmodel') >= 0 ){
					//it is the wrong type of file
					alert("This is a Model file, please use the Models tool.")
				} else {
					window.stack = uploaded_json
					window.stack.metadata = JSON.parse(window.stack.metadata)
					
					//update the dropdown list of options
					var nwselect = $('#nwlist')
					var nwOpts = '<option selected="selected" value="">Select a network</option>'
					for(val in window.stack){
						if(val != 'metadata'){
							bit = '<option value ="' + val + '">' + val + '</option>'
							nwOpts += bit
						};
					};
						
					nwselect.html(nwOpts)
					
					//hack to get upload to bypass network selection dropdown the first time
					//will be removed when upload is separated from the viewer
					
					var autoselect = Object.keys(window.stack)[1] //[1] not [0] because [0] is the metadata
					cy.load(JSON.parse(window.stack[autoselect])) //load and display the network
					cy.layout({name:'preset'})
					document.getElementById('nw_name').value = autoselect //set to name of current network
					window.currentNwName = autoselect;
					
					//apply the visual style classes
					update_style();
					
					//use something like this to also set the dropdown - need to guarantee it selects the right one, this doesn't fire an onchange
					//document.getElementById("nwlist").selectedIndex = 2;
					console.log('network loaded by autoselect hack')
			
					//printState();
				}
			};
		}

		reader.readAsText(file);	
	} else {
		 alert("File not supported. Must be JSON data as text.")
	}
});
*/


//upload a network from cytoscape 3 .cyjs format
function uploadFromCytoscape(cyjs_file){
	//this function creates a new network stack, starting from the uploaded cytoscape file
	//this function will completely wipe the stack and all metadata!
	//from a cytoscape file, there can't be any contains/ isa relationships
	//we're starting a new project so there can't be existing nodes with the same name and cytoscape doesn't have disperse nodes (so nothing added will be disperse)
	resetStack();
	default_marking = 0;
	var allNodes = [];
	//always use the first id if there is more than one
	for (var i = 0; i < cyjs_file.elements.nodes.length; i++) {

		allNodes.push( {group: "nodes", data: { id: cyjs_file.elements.nodes[i].data.id, name: cyjs_file.elements.nodes[i].data.name, marking: default_marking }, classes: 'place' } ) 

		//update node/place name metadata
		window.stack.metadata['place'][cyjs_file.elements.nodes[i].data.name] = default_marking;

		//update counter
		window.stack.metadata['nodecounter'] += 1;
	};

	var allEdges = [];
	for (var i = 0; i < cyjs_file.elements.edges.length; i++) {
		allEdges.push({ group: "edges", data: { id: cyjs_file.elements.edges[i].data.id, source: cyjs_file.elements.edges[i].data.source, target: cyjs_file.elements.edges[i].data.target, multiplicity: 1 }, classes: "normal" });
		window.stack.metadata['edgecounter'] += 1;
	};

	window.currentNwName = "Upload-result"
	document.getElementById('nw_name').value = window.currentNwName;

	cy.load({
			nodes: allNodes,
			edges: allEdges
		})

	//update the dropdown list of options
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)
	
	//apply the visual style classes
	update_style();

	cy.layout({name:'grid'})
}

///////upload from CSV
//toggle to enable a column for edge type
$('#hasTypeCol').change(function(){
	if(this.checked){
		//enable input of type column
		$('#typeColumnLabel').text('Type column');
		$('#typeColNum').prop("disabled","");
		$('#typeColNum').prop("value","");
	} else {
		//disable input of type column
		$('#typeColumnLabel').html('<del>Type column</del>');
		$('#typeColNum').prop("disabled","disabled");
		$('#typeColNum').prop("value","none");
	}
})
//function to upload from two column format
function uploadFromTC(upfile, sep, header,srcCol,tgtCol,typeCol,directed){ //input 1-based index for columns
	//upfile is the file from filereader
	//sep is the separator used e.g. tab, comma
	//header is boolean, whether or not the file has a header row
	//srcCol is the column to use as the source of the edge
	//srcCol, tgtCol, typeCol are all expected to be given as 1-based index, converted to 0-based
	//directed is boolean, whether or not th edge is directe
	srcCol = typeof srcCol !== 'undefined' ? srcCol-1 : 0; //srcCol-1 to convert to 0-based index
	tgtCol = typeof tgtCol !== 'undefined' ? tgtCol-1 : 1;
	if (typeCol != 'none') {
		typeCol = typeof typeCol !== 'undefined' ? typeCol-1 : 2;
	}
	directed = typeof directed !== 'undefined' ? directed : false;
	var startRow = header == true ? 1 : 0;
	var edgeClass = directed == true ? 'directed' : 'normal';
	console.log('src: ',srcCol," tgt: ",tgtCol,' type: ',typeCol,' startRow: ',startRow, ' edgeClass: ',edgeClass);

	resetStack();
	default_marking = 0;
	var allNodes = [];
	var allNames = [];
	var allIDs = [];
	var allEdges = [];

	console.log('start processing file')

	//there is an issue with newlines not being included, add them back
	//might be an effect of OS/ browser/ excel/ all of these
	if(upfile.search(/\n/) < 0){ //if there are no \n characters, convert to \n
		var newlines = upfile.replace(/\r/g, "\n");
	} else {
		var newlines = upfile;
	}
	var res = $.csv.toArrays(newlines); //try with a comma separator
	if(res[0].length == 1){
		//comma is not the right separator, try ';'
		var res = $.csv.toArrays(newlines, options={separator:';'});
	}
	//console.log('got: ' + res);
	//console.log(res)

	//get a unique list of nodes, create and assign ids, save mapping of name to ID
	searchCols = [srcCol,tgtCol];
	for (var i = startRow; i < res.length; i++) {
		//iterate over all rows from startRow (==1 if there is a header so it is skipped)
		for (var j = 0; j < searchCols.length; j++) {
		
			if(allNames.indexOf(res[i][searchCols[j]]) < 0){
				allNames.push(res[i][searchCols[j]])
				var setID = 'n' + window.stack.metadata.nodecounter.toString();
				allIDs.push(setID)

				allNodes.push( {group: "nodes", data: { id: setID, name: res[i][searchCols[j]], marking: default_marking }, classes: 'place' } ) 

				//update node/place name metadata
				window.stack.metadata['place'][res[i][searchCols[j]]] = default_marking;

				//update counter
				window.stack.metadata['nodecounter'] += 1;

			}
		}
	}
	//console.log(allIDs)
	//console.log(allNames)
	//start from startRow to skip header if needed
	for (var i = startRow; i < res.length; i++) {
		var srcid = allIDs[allNames.indexOf(res[i][srcCol])]
		var tgtid = allIDs[allNames.indexOf(res[i][tgtCol])]
		if(typeCol != "none"){
			var inttype = res[i][typeCol]
			inttype = inttype.toLowerCase()
			if(!(inttype == 'genetic' || inttype == 'physical')){
				inttype = ''
			} else {
				inttype = ' ' + inttype //add space if there will be multiple classes
			}
		} else {
			inttype = " "; //if no value is uploaded
		}
		//console.log('inttype',inttype)
		var setID = 'e' + window.stack.metadata.edgecounter.toString();
		allEdges.push({ group: "edges", data: { id: setID , source: srcid, target: tgtid, multiplicity: 1 }, classes: edgeClass + " " + inttype });
		window.stack.metadata['edgecounter'] += 1;
	};

	//console.log('nodes')
	//console.log(allNodes)
	//console.log('edges')
	//console.log(allEdges)

	window.currentNwName = "Upload-result"
	document.getElementById('nw_name').value = window.currentNwName;

	cy.load({
			nodes: allNodes,
			edges: allEdges
		})

	//update the dropdown list of options
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)
	
	//apply the visual style classes
	console.log('apply visual stype classes')
	update_style();
	console.log('start rendering graph')
	cy.layout({name:'grid'})

}

//function to upload from esyn format
function uploadFromEsyn(uploaded_json){
	console.log('uploadFromEsyn');
	window.stack = uploaded_json
	window.stack.metadata = JSON.parse(window.stack.metadata)
	
	//update the dropdown list of options
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)
	
	//hack to get upload to bypass network selection dropdown the first time
	//will be removed when upload is separated from the viewer
	var nn = Object.keys(window.stack);
	nn.splice(nn.indexOf('metadata'),1)
	var autoselect = nn[0] 
	cy.load(JSON.parse(window.stack[autoselect])) //load and display the network
	cy.layout({name:'preset'})
	document.getElementById('nw_name').value = autoselect //set to name of current network
	window.currentNwName = autoselect;
	
	//apply the visual style classes
	update_style();
	
	//use something like this to also set the dropdown - need to guarantee it selects the right one, this doesn't fire an onchange
	//document.getElementById("nwlist").selectedIndex = 2;
	console.log('network loaded by autoselect hack')

	//printState();
}

//function to download network data as a two-column csv file for import into cytoscape
//format: source, type, target \r\n
function exportToTC(what,nwname){
	//what can be 'all','merge', 'one', 'current' to export all networks, merge then export, the current network or a specified network
	//nwname must be a network name if what == 'one'

	//update stack for current network
	var jdata = cy.json()['elements'];
	if('nodes' in jdata){
		//alert('overwriting data for currently open network')
		window.stack[window.currentNwName] = JSON.stringify(jdata)
	};

	var edges = [];
	var nodes = [];
	var idmap = {};
	if(what == 'all'){
		
		var allNwNames = Object.keys(window.stack)
		allNwNames.splice(allNwNames.indexOf('metadata'),1) //remove metadata from the list of networks
		if(allNwNames.indexOf('Merge-result') >= 0){
			allNwNames.splice(allNwNames.indexOf('Merge-result'),1) //remove merge network from the list of networks
		}
		for(var i=0; i<allNwNames.length; i++){
			var tmp = JSON.parse(window.stack[allNwNames[i]]); //load network data - doesn't get displayed
			
			if('edges' in tmp){ //if the network is empty calling Object.keys gives an error
				edges = edges.concat(tmp.edges);
				nodes = nodes.concat(tmp.nodes);
			}
		}
	} else if(what == 'merge'){

		var mres = merge();
		nodes = mres.nodes;
		edges = mres.edges;

	} else {
		if(what == 'current'){
			var nwname = window.currentNwName;
		}
		var nwdata = JSON.parse(window.stack[nwname]);
		edges = edges.concat(nwdata.edges);
		nodes = nodes.concat(nwdata.nodes);
	}
	
	//create a mapping from id to name - edges are stored between ids
	for (var i = 0; i < nodes.length; i++) {
		idmap[nodes[i].data.id] = nodes[i].data.name; 
	};
	

	var rows = '"source","type","target","citations",\r\n';
	for (var i = 0; i < edges.length; i++) {
		var type = edges[i].classes.split(' ');
		type = type[type.length - 1];
		var c = ""; //default value
		if(window.stack.metadata.citations.hasOwnProperty(edges[i].data.id)){
			c = window.stack.metadata.citations[edges[i].data.id].join(', ');
		}
		
		rows += '"' + idmap[edges[i].data.source] + '","' + type + '","' + idmap[edges[i].data.target] + '","' + c +'" \r\n';
	};

	var blob = new Blob([rows], {type: "text/plain;charset=utf-8"});
	saveAs(blob, 'generated_csv.csv');
}


/*This function is being tested, it lets you import into an existing stack but is very CPU intensive due to cy.filter*/

function uploadIntoFromCytoscape(cyjs_file){
	//works directly with the object in a .cyjs file
	var allNodes = [];
	var allTmpNames = [];
	var allNames = [];
	var allIDs = [];
	default_marking = 0;
	//always use the first id if there is more than one
	for (var i = 0; i < cyjs_file.elements.nodes.length; i++) {
		default_name = "__TEMP__" + cyjs_file.elements.nodes[i].data.id;

		//track the default names an actual names for making disperse places later
		allTmpNames.push(default_name);
		allNames.push(cyjs_file.elements.nodes[i].data.name);
		allIDs.push(cyjs_file.elements.nodes[i].data.id);

		//the name is set to the id at first then updated - this way we can handle making disperse places more easily
		allNodes.push( {group: "nodes", data: { id: cyjs_file.elements.nodes[i].data.id, name: default_name, marking: default_marking }, classes: 'place' } ) 

		//update counter
		window.stack.metadata['nodecounter'] += 1;
		//update node/place name metadata
		window.stack.metadata['place'][default_name] = default_marking;
	};

	var allEdges = [];
	for (var i = 0; i < cyjs_file.elements.edges.length; i++) {
		allEdges.push({ group: "edges", data: { id: cyjs_file.elements.edges[i].data.id, source: cyjs_file.elements.edges[i].data.source, target: cyjs_file.elements.edges[i].data.target, multiplicity: 1 }, classes: "normal" });
		window.stack.metadata['edgecounter'] += 1;
	};
	
	window.currentNwName = "Upload-result"
	document.getElementById('nw_name').value = window.currentNwName;

	cy.load({
			nodes: allNodes,
			edges: allEdges
		})

	//check if we're making a disperse place - the node has to already exist as a normal place for this to work
	for (var i = 0; i < allIDs.length; i++) {
		var newNode = cy.filter("node[id = '" + allIDs[i] +"']");
		if(allNames[i] in window.stack.metadata.place){
				make_disperse(newNode,allNames[i]); 
		} else {
			update_place(newNode, allNames[i], default_marking);
		};
	};
	
	//update the dropdown list of options
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)
	
	//apply the visual style classes
	update_style();

	cy.layout({name:'grid'})
}

////////////////// upload a list of genes, generate the network using biogrid/ pombase
//helper for generateNetwork, sorts out the options
function setupNetworkGenerator(){
	//delete the current project - at the moment fromBiogrid and loadCuratedPombe will add to an existing project but they don't check things like disperse places.
	cy.filter().select().remove()
	resetStack();

	startLoadAnimation()

	var includeInteractors = $('#gen_incl_interactors').prop("checked")
	var organismsource = $('#org_generate_nw').val()
	organismsource = organismsource.split('|')
	var organism = organismsource[0]
	var source = organismsource[1]
	var intType = $('#gen_int_type').val()
	var throughput = $('#gen_int_throughput').val()
	var colourSource = "false"
	var colourCommInteract = "false"
	var interInter = "false"
	var layout = "ForceDirected"

	var identifierType = $("#gen_selectIdentifierType").val() //only used for flymine

	//determine whether we're uploading a file or not
	var fileInput = document.getElementById('gen_file_upload');
	if(fileInput.files.length == 0){
		var genes = $("#gen_list_text").val()
		genes = genes.split(',')
		genes = genes.map(function(el){return el.replace(' ','')}) //strip preceeding whitespace

		generateNetwork(genes, organism, intType, includeInteractors, colourSource, colourCommInteract, interInter, throughput, source, identifierType,layout)


	} else {
		//upload from file
		var file = fileInput.files[0]
		var reader = new FileReader();
		//define function to run when reader is done loading the file
		reader.onload = function(e) {
			//detect the type of file
			var textType = /text.*/
			var excelType = /.ms-excel/
			if(file.type.match(textType) || file.type.search(excelType) >=0){
				console.log('text type')

				if(reader.result.search(/\r\n/) >= 0 ){
					console.log("double line breaks")
					var newlines = reader.result.replace(/[\r\n]+/g, "\n")
				} else { 
					if(reader.result.search(/\n/) < 0){ //if there are no \n characters, convert to \n
						var newlines = reader.result.replace(/\r/g, "\n");
					} else {
						var newlines = reader.result;
					}
				}
				var genes = newlines.split("\n")
				console.log(genes)

				generateNetwork(genes, organism, intType, includeInteractors, colourSource, colourCommInteract, interInter,throughput, source, identifierType,layout)
			
			} else {
				alert("Error: Not a valid file type.")
			}

		}
		
		//now load the files
		reader.readAsText(file);
	}
	
}

//generate a network usig the genes in the genes array

function generateNetwork(genes, organism, intType, includeInteractors, colourSource, colourCommInteract, interInter, throughput, source, identifierType,layout){
	if(organism == "pombase"){
		//use pombase curated data
		console.log("generate from pombase")
		//loadCuratedPombe(genes, inttype, includeInteractors, identifierType, networkName
		loadCuratedPombe(genes, intType, includeInteractors, 'any', window.currentNwName)
	} else {
		if(source == "biogrid"){
			//use biogrid
			console.log("generate from biogrid")
			//the false parameter is interactorInteractions, which we don't have for pombase
			fromBiogrid(genes,organism,includeInteractors,false,'json',intType, throughput, window.currentNwName, addFromBiogrid)
		}
		if(source == "intermine"){
			//user intermine
			console.log('generate from intermine')
			fromIntermine(genes, intType, organism, includeInteractors, identifierType, intermineToGraph)
		}
		if(source == "flybase"){
			//loadFlybase(genes, inttype, includeInteractors, identifierType, networkName)
			loadFlybase(genes, intType, includeInteractors, colourSource, colourCommInteract, interInter, "any", window.currentNwName,layout)
		}
	}

	$('#generateModal').modal('hide')
	//loadCuratedPombe and fromBiogrid will ultimately stop the loading animation themselves
}


//CREATE A NEW NETWORK
//save the current network in the stack
function newnw(){
	//save the data for the currently loaded network
	updateStack();

	//assign the next default name to the new network
	window.currentNwName = getDefaultNwName();
	document.getElementById('nw_name').value = window.currentNwName;
	
	//create a new blank view
	cy.load()
	cy.layout({name:'grid'}) //must be grid to allow node creation
	//printState()
	
	//update the dropdown list of existing networks
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)
		
	
}

//function to nest a network within the currently selected node
function nestWithin(nodeName){
	//when the user clicks "nest within", we will automatically create a new network name it the same as the selected node
	//if you nest a network within a disperse place, all appearances will contain the same network

	updateStack();

	//update the list of networks and clear the window
	
	//DON'T PROMPT FOR A NAME
	//document.getElementById('nw_name').value = 'network_name' //reset to default
	window.currentNwName = nodeName;
	document.getElementById('nw_name').value = window.currentNwName;
	
	//create a new blank view
	cy.load()
	cy.layout({name:'grid'}) //must be grid to allow node creation
	//printState()
	
	//update the dropdown list of existing networks
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)

	//clear the info panel
	clear();

};

//reload an existing network
$("select#nwlist").on('change',function(){ //rewrite to use same logic as newnw - add var to keep track of whether or not to do the swich

	updateStack();

	//load the pre-existing network that was selected
	load_from_stack($(this).val())
	
});

//function to load an existing network from the stack - used by the network list and also to load a different network after a network is deleted
function load_from_stack(nwname){
	//in case the user has started creating an edge then tries to swich networks
	cancel_edge() //otherwise source and target could be in different networks, which doesn't work

	//load the pre-existing network that was selected
		cy.load(JSON.parse(window.stack[nwname])) //load and display the network
		cy.layout({name:'preset'})
		document.getElementById('nw_name').value = nwname; //set to name of current network
		window.currentNwName = nwname;
		console.log('network loaded')
		
		//apply visual styles
		update_style();
		
		//update the info panel
		//printState();
		
		//update the dropdown list of existing networks
		var nwselect = $('#nwlist')
		var nwOpts = '<option selected="selected" value="">Select a network</option>'
		for(val in window.stack){
			if(val != 'metadata'){
				bit = '<option value ="' + val + '">' + val + '</option>'
				nwOpts += bit
			};
		};
			
		nwselect.html(nwOpts)
}

//function to load a network by name
function goTo(network){
	updateStack();
	load_from_stack(network);

};

///////////
//function to update visual style when a new network is loaded
function update_style(){
	var coarse_p = Object.keys(window.stack.metadata.contains);
	var disperse = Object.keys(window.stack.metadata.disperse);
	var coarse_t = Object.keys(window.stack);
	
	for(var i=0; i<coarse_p.length; i++){
		var toupdate = cy.filter("node[name = '" + coarse_p[i] +"']");
		toupdate.addClass('contains');
	};
	for(var i=0; i<disperse.length; i++){
		var toupdate = cy.filter("node[name = '" + disperse[i] +"']");
		toupdate.addClass('disperse');
	};
	for(var i=0; i<coarse_t.length; i++){
		var toupdate = cy.filter("node[name = '" + coarse_t[i] +"']");
		toupdate.addClass('coarsetransition');
	};
};

//function to remove all classes related to visual style
function remove_style(){
	var toupdate = cy.filter(function(i, element){
				if( element.isNode() && element.hasClass('contains') ){
					return true;
					}
					return false;
				});	
	toupdate.removeClass('contains');
	
	var toupdate = cy.filter(function(i, element){
				if( element.isNode() && element.hasClass('disperse') ){
					return true;
					}
					return false;
				});	
	toupdate.removeClass('disperse');
	
	var toupdate = cy.filter(function(i, element){
				if( element.isNode() && element.hasClass('coarsetransition') ){
					return true;
					}
					return false;
				});	
	toupdate.removeClass('coarsetransition');
	
				
};

//sandbox new UI prompt
function check_changes_modal(){
bootbox.dialog({
  message: "There are unsaved changes to the current network",
  title: "Save changes?",
  closeButton: false,
  animate: false,
  buttons: {
    success: {
      label: "Save changes",
      className: "btn-success",
      callback: function() {
        console.log('changes saved')
      }
    },
    danger: {
      label: "Discard changes",
      className: "btn-danger",
      callback: function() {
        console.log('changes discarded')
      }
    },
	cancel: {
		label: "Cancel",
		className: "btn-cancel",
		callback: function() {
			console.log('action was cancelled')
		}
    }
  }
});
}

//EDITOR FUNCTIONS
function cancel_edge(){
	//cancel edge creation after a source node has been clicked
	window.sourcenode = -1
	clear(); //remove any text from the display area
};

//CREATE MATRIX FOR SIMULATION
//places in columns, transitions in rows
//all multiplicities are positive
//marking, prearcs, postarcs, inhibitors
//use node id to place edges in the matrix as it is immutable. map id to name at the end
/*
//list places
var n = cy.nodes();
for(var i = 0; i<n.length; i++){if(n[i].hasClass('place')){console.log('place ' + n[i].id() + n[i].data('name'))}};

//find edge with source n0
var e = cy.edges()
for(var i=0; i<e.length; i++){if(e[i].data('source')=='n0'){console.log('edge from ' + e[i].data('source') + ' to ' + e[i].data('target'))}}
*/
function export_matrix(){
	//set up arrays
	var nodes = cy.nodes();
	var edges = cy.edges();
	var out = make_matrix(nodes,edges);
	out_json = JSON.stringify(out);
	//$('#output_area').append(out_json);
	var blob = new Blob([out_json], {type: "text/plain;charset=utf-8"});
	//saveAs(blob, document.getElementById('set_filename').value + '.txt');	
	saveAs(blob, 'generated_matrices' + '.txt');
};

function make_matrix(nodes,edges){
	var p_ids = [];
	var t_ids = [];
	var p_names = [];
	var t_names = [];
	var marking = [];
	var pre = []; //pre, post and inhib will be set to [TxP] array of 0's below
	var post = [];
	var inhib = [];
	
	
	//get a list of all places and transitions, fill in marking matrix
	for(var i=0; i<nodes.length; i++){
		var id = nodes[i].id();
		var name = nodes[i].data('name');
		if(nodes[i].hasClass('place')){
			p_ids.push(id);
			p_names.push(name);
			marking.push(nodes[i].data('marking'));	
		} else {
			t_ids.push(id);	
			t_names.push(name);
		}
	}
	
	//iterate through edges, fill in the pre, post and inhib matrices
	//pre is place->transition, post is transition->place. prearcs can be inhibitor or normal arcs, postarcs can only be normal
	//init as all 0
	var zeroes = [];
	for(var i = 0; i<p_ids.length; i++){
		zeroes.push(0);
	}
	for(var i=0; i<t_ids.length; i++){
		pre.push(zeroes.slice(0)); //can use slice for a shallow copy
		post.push(zeroes.slice(0));
		inhib.push(zeroes.slice(0));
	}
	
	//iterate through edeges
	for(var i=0; i<edges.length;i++){
		var e = edges[i];
		var src = e.data('source')
		var tgt = e.data('target')
		if(t_ids.indexOf(src) >=0){
		 	//the edge source is a transition
			//has to be a postarc
			//get index of source and target
			srcidx = t_ids.indexOf(src);
			tgtidx = p_ids.indexOf(tgt);
			post[srcidx][tgtidx] = e.data('multiplicity')
				
		} else {
			//the edge source is a place
			srcidx = p_ids.indexOf(src);
			tgtidx = t_ids.indexOf(tgt);
			//could be a normal or an inhibitor edge
			if(e.hasClass('inhibitor')){
				//inhibitor edge
				inhib[tgtidx][srcidx] = e.data('multiplicity')
			} else {
				//normal edge
				pre[tgtidx][srcidx] = e.data('multiplicity')
			};
		}; 
	}
	
	
	//output
	/*
	$('#output_area').html('<p> places: ' + p_ids + '</p><p>transitions: ' + t_ids + '</p>');
	printmatrix(pre,'pre',t_ids)
	printmatrix(post,'post',t_ids)
	printmatrix(inhib,'inhib',t_ids)
	
	$('#output_area').append('<p> marking: ' + marking + '</p>')
	*/
	//make a json object for output
	var out = {};
	out['pnames'] = p_names;
	out['tnames'] = t_names;
	out['pre'] = pre;
	out['post'] = post;
	out['inhib'] = inhib;
	out['marking'] = marking;
	
	return out;
};


function printmatrix(m,name,transitions){
	//only used for debugging
	//transitions is t_ids from the export_matrix() function
	$('#output_area').append('<p>' +  name +': ');
	for(var i = 0; i<transitions.length; i++){
		$('#output_area').append('<br>' + m[i] )	
	}
	$('#output_area').append('</p>');
};

function megamerge(){ 
	/*
	merge all networks and display the result
	*/
	
	var mres = merge();
	
	window.currentNwName = "Merge-result"
	document.getElementById('nw_name').value = window.currentNwName;

	cy.load({
			nodes: mres.nodes,
			edges: mres.edges
		})

	cy.layout({name:'grid'})

	//update the dropdown list of existing networks
	var nwselect = $('#nwlist')
	var nwOpts = '<option selected="selected" value="">Select a network</option>'
	for(val in window.stack){
		if(val != 'metadata'){
			bit = '<option value ="' + val + '">' + val + '</option>'
			nwOpts += bit
		};
	};
		
	nwselect.html(nwOpts)

	
};

//for compatibility with app_petri
//check whether anything calls megamerge directly, could probably change the name of that function to mergeAndView
//citations for edges are maintained in the merge result because merge() reuses the same edge ids
//citations for edges connected to nodes containing networks won't be accessible because the edge won't be there
function mergeAndView(){
	megamerge() 
}

function merge(){
	/*
	merge all networks and RETURN the result as {nodes: [nodes], edges: [edges]}
	need to use NAME for edges not ID
	*/
	//check if there is anything in the current network, if so then add it to the stack
	var jdata = cy.json()['elements'];
	if('nodes' in jdata){
		//alert('overwriting data for currently open network')
		window.stack[window.currentNwName] = JSON.stringify(jdata)
	};

	// //pre-process the network so that ids will be unique in the final network
	// //make a copy of the whole project and reset all the ids
	// console.log('pre-processing network')
	// var ppn = JSON.stringify(window.stack)
	// ppn = JSON.parse(ppn)
	// ppn = ppProject(ppn)
	// console.log(ppn)

	//generate the real network from a network with coarse transitions
	//have to map id back to name to place edges when merging - IDs will all be unique even if the name is the same
	//ID -> NAME will be many -> one
	console.log('start megamerge')
	//go through each graph in the stack, create a list of all nodes and edges
	var nodes = [];
	var edges = [];
	
	console.log('get all nodes and edges')
	var allNwNames = Object.keys(window.stack)
	allNwNames.splice(allNwNames.indexOf('metadata'),1) //remove metadata from the list of networks
	if(allNwNames.indexOf('Merge-result') >= 0){
		allNwNames.splice(allNwNames.indexOf('Merge-result'),1) //remove merge network from the list of networks
	}
	for(var i=0; i<allNwNames.length; i++){
		var tmp = JSON.parse(window.stack[allNwNames[i]]); //load network data - doesn't get displayed
		
		if('nodes' in tmp){ //if the network is empty calling Object.keys gives an error
			var tmp_n = Object.keys(tmp.nodes)
			for(var j=0; j<tmp_n.length;j++){ //needed to build the idmap later
				nodes.push(tmp.nodes[tmp_n[j]]);
			};
			//check that the network contains edges
			if(tmp.hasOwnProperty('edges')){
				var tmp_e = Object.keys(tmp.edges)
				for(var j=0; j<tmp_e.length;j++){
					edges.push(tmp.edges[tmp_e[j]]);
				};	
			};
		}
	};
	
	
	//make the matrix - can't use make_matrix() as that requires cytoscape to load the network first
	var p_ids = [];
	var t_ids = [];
	var p_names = [];
	var t_names = [];
	var marking = [];
	var pre = []; //pre, post and inhib will be set to [TxP] array of 0's below
	var post = [];
	var inhib = [];
	var idmap = {}; //used to map node ID's to names
	var namemap = {}; //used to make node name to IDs
	var unique_p = Object.keys(window.stack.metadata.place);
	var unique_t = Object.keys(window.stack.metadata.transition);
	
	console.log('sort nodes into places and transitions')
	//get a list of all places and transitions
	for(var i=0; i<nodes.length; i++){
		var id = nodes[i].data['id'];
		var name = nodes[i].data['name'];
		if(nodes[i].classes.search('place') >= 0){ //places can now have multiple classes, which will all be one string so use the string .search() method, returns -1 if no match found
			p_ids.push(id);
			p_names.push(name);
			idmap[id] = name;
			if(name in namemap){
				namemap[name].push(id);
			} else {
				namemap[name] = [id];
			};
		} else {
			t_ids.push(id);	
			t_names.push(name);
			idmap[id] = name;
			
			//probably not needed
			if(name in namemap){
				namemap[name].push(id);
			} else {
				namemap[name] = [id];
			}
		}
	}
	//console.log(idmap);
	console.log('namemap:');
	console.log(namemap);
	
	console.log('delete coarse nodes and their edges')
	//delete coarse transition nodes and their edges
	var edgemap = makeEdgeMap(edges) //to make the edges searchable
	for(var i=0; i<p_ids.length; i++){ //t_names and t_ids refer to the same node at the same index
		//it is a coarse transition if the name == the name of a network
		if(allNwNames.indexOf(p_names[i]) >= 0){ // no two networks can have the same name so indexOf is ok, there can only up to 1 match
			//delete its edges from edges
			var del = [];
			if(edgemap.source.indexOf(p_ids[i]) >= 0){ //will be -1 if no occurrences
				var idx = findAll(edgemap.source, p_ids[i])
				del = idx
				/* this code was included here but we don't need to know anythign about the edges we remove in this case
				the code is also broken because the edg_src doesn't exist yet. If nothing breaks by removing it 
				then delete forever*/
				//use filter to get a new array of the edges where this node is the target
				//probably don't need .concat in this case?
				//edg_src = edg_src.concat( edges.filter(function(el){return el.data.source.indexOf(t_ids[j])>=0}) )
				//this: var edg_src = [edges[idx]] doesn't work because there can be MULTIPLE edges	
			};
			if(edgemap.target.indexOf(p_ids[i]) >= 0){
				var idx = findAll(edgemap.target, p_ids[i])
				//edg_tgt = edg_tgt.concat( edges.filter(function(el){return el.data.target.indexOf(t_ids[j])>=0}) )
				//var edg_tgt = [edges[idx]] see above
				if(del.length > 0) { //if some edges were already found
					del = del.concat(idx)
				} else {
					del = idx
				};
			};
			//build a new array with the items to be kept - if we delete iteratively then the index from del will become wrong after the first loop
			//could also loop in reverse order, starting with the highest value in del
			/* i.e. this is wrong
			for(var j=0; j<del.length; j++){
				edges.splice(del[j],1)	
			}
			*/ 
			
			var new_edges = [];
			for(var j=0; j<edges.length; j++){
				if(del.indexOf(j) < 0){ //if the index is not marked for removal, push it to the new array
					new_edges.push(edges[j])	
				};	
			};
			
			//copy the new list of edges into 'edges', update the searchable edgemap
			edges = new_edges;
			var edgemap = makeEdgeMap(edges)
			
			//delete the place from unique_p - doesn't matter if it still exists in the other lists because it won't have any edges mapping to it
			//mutiple IDs can map to each name, so only delete from unique P if we haven't already deleted it
			if(unique_p.indexOf(p_names[i]) >= 0){
				unique_p.splice(unique_p.indexOf(p_names[i]),1);
			}
			
			
		};
	};
	
	
	
	console.log('handle coarse places')
	//handle coarse places
	var queue = Object.keys(window.stack.metadata.contains); //all coarse places
	//work out the top level based on the nodes that contain other nodes but are not themselves contained by any other node
	//have to use a different method inside the loop but this works the first time
	var toplevel = []; //top level of hierarchy of unprocessed nodes
	var lowerlevel = []; //places still to be processed in the next iteration
	for(var i=0; i<queue.length; i++){
		if(!(queue[i] in window.stack.metadata.isa)){
			console.log(queue[i] + 'is a top level coarse place')
			toplevel.push(queue[i])
			
		} else {
			lowerlevel.push(queue[0])	
		};
	};
	
	while(toplevel.length > 0){
		//need to rebuild the edge map every time as edges are added and deleted in the loop
		var edgemap = makeEdgeMap(edges); //this makes the edges searchable by node id without loading the data into cytoscape
		//init newtop as empty array, will fill in during the loop. If it stays empty then the loop will exit because we reached the lowest level in the hierarchy
		var newtop = [] //places contained by the current top level places will be the top level in the next iteration
		
		//process top level places
		for(var i=0; i<toplevel.length; i++){
			//edges where the coarse place is the source
			var edg_src = [];
			var edg_tgt = [];
			var del = [];
			
			//get the edges for all appearances of this place
			//get all the ids that refer to the current toplevel place - this way a disperse place can be coarse
			var ids = namemap[toplevel[i]]
			
			for(var j = 0; j < ids.length; j++){
				//for every ID that refers to this top level place, get all the edges
				if(edgemap.source.indexOf(ids[j]) >= 0){ //will be -1 if no occurrences
					var idx = findAll(edgemap.source, ids[j])
					edg_src = edg_src.concat( edges.filter(function(el){return el.data.source == ids[j]}) )
					del = del.concat(idx);
				};
				if(edgemap.target.indexOf(ids[j]) >= 0){
					var idx = findAll(edgemap.target, ids[j])
					edg_tgt = edg_tgt.concat( edges.filter(function(el){return el.data.target == ids[j]}) )
					del = del.concat(idx);
					
				};		
			};
			
			//what place NAMES are contained by this place
			var subp = window.stack.metadata.contains[toplevel[i]] //these will be NAMES
			newtop = newtop.concat(subp) //add the names to the list to be used as the next top level
			
			//only add the edge to ONE appearance of each sub place - the edges of disperse places get pooled later
			var subp_id = [];
			for(var j = 0; j< subp.length; j++){
				var tmp = namemap[subp[j]]
				subp_id[j] = tmp[0] //only the first appearance
			};
			
			for(var j=0; j<edg_src.length; j++){
				for(var sp in subp_id){
					//make a new edge for each sub place	
					var tmp = cloneEdge(edg_src[j]); //duplicate the edge
					tmp.data['source'] = subp_id[sp]; //replace the coarse place with each place it contains
					edges.push(tmp)
				};
			};
			
			//repeat for edges where the coarse place is the target
			for(var j=0; j<edg_tgt.length; j++){
				for(var sp in subp_id){
					//make a new edge for each sub place	
					var tmp = cloneEdge(edg_tgt[j]); //duplicate the edge
					tmp.data['target'] = subp_id[sp]; //replace the coarse place with each place it contains
					edges.push(tmp)
				};
			};
			
			//delete all the edges for the coarse place - build a new array ignoring those indices that are marked for removal
			var new_edges = [];
			for(var j=0; j<edges.length; j++){
				if(del.indexOf(j) < 0){ //if the index is not marked for removal, push it to the new array
					new_edges.push(edges[j])	
				};	
			};
			edges = new_edges; //edgemap will be updated at the start of the next iteration
			
			//delete the place from unique_p
			unique_p.splice(unique_p.indexOf(toplevel[i]),1)	
			
		};
		
		//update the queue
		//every place that was contained by the previous top level is now at the top level
		var toplevel = [];
		for(var i = 0; i<newtop.length; i++){
			//remove any places from the top level that don't contain anything - i.e. we have reached the bottom for that branch of the hierarchy	
			if(newtop[i] in window.stack.metadata.contains){
				//only places that actually contain other places should be included
				toplevel.push(newtop[i])
			};
		};
		console.log(toplevel)
	};

	


	//construct a network from the edges
	/*
	var eles = cy.add([
  { group: "nodes", data: { id: "n0" }, position: { x: 100, y: 100 } },
  { group: "nodes", data: { id: "n1" }, position: { x: 200, y: 200 } },
  { group: "edges", data: { id: "e0", source: "n0", target: "n1" } }
]);
	*/


	var allNodes = [];
	//always use the first id if there is more than one
	for (var i = 0; i < unique_p.length; i++) {
		allNodes.push( {group: "nodes", data: { id: namemap[unique_p[i]][0], name: unique_p[i] }, classes: "place" } ) 
	};

	var allEdges = [];
	for (var i = 0; i < edges.length; i++) {
		srcid = edges[i].data.source
		tgtid = edges[i].data.target
		eclass = edges[i].classes; //will be a space separated string of classes

		//convert the old IDs to names then back to IDs, always taking the first ID
		srcid = namemap[idmap[srcid]][0]
		tgtid = namemap[idmap[tgtid]][0]

		console.log('source: ' + srcid + ', target: ' + tgtid)

		allEdges.push({ group: "edges", data: { id: edges[i].data.id, source: srcid, target: tgtid, multiplicity: 1 }, classes: eclass })
	};
	
	
	var result = {nodes: allNodes, edges: allEdges};
	return result;
}

function makeEdgeMap(edges){
	//from the array of all edges in the network, make an object containing two arrays - the source and target nodes for each edge
	//this makes the edges searchable by node id
	var edgemap = {};
	edgemap['source'] = [];
	edgemap['target'] = [];
	for(var i=0; i<edges.length; i++){
		edgemap.source.push(edges[i].data['source'])
		edgemap.target.push(edges[i].data['target'])
	};
	
	return edgemap
};

function cloneEdge(e){
	//copy an edge for use when merging networks and expanding coarse places
	//only copies the attributes needed to build the matrix, it is not a full cytoscape edge object (but contains enough info to make one with user-defined properties conserved)
	var copy = {};
	copy['data'] = {};
	copy['classes'] = e.classes;
	for(var attr in e.data){
		copy.data[attr] = e.data[attr]
	};
	return copy
};

function findAll(array,thing){
	var indices = [];
	var idx = array.indexOf(thing);
	while (idx != -1) {
    	indices.push(idx);
    	idx = array.indexOf(thing, idx + 1); //second argument is where to start searching from
	};
	return indices
};

//functions to  make sure the entered name is ok
function getNwName(){
	var entered_name = prompt('Name the new network:');            
	
	var okname = nameOK(entered_name);
	while(!okname){
		var entered_name = prompt('Name the new network:');
		var okname = nameOK(entered_name);
	};
	window.currentNwName = entered_name
	
};

function nameOK(name){
	if(name == null || name == ""){
		alert('you must enter a name')
		return false	
	} else if(name in window.stack){
		alert('The name ' + name + 'is already in use')
		return false	
	} else if (name == "Merge-result"){
		alert('The name "Merge-result" is reserved for use by the application.')
	} else {
		return true
	};
};


////////////////////// network-level modifications
//rename a network
function rename_network(){
	//for now only allow the currently loaded network to be changed
	//if the network is contained by a place, alert the user that the relationship will be lost
	if(window.currentNwName in window.stack.metadata.place){
		alert('You are renaming a network that is contained by a node - to maintain this relationship you must also rename the node(s) ' + window.currentNwName)
	}
	
	//save any changes to the currently loaded network to the stack
	updateStack();

	if(window.currentNwName == 'Merge-result' && Object.keys(window.stack).length > 2){
		//the merge result exists as part of a project stack (rather than as an exported network from another project) so can't be edited
		alert('Merge results cannot be edited within the same project. To edit, save this network as a new project.')
	} else {	
		bootbox.prompt("Enter the new name for this network:", function(newName){
			if(nameOK(newName)){
				//copy the data under the current name into a new object with the new name
				window.stack[newName] = window.stack[window.currentNwName];
		
				//delete the old name from the stack
				delete window.stack[window.currentNwName];
		
				//track down any disperse node metadata containing the old name and update the metadata
				var disp = Object.keys(window.stack.metadata.disperse);
				for(var i=0; i<disp.length; i++){
					var foundInNw = Object.keys(window.stack.metadata.disperse[disp[i]]);
					//if the network we're renaming is one of the networks that this disperse place is found in, update the metadata
					var w = foundInNw.indexOf(window.currentNwName);
					if(w >= 0){
						window.stack.metadata.disperse[disp[i]][newName] = window.stack.metadata.disperse[disp[i]][window.currentNwName]
						delete window.stack.metadata.disperse[disp[i]][window.currentNwName];
					};
				}
				
				//update currentNwName
				window.currentNwName = newName;
				document.getElementById('nw_name').value = newName;
				
				//update nwlist dropdown
				var nwselect = $('#nwlist')
				var nwOpts = '<option selected="selected" value="">Select a network</option>'
				for(val in window.stack){
					if(val != 'metadata'){
						bit = '<option value ="' + val + '">' + val + '</option>'
						nwOpts += bit
					};
				};
					
				nwselect.html(nwOpts)
				
				//update visual styles - for some reason they disappear
				remove_style();
				update_style();
			}
			
		});
				
	}
	
};


//delete a network - for now only allow the currently selected network to be deleted, so I can use the existing remove_element function and just select all beforehand
function remove_network(){
	//the network to be removed is the currently loaded one
	//select all
	var sure = confirm('Are you sure you want to delete this network? This action cannot be undone!')
	if(sure == true){
		var all = cy.filter()
		all.select()

		//delete all the elements, updating metadata accordingly
		remove_element() //this will delete all currently selected nodes

		//now delete the current network from the stack
		delete window.stack[window.currentNwName];

		//now load a different network
		var nn = Object.keys(window.stack);
		nn.splice(nn.indexOf('metadata'),1)
		var autoselect = nn[0] 
		
		load_from_stack(autoselect);
	};
};

///////////////////// save and load from the server
function save_to_server(ignore_pid){
	ignore_pid = typeof ignore_pid !== 'undefined' ? ignore_pid : 'continue';
	//window['esynOpts'] =  {projectid: '-1'};
	updateStack()

	//if the current network is empty and there is nothing else in the stack, prevent saving
	var allNwNames = Object.keys(window.stack)
	allNwNames.splice(allNwNames.indexOf('metadata'),1);
	var dosave = true;
	if(allNwNames.length == 0){
		dosave = false;
	}

	if(dosave){
		if($('#set_filename_form').length != 0){ //if the project id is not -1 we won't be able to edit the name
			var labeltxt = document.getElementById('set_filename').value;
		} else {
			var currentdate = new Date(); 
			var labeltxt = "Saved project: " + currentdate.getDate() + "/"
            + (currentdate.getMonth()+1)  + "/" 
            + currentdate.getFullYear() + " @ "  
            + currentdate.getHours() + ":"  
            + currentdate.getMinutes() + ":" 
            + currentdate.getSeconds();
		}
		labeltxt = encodeURIComponent(labeltxt);

		window.stack.metadata = JSON.stringify(window.stack.metadata); //we always need to stringify the metadata before saving
		if(window.esynOpts.projectid == '-1' || ignore_pid == 'ignore'){ //we haven't been given an ID yet
			if(ignore_pid == 'ignore'){
				labeltxt += ' (copy)';
			}
			//Ajax request
			console.log('saving: ' + JSON.stringify(window.stack));
			console.log('with label: ', labeltxt)
			
			$.ajax({ url: '../manager.php', //was '../manager.php'
				 data: {action: 'save', label: labeltxt, data: JSON.stringify(window.stack), type: window.esynOpts.type },
				 type: 'post',
				 dataType: 'text',
				 success: function(response){
					 console.log('the response :')
					 console.log(response)
					 console.log('end of response')
					 response = JSON.parse(response)
					 if(response['success'] == true){
					 	window.esynOpts.projectid = response['projectid']; //get the project id we have been assigned
					 	console.log('now working on session id: ' + window.esynOpts.projectid)
					 	if(ignore_pid == "continue"){
							alert('Saved successfully.')
						} else {
							//if we saved a copy, make it clear that we are still working on the original
							if(window.esynOpts.publishedid != -1){
								alert('Copy saved successfully, go to "My esyN" to edit it')
							} else {
								alert('Copy saved successfully, you are now working on the copy.')
								//change the project name text box
								var old = document.getElementById('set_filename').value;
								document.getElementById('set_filename').value = old + ' (copy)'
							}
						}
					 } else {
					 	//there are no permissions for new project ids so probably a size issue
					 	alert("Save failed. \n if this project is very large, it may not be supported by our database at this time. In this case, please save your project offline. If you believe this is an error, please contact info@esyn.org")
					 }
				 }
				 })
			 
			 
		} else {
			//saving a new version of an existing session
			pid = window.esynOpts.projectid;
			$.ajax({ url: '../manager.php', //was '../manager.php'
				 data: {action: 'save', label: labeltxt, projectid: pid, type: window.esynOpts.type, data: JSON.stringify(window.stack)},
				 type: 'post',
				 dataType: 'text',
				 success: function(response){
					 console.log(response)
					 response = JSON.parse(response)
					 if(response['success'] == true){
						 alert('Saved successfully.')
					 } else {
					 	//the save failed
					 	//check if it's a permissions issue
					 	if (response['message'] == "You do not have permission to complete this action."){
					 		alert("Save failed. \n You do not have permission to save a new version of this project online. You can still save your changes offline or as your own copy online. If you believe this is an error, please contact info@esyn.org")
					 	} else {
					 		//probably a size issue
					 		alert('Save failed. \n if this project is very large, it may not be supported by our database at this time. In this case, please save your project offline. If you believe this is an error, please contact info@esyn.org')
					 	}
					 	
					 }
				 }
			});
	
		};

		//undo the stringify needed to save
		window.stack.metadata = JSON.parse(window.stack.metadata);
		update_style(); //visual style classes removed by updateStack

		//disable the box that lets you set the name
		$('#set_filename').prop("disabled",true);
	} else {
		alert('Nothing was saved.')
	}
	
};

function load_from_server(){ //add history id
	//Ajax request

	//if we're loading a published project
	if(window.esynOpts.publishedid != '-1'){

		//load from published data
		var id = window.esynOpts.publishedid;
		console.log('trying to load a published graph id: ' + id);
		$.ajax({ url: '../manager.php',
	         data: {action: 'viewpublished', publishedid: id},
	         type: 'get',
			 dataType: 'text',
	         success: function(uploaded_json) {
				//console.log(uploaded_json);
	            //the file is a network stack
				//window.stack = JSON.parse(uploaded_json) //needed when coming from database
				var result = JSON.parse(uploaded_json);
				if(result.hasOwnProperty('success')){
					alert('The selected project could not be loaded. If you think this is an error please contact the administrators.')

					//continue a if we were starting a new project
					window.currentNwName = getDefaultNwName();
					document.getElementById('nw_name').value = window.currentNwName;
				} else {
					window.stack = result;
					//console.log(window.stack)
					window.stack.metadata = JSON.parse(window.stack.metadata)
					if(!window.stack.metadata.hasOwnProperty('nodecounter')){
						//check whether we have double escaped
						window.stack.metadata = JSON.parse(window.stack.metadata)
					}
					if(window.stack.metadata.hasOwnProperty('k') == false){
						window.stack.metadata['k'] = {} //for compatibility with projects saved before k added

					}
					if(!window.stack.metadata.hasOwnProperty('citations')){
						window.stack.metadata['citations'] = {}// init citations when loading networks created before we included them
					}

					//if we're setting up the embedded viewer, create the dropdown if needed
					if(window.esynOpts.embedded == "true"){
						console.log("create dropdown if needed")
						if (_.keys(window.stack).length > 2){
							console.log("creating dropdown")
							document.getElementById("embed_btns").innerHTML += ' <div id="nwlist-container"><select id="nwlist" class="form-control form-control-sm"><option selected="selected" value="">Select a network</option></select></div>'
							$("select#nwlist").on('change',function(){ //rewrite to use same logic as newnw - add var to keep track of whether or not to do the swich
								  updateStack();
								  //load the pre-existing network that was selected
								  load_from_stack($(this).val())
							});
						} else {
							console.log("dropdown not needed")
						}
					}
					
					//update the dropdown list of options
					var nwselect = $('#nwlist')
					var nwOpts = '<option selected="selected" value="">Select a network</option>'
					for(val in window.stack){
						if(val != 'metadata'){
							bit = '<option value ="' + val + '">' + val + '</option>'
							nwOpts += bit
						};
					};
						
					nwselect.html(nwOpts)
					
					//hack to get upload to bypass network selection dropdown the first time
					//will be removed when upload is separated from the viewer
					
					var nn = Object.keys(window.stack);
					nn.splice(nn.indexOf('metadata'),1)
					var autoselect = nn[0] 
					cy.load(JSON.parse(window.stack[autoselect])) //load and display the network
					cy.layout({name:'preset'})
					
					document.getElementById('nw_name').value = autoselect //set to name of current network
					window.currentNwName = autoselect //otherwise currentNwName will be undefined and will break updateStack()

					//apply the visual style classes
					update_style();
					
					//use something like this to also set the dropdown - need to guarantee it selects the right one, this doesn't fire an onchange
					//document.getElementById("nwlist").selectedIndex = 2;
					console.log('network loaded by autoselect')
				
					//printState();
				}
	        } //close success
		}); //close ajax

	} else {
		var id = window.esynOpts.projectid;
		var version = window.esynOpts.historyid;
		console.log('trying to load a private or shared graph id: ' + id);
		//if we're loading a private/ shared project
		$.ajax({ url: '../manager.php',
	         data: {action: 'view', projectid: id, historyid : version},
	         type: 'get',
			 dataType: 'text',
	         success: function(uploaded_json) {
				//console.log(uploaded_json)
	            //the file is a network stack
				//window.stack = JSON.parse(uploaded_json) //needed when coming from database
				var result = JSON.parse(uploaded_json);
				if(result.hasOwnProperty('success')){
					alert('The selected project could not be loaded. If you think this is an error please contact the administrators.')

					//continue a if we were starting a new project
					window.currentNwName = getDefaultNwName();
					document.getElementById('nw_name').value = window.currentNwName;
				} else {
					window.stack = result;
					//console.log(window.stack)
					window.stack.metadata = JSON.parse(window.stack.metadata)
					if(!window.stack.metadata.hasOwnProperty('nodecounter')){
						//check whether we have double escaped
						window.stack.metadata = JSON.parse(window.stack.metadata)
					}
					if(window.stack.metadata.hasOwnProperty('k') == false){
						window.stack.metadata['k'] = {} //for compatibility with projects saved before k added
					}
					if(!window.stack.metadata.hasOwnProperty('citations')){
						window.stack.metadata['citations'] = {}// init citations when loading networks created before we included them
					}

					//if we're setting up the embedded viewer, create the dropdown if needed
					if(window.esynOpts.embedded == "true"){
						console.log("create dropdown if needed")
						if (_.keys(window.stack).length > 2){
							console.log("creating dropdown")
							document.getElementById("embed_btns").innerHTML += ' <div id="nwlist-container"><select id="nwlist" class="form-control form-control-sm"><option selected="selected" value="">Select a network</option></select></div>'
						$("select#nwlist").on('change',function(){ //rewrite to use same logic as newnw - add var to keep track of whether or not to do the swich
								  updateStack();
								  //load the pre-existing network that was selected
								  load_from_stack($(this).val())
							});
						} else {
							console.log("dropdown not needed")
						}
					}
					
					//update the dropdown list of options
					var nwselect = $('#nwlist')
					var nwOpts = '<option selected="selected" value="">Select a network</option>'
					for(val in window.stack){
						if(val != 'metadata'){
							bit = '<option value ="' + val + '">' + val + '</option>'
							nwOpts += bit
						};
					};
						
					nwselect.html(nwOpts)
					
					//hack to get upload to bypass network selection dropdown the first time
					//will be removed when upload is separated from the viewer
					
					var nn = Object.keys(window.stack);
					nn.splice(nn.indexOf('metadata'),1)
					var autoselect = nn[0]  //[1] not [0] because [0] is the metadata
					cy.load(JSON.parse(window.stack[autoselect])) //load and display the network
					cy.layout({name:'preset'})
					
					document.getElementById('nw_name').value = autoselect //set to name of current network
					window.currentNwName = autoselect //otherwise currentNwName will be undefined and will break updateStack()
					
					//apply the visual style classes
					update_style();
					
					//use something like this to also set the dropdown - need to guarantee it selects the right one, this doesn't fire an onchange
					//document.getElementById("nwlist").selectedIndex = 2;
					console.log('network loaded by autoselect')
				
					//printState();
				}
            }
		});
	};
	
};


//the old function
function load_stack(){
	//function to retrieve and set up a saved stack from the database via Ajax and PHP
	//will want to add parameters to set what is loaded
	//the test location is: http://www.eyeast.org/myeyeasttest/manager.php?action=view&groupid=1
	
	//Ajax request
	$.ajax({ url: 'http://www.eyeast.org/myeyeasttest/manager.php',
         data: {action: 'view', groupid: '1'},
         type: 'get',
		 dataType: 'text',
         success: function(uploaded_json) {
            //the file is a network stack
			window.stack = JSON.parse(uploaded_json) //needed when coming from database
			//console.log(uploaded_json)
			window.stack.metadata = JSON.parse(window.stack.metadata)
			
			//update the dropdown list of options
			var nwselect = $('#nwlist')
			var nwOpts = '<option selected="selected" value="">Select a network</option>'
			for(val in window.stack){
				if(val != 'metadata'){
					bit = '<option value ="' + val + '">' + val + '</option>'
					nwOpts += bit
				};
			};
				
			nwselect.html(nwOpts)
			
			//hack to get upload to bypass network selection dropdown the first time
			//will be removed when upload is separated from the viewer
			
			var nn = Object.keys(window.stack);
			nn.splice(nn.indexOf('metadata'),1)
			var autoselect = nn[0] 
			cy.load(JSON.parse(window.stack[autoselect])) //load and display the network
			cy.layout({name:'preset'})
			document.getElementById('nw_name').value = autoselect //set to name of current network
			
			//apply the visual style classes
			update_style();
			
			//use something like this to also set the dropdown - need to guarantee it selects the right one, this doesn't fire an onchange
			//document.getElementById("nwlist").selectedIndex = 2;
			console.log('network loaded by autoselect')
		
			//printState();
	
                  }
	});
	
	
};

function getDefaultNwName(){
	//generate the next available default name
	var nws = Object.keys(window.stack);
	var n = nws.length -1; //metadata shouldn't be included
	var name = 'Network' + n;
	var i = 0
	while(nws.indexOf(name) >= 0 && i < 100){
		n += 1;
		name = "Network" + n;
		i += 1;
	}
	if(i == 100){
		alert("a network name could not be generated, please contact an administrator")
		name = "__NAME__" //set to an unlikely name
	}
	return name;
}

function resetStack(){
	//set up global variables
	window.nmode = true;
	window.sourcenode = -1; //will track the id of the source node in edge creation
	window.sourcetype = -1; //will track the type of the course node in edge creation
	window.ntype = "place" //type of node to be added
	window.etype = "normal" //type of edge to be added
	window.nodecounter = 0; //to keep track of the number of nodes that have been created

	//window.currentNwName is set up by cytoscape onload
	window.workingID = "none"; //the ID to use for the current stack when saving. If "none" then we are starting a new stack and will be given an ID to use

	//network data stack
	window.stack = {}
	window.stack['metadata'] = {} //to keep track of stack-level properties e.g. number of nodes
	window.stack.metadata['nodecounter'] = 0;
	window.stack.metadata['edgecounter'] = 0; //keep track of the number of edges that have been created - otherwise if you delete edges you can't add new ones any more
	//call the place and transition trackers the same as window.ntype so that can be used to access the correct data
	window.stack.metadata['place'] = {}; //object for all stack place names to keep track of adding disperse places
	window.stack.metadata['transition'] = {}; //object for all transition names to prevent duplicates - could use a list? this way they're accessed the same as pnames
	//trackers for place classes. Entries only exist of they are not default (normal place with no classes)
	window.stack.metadata['contains'] = {} //what places are a sub class of each coarse place
	window.stack.metadata['isa'] = {} //what coarse places each node is a sub class of
	//keep track of disperse places
	window.stack.metadata['disperse'] = {} //keyed by disperse place NAME -> network: [id(s)]
	//keep track of parameter k
	window.stack.metadata['k'] = {} //keyed by place NAME -> k (if a name is not a key for this network we know k is 1)
	//store citations for elements
	window.stack.metadata['citations'] = {} //keyed by element ID -> [pmids]
	//store experimental systems from biogrid
	window.stack.metadata['systems'] = {} //only used by addFromBiogrid and setupedgemodal


	//if we have a project id, the user cannot change the label from the editor so hide the input box
	if(window.esynOpts.projectid != '-1' || window.esynOpts.publishedid != '-1'){
		$('#set_filename_form').remove();
	};

	//if we're working with a published project, disable to save button
	//even if somebody re-enabled it, the save function would create a new project id
	if(window.esynOpts.publishedid != '-1'){
		$('#save-online').prop('disabled',true);
	};
}

///////////modal to view edge details
function setupedgemodal(id){
	var txt = "<p>Experimental systems used:<br /> <ul>"
	var sys = window.stack.metadata.systems[id]
	for (var i = 0; i < sys.length; i++) {
	 	txt += "<li>" + sys[i] + "</li>"
	 }; 
	 txt += "</ul>"
	document.getElementById('edgeDetailsTxt').innerHTML = txt
	$('#edgeDetailsModal').modal('show')
}

////// automatically set the get interactions options to be consistent with the parameters in the API
//opts is in the format of esynOpts, extra options are just ignored
    function setInteractionOptions(opts){
      console.log("setting options with:",opts)
      if(opts.organism == "4896" && opts.source == "pombase"){
        opts.organism = "pombase"
      }
      //organism
      //explicitly fire the onchange event so any listeners get fired (e.g. showing identifer type options for flymine)
      $("#organisms").val(opts.organism + "|" + opts.source).change()
      
      //interaction type
      $("#interaction-type").val(opts.interactionType)

      //idenitifier type
      if(opts.identifierType != "any"){ //there is no "any" option in the dropdown, it's only shown if it has to be one or the other
        $("#selectIdentifierType").val(opts.identifierType)
      }

      $("#interaction-throughput").val(opts.throughput)
    }