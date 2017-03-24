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

//common functions for both builder apps



/**
  * NAME: Bootstrap 3 Triple Nested Sub-Menus
  * This script will active Triple level multi drop-down menus in Bootstrap 3.*
  */
$('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
    // Avoid following the href location when clicking
    event.preventDefault(); 
    // Avoid having the menu to close when clicking
    event.stopPropagation(); 
    // Re-add .open to parent sub-menu item
    $(this).parent().addClass('open');
    $(this).parent().find("ul").parent().find("li.dropdown").addClass('open');
});

//the first time the background is clicked, we add some JS to confirm navigation away from the page
var confirmOnPageExit = function (e) 
{
    // If we haven't been passed the event get the window.event
    e = e || window.event;

    var message = 'Warning: If you have not saved your changes they will be lost.';

    // For IE6-8 and Firefox prior to version 4
    if (e) 
    {
        e.returnValue = message;
    }

    // For Chrome, Safari, IE8+ and Opera 12+
    return message;
};



//set the default project name
function getDefaultFilename(){
	var currentdate = new Date(); 
	var filename = "Project: " + currentdate.getDate() + "/"
    + (currentdate.getMonth()+1)  + "/" 
    + currentdate.getFullYear() + " @ "  
    + currentdate.getHours() + ":"  
    + currentdate.getMinutes() + ":" 
    + currentdate.getSeconds();

    return filename;
};

//get the label (=project name) for a saved project based on the id
//note this function must be used with a callback to get the project name
//i.e. getProjectName(58,function(resp){console.log(resp)})
function getProjectName(pid,callFn){
    $.ajax({ url: 'manager.php',
        data: {action: 'describe', projectid: pid },
        type: 'post',
        dataType: 'text',
        success: function(response){
            //console.log('the response :' + response);
            resp_json = JSON.parse(response);
            label = resp_json['label'];
            callFn(label);
        }
    })
};

//same as getProjectName() but for a published project. Also requires a callback function do handle the name.
function getPublishedName(pid,callFn){
    $.ajax({ url: 'manager.php',
        data: {action: 'describePublished', publishedid: pid },
        type: 'post',
        dataType: 'text',
        success: function(response){
            //console.log('the response :' + response);
            resp_json = JSON.parse(response);
            label = resp_json['label'];
            callFn(label);
        }
    })
};

function getProjectData(id,published,callFn){
    //retrieve the data for a project from the database but don't replace the contents of the stack
    //used for merge
    //id is the projectid or publishedid, published is boolean true for published projects, false for private projects
    if(published == true){
        var data = {action: 'viewpublished', publishedid: id};
    } else {
        var data = {action: 'view', projectid: id, historyid : -1}; //this will always get the most recent version
    }

    $.ajax({
      type: "GET",
      url: "manager.php",
      data: data
    })
    .done( function(result){
        console.log(result);
        callFn(result);
    })
};

//merge two projects into one
function mergeSavedProject(id,published){
    getProjectData(id,published,function(result){
        console.log('check compatibility')
        result = JSON.parse(result);
        result.metadata = JSON.parse(result.metadata)
        if(result.metadata.hasOwnProperty('k') == false){
            result.metadata['k'] = {} //for compatibility with projects saved before k added
        }
        if(!result.metadata.hasOwnProperty('citations')){
            result.metadata['citations'] = {}// init citations when loading networks created before we included them
        }
        console.log('processing',result)
        var allNwNames = Object.keys(result);
        allNwNames.splice(allNwNames.indexOf('metadata'),1);
        console.log('all network names',allNwNames)
        existing = Object.keys(window.stack)
        existing.splice(existing.indexOf('metadata'),1);
        console.log('current network names',existing)

        //check there aren't any overlapping transition names or network names
        var compatible = true;
        if(_.intersection(existing,allNwNames).length > 0){
            console.log('two networks with the same name, not importing')
            compatible = false;
        }
        existingTransitions = Object.keys(window.stack.metadata.transition);
        newTransitions = Object.keys(result.metadata.transition);

        if(_.intersection(existingTransitions,newTransitions).length > 0){
            console.log('transitions with the same name, not importing')
            compatible = false;
        }

        //check isa and contains relationships for common places, don't merge if they're different for places common to both projects
        //as that would mean the upload modified the data in one project
        var placesNow = _.keys(window.stack.metadata.place);
        var placesResult = _.keys(result.metadata.place);
        var commonPlaces = _.intersection(placesNow, placesResult);

        if(commonPlaces.length > 0){
            containsNow = _.pick(window.stack.metadata.contains, commonPlaces)
            isaNow = _.pick(window.stack.metadata.isa, commonPlaces)
            containsResult = _.pick(result.metadata.contains, commonPlaces)
            isaResult = _.pick (result.metadata.isa, commonPlaces)

            //any parent or child nodes of common nodes must have the same relationship if the parent or child node is also common to both projects
            containsNow_o = _.each(containsNow, function(val,key,obj){obj[key] = _.intersection(val, commonPlaces)})
            containsResult_o = _.each(containsResult, function(val,key,obj){obj[key] = _.intersection(val, commonPlaces)})
            isaNow_o = _.each(isaNow, function(val,key,obj){obj[key] = _.intersection(val, commonPlaces)})
            isaResult_o = _.each(isaResult, function(val,key,obj){obj[key] = _.intersection(val, commonPlaces)})

            if(_.isEqual(containsNow_o, containsResult_o) == false || _.isEqual(isaNow_o, isaResult_o) == false){
                compatible = false
                console.log('incompatible isa or contains relationships')
            }

            //check marking for common places
            //the marking for all places common to both networks must be the same
            if(window.esynOpts.type == 'PetriNet'){
                console.log("Petri net - Check marking for common places")
                for (var i = 0; i < commonPlaces.length; i++) {
                    if(window.stack.metadata.place[commonPlaces[i]] != result.metadata.place[commonPlaces[i]]){
                        compatible = false;
                        console.log('incompatible markings for common place ', commonPlaces[i])
                        console.log('marking in current network: ',window.stack.metadata.place[commonPlaces[i]]);
                        console.log('marking in imported network: ', result.metadata.place[commonPlaces[i]])
                    }
                };
            }

        }

        if(compatible == true){
            console.log('begin merge')
            console.log(result)
            console.log('pre-processing of imported network')
            result = ppProject(result)
            console.log('pre-processing done')
            console.log(result)

            //work out what places in result are new
            //only create a new entry in metadata.place for new places, the others are just made disperse
            var newPlaces = _.difference(placesResult, placesNow)
            console.log('new places are',newPlaces)
            newPlaces.forEach(function(pname){
                window.stack.metadata.place[pname] = result.metadata.place[pname];
            })

            for(var tname in result.metadata.transition){
                window.stack.metadata.transition[tname] = result.metadata.transition[tname];
            }

            //contains relationships
            for(var cont in result.metadata.contains){
                if(window.stack.metadata.contains.hasOwnProperty(cont)){
                    //there are already contains relationships for this node, update
                    var prev = window.stack.metadata.contains[cont]
                    window.stack.metadata.contains[cont] = _.union(prev,result.metadata.contains[cont])
                } else {
                    window.stack.metadata.contains[cont] = result.metadata.contains[cont];
                }
            }

            //isa relationships
            for(var isa in result.metadata.isa){
                if(window.stack.metadata.isa.hasOwnProperty(isa)){
                    //update the existing entry
                    var prev = window.stack.metadata.isa[isa]
                    window.stack.metadata.isa[isa] = _.union(prev,result.metadata.isa[isa])
                } else {
                    window.stack.metadata.isa[isa] = result.metadata.isa[isa];
                }
            }
            //parameter k
            for(var node in result.metadata.k){
                //we know the project is compatible therefore just add all
                window.stack.metadata.k[node] = result.metadata.k[node]
            }


            //disperse places from result
            for(var disp in result.metadata.disperse){
                if(window.stack.metadata.disperse.hasOwnProperty(disp)){
                    //update the existing entry
                    //network names have to be unique to merge projects so we just need to add the new entries
                    var prev = window.stack.metadata.disperse[disp];
                    window.stack.metadata.disperse[disp] = _.extend(prev, result.metadata.disperse[disp])
                } else {
                    window.stack.metadata.disperse[disp] = result.metadata.disperse[disp];
                }
            }
            //create new disperse places if needed - remove common places that are already in the disperse metadata
            newDisperse = _.difference(commonPlaces, _.keys(window.stack.metadata.disperse))
            console.log('commonPlaces',commonPlaces,'current disperse places:',_.keys(window.stack.metadata.disperse),' new disperse places:',newDisperse)
            newDisperse.forEach(function(dplace){
                newDispData = {}
                console.log('creating new disperse place data for',dplace)
                //these are places that appear exactly once in each of the two projects being merged
                //find it in the current project
                var found = false;
                for (var i = 0; i < existing.length; i++) {
                    if(found == false){
                        var nodes = JSON.parse(window.stack[existing[i]]).nodes;
                        var filtered = nodes.filter(function(x){return x.data.name == dplace})
                        if(filtered.length == 1){
                            found = true;
                            newDispData[existing[i]] = [filtered[0].data.id]}
                            console.log('found ' + dplace + ' in ' + existing[i])
                        }
                    }
                    

                if(found == false){
                    console.log('error finding ',dplace,' in current network')
                }
                //find it in the result project
                var found = false;
                for (var i = 0; i < allNwNames.length; i++) {
                    if(found == false){
                        var nodes = JSON.parse(result[allNwNames[i]]).nodes;
                        var filtered = nodes.filter(function(x){return x.data.name == dplace})
                        if(filtered.length == 1){
                            found = true
                            newDispData[allNwNames[i]] = [filtered[0].data.id]
                            console.log('found ' + dplace + ' in ' + allNwNames[i])
                        }
                    }
                    
                };
                if(found == false){
                    console.log('error finding ',dplace,' in result network')
                }
                window.stack.metadata.disperse[dplace] = newDispData;
            })

            
            for(var nw in allNwNames){
                console.log('adding',allNwNames[nw])
                window.stack[allNwNames[nw]] = result[allNwNames[nw]]
            }

            //citations data
            _.each(_.keys(result.metadata.citations),function(el,i,a){
                if(window.stack.metadata.citations.hasOwnProperty(el)){
                    console.log('ERROR: id in citations from imported network already in metadata. It will overwrite the existing data.')
                }
                window.stack.metadata.citations[el] = result.metadata.citations[el]
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

            //dimiss the modal form
            $('#mergeModal').modal('hide');
            $('#publicModal').modal('hide');

            //clear visual styles then reapply
            remove_style();
            update_style();

            //reset all node and edge ids
            //console.log('reset ids')
            //reuniqueIds()
        } else {
            alert("The selected network could not be merged. This could be due to incompatible network or transition names.")
        }


    })
}

//function to extract data on an array of node names from metadata
//return a copy of obj with both keys and values filtered
function extract(originalObj, keyArray, valArray){
    //add property nodes so they can be passed in
    //metadata['nodes'] = nodes;
    var newObj = _.each(originalObj, function(val, key, obj){
        if(keyArray.indexOf(key) >= 0){
            //the node that contains the other nodes is in this network
            //remove any nodes it contains that are in other networks
            var val_overlap = _.intersection(val, valArray)
            if(val_overlap.length > 0){
                obj[key] = val_overlap;
            } else {
                delete obj[key] 
            }
        } else {
            delete obj[key]
        }
    })

    return newObj;
}

//function to save the currently loaded network as a new project
//strip out all references to nodes elsewhere in the network from metadata
//make sure that disperse nodes are still disperse, check contains and isa both keys and values
function save_network_as_project(){
    updateStack() //any changes to the current network need to be reflected in the stack

    //check that the current network is not empty
    //udpateStack won't have added a property to the stack if the network is empty so check the stack
    if(window.stack.hasOwnProperty(window.currentNwName)){

        //start by getting all data
        var thisNwName = window.currentNwName;
        var thisNwData = JSON.parse(window.stack[thisNwName]);
        var thisNwMeta = $.extend(true, {}, window.stack.metadata); //recursive deep copy
        var thisNwNodes = thisNwData.nodes.map(function(el){return el.data.name})

        //remove references to nodes that no longer exist
        thisNwMeta.contains = extract(thisNwMeta.contains, thisNwNodes, thisNwNodes);
        thisNwMeta.isa = extract(thisNwMeta.isa, thisNwNodes, thisNwNodes);
        thisNwMeta.disperse = extract(thisNwMeta.disperse, thisNwNodes, thisNwName);
        thisNwMeta.place = _.pick(thisNwMeta.place, thisNwNodes);
        thisNwMeta.transition = _.pick(thisNwMeta.transition, thisNwNodes);

        //if this network is a merge result, remove any disperse place metatadata that could still be selected
        //that metadata applies only to the rest of the stack, but in the merge result there are no disperse places
        if(thisNwName == 'Merge-result'){
            thisNwMeta.disperse = {};
            if($('#set_filename_form').length != 0){ //if the project id is not -1 we won't be able to edit the name
                var labeltxt = "Merge result: " + document.getElementById('set_filename').value;
            } else {
                var currentdate = new Date(); 
                var labeltxt = "Merge- esult: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
            }
            thisNwName = labeltxt;
        }

        //get all node and edge ids for this network, use to subset citations metadata
        //only do this if there are some citations
        if(_.keys(window.stack.metadata.citations).length > 0){
            var allids = []
            nwjs = cy.json()['elements']
            _.each(nwjs.nodes,function(el,i,a){
                allids.push(el.data.id)
            })
            _.each(nwjs.edges,function(el,i,a){
                allids.push(el.data.id)
            })
            thisNwMeta.citations = _.pick(thisNwMeta.citations, allids)
        }

        console.log('this network nodes', thisNwNodes)
        console.log('new metadata',thisNwMeta)

        //don't reset nodecounter - needs to guarantee an unique default id

        //save
        var labeltxt = encodeURIComponent(thisNwName);
        var data = {};
        data['metadata'] = JSON.stringify(thisNwMeta);
        data[thisNwName] = JSON.stringify(thisNwData);


        //Ajax request
        console.log('saving: ' + JSON.stringify(data));
        console.log('with label: ', labeltxt)
        
        $.ajax({ url: '../manager.php', //was '../manager.php'
             data: {action: 'save', label: labeltxt, data: JSON.stringify(data), type: window.esynOpts.type },
             type: 'post',
             dataType: 'text',
             success: function(response){
                 console.log('the response :')
                 console.log(response)
                 console.log('end of response')
                 response = JSON.parse(response)
                 if(response['success'] == true){
                    console.log('network saved with session id: ' + response['projectid'])
                    alert('The network saved successfully as a project, go to My esyN to edit.')
                 } else {
                    alert('Save failed. You may not have permission to edit this project, but you can save your work as your own copy ("Save > Save a copy"). \n Error message: ' + response['message'])
                 }
             }
             })

        //add the visual style back - removed by updateStack()
        update_style();

    } else {
        alert("The current network is empty and was not saved.")
    }
}

//function to search the stack for a node
//always returns an array of network names
function findNode(name){
    var allNwNames = _.keys(window.stack)
    allNwNames.splice(allNwNames.indexOf('metadata'),1);

    //check whether the name is a disperse node, in which case we know the location
    if(name in window.stack.metadata.disperse){
        return _.keys(window.stack.metadata.disperse[name])
    } else {
        //search
        var found = false;
        var i = 0;
        while(found == false && i < allNwNames.length){
            var thisNwNodes = JSON.parse(window.stack[allNwNames[i]]).nodes;
            var thisNwNodes = thisNwNodes.map(function(el){return el.data.name});
            if(thisNwNodes.indexOf(name) >= 0){
                found = true;
                return [allNwNames[i]]
            } else {
                i += 1;
            }
        }
        if(found == false){
            return [''];
        }
    }
}

//function to wrap findNode() for the GUI
function findNodeButton(which){
    if(which == 'text'){
        var name = $('#searchText').val();
    } else if(which == 'list'){
        var name = $('#nodelist').val();
    }
    
    var result = findNode(name);
    if(result != ''){
        var result = result.map(function(el){
            return el + ' <button class="btn btn-primary" onclick="goToFromModal('+"'"+el+"','"+name+"'"+')">Go</button>' //goToFromModal() dismisses the modal and highlights the query node
        })
        $('#searchResult').html(name + ' was found in: <ul><li>' + result.join('</li><li>')+'</li>')
    } else {
        $('#searchResult').html("The node could not be found")
    }
}

//function to reset the search modal when it is called
function setupSearch(){
    updateStack() //make sure current network is on the stack
    var name = $('#searchText').val('') //clear the search field
    $('#searchResult').html('') //clear the result

    //build dropdown of all node names
    var nodeselect = $('#nodelist')
    var all = _.keys(window.stack.metadata.place).concat(_.keys(window.stack.metadata.transition));
    all = all.sort(function(a, b) { //case-insensitive sort
                        if (a.toLowerCase() < b.toLowerCase()) return -1;
                        if (a.toLowerCase() > b.toLowerCase()) return 1;
                        return 0;
                      });
    var nodeOpts = '<option selected="selected" value="">Select a node</option>'
    for (var i = 0; i < all.length; i++) {
        bit = '<option value ="' + all[i] + '">' + all[i] + '</option>'
        nodeOpts += bit
    };
        
    nodeselect.html(nodeOpts)
    update_style() //updateStack removes style
}

//function to wrap goTo() to also close the modal
function goToFromModal(nwname, nodename){
    $('#searchModal').modal('hide')
    goTo(nwname);
    //select the node that was searched for
    //nothing will be selected when the network is first opened so don't need to check for other selected nodes
    var toupdate = cy.filter("node[name = '" + nodename +"']");
    //select the node to highlight it
    toupdate.select();
    //centre and zoom on the searched node
    //doesn't work for some reason
    // var pos = toupdate.position()
    // console.log("zooming to node")
    // cy.zoom({
    //     level: 1/0,
    //     position: pos
    // })
}

//callback function to set the name of a published or saved project
function setNameForm(name){
    $('#set_filename').prop('value',name)
}

//test whether a string is JSON data
function tryJSON(str) {
    try {
        var res = JSON.parse(str);
    } catch (e) {
        return false;
    }
    return res;
}


////////////////////////////////////////////////////////////////
// fix for projects broken by network delete bug
//fix broken projects
//this function will modify the global stack object so that the metadata does not contain references
//to any nodes that should have been deleted but were not completely removed
//it relies on extract() from app_common.js to filter both keys and values of metadata objects
function fix(){
    //get all existing nodes
    var allNwNames = Object.keys(window.stack)
    allNwNames.splice(allNwNames.indexOf('metadata'),1)

    var allNodes = []
    var allIds = []
    for (var i = 0; i < allNwNames.length; i++) {
        var thisNwNodes = JSON.parse(window.stack[allNwNames[i]]).nodes;
        var thisNwNames = thisNwNodes.map(function(el){return el.data.name});
        var thisNwIds = thisNwNodes.map(function(el){return el.data.id});
        allNodes = allNodes.concat(thisNwNames)
        allIds = allIds.concat(thisNwIds)
    };

    //purge metadata
    //place names 
    window.stack.metadata.place = _.pick(window.stack.metadata.place, allNodes)
    //transition names
    window.stack.metadata.transition = _.pick(window.stack.metadata.transition, allNodes)
    //use extract() function written in app_common.js
    //contains
    window.stack.metadata.contains = extract(window.stack.metadata.contains, allNodes, allNodes)
    //isa
    window.stack.metadata.isa = extract(window.stack.metadata.isa, allNodes, allNodes)
    //disperse
    window.stack.metadata.disperse = extract(window.stack.metadata.disperse, allNodes, allNwNames)

    //create any missing metadata
    for (var i = 0; i < allNwNames.length; i++) {
        var thisNwNodes = JSON.parse(window.stack[allNwNames[i]]).nodes;
        thisNwNodes.forEach(function(el){
            if(el.classes.search('place') >= 0){
                if(!window.stack.metadata.place.hasOwnProperty(el.data.name)){
                    window.stack.metadata.place[el.data.name] = el.data.marking;
                    console.log('created place metadata for', el.data.name)
                }
            } else {
                if(!window.stack.metadata.transition.hasOwnProperty(el.data.name)){
                    window.stack.metadata.transition[el.data.name] = el.data.marking;
                    console.log('created transition metadata for', el.data.name)
                }
            }
        })
    };
}

//find duplicate ids
function findDuplicates(){
    var jdata = cy.json()['elements'];
    if('nodes' in jdata){
        //alert('overwriting data for currently open network')
        window.stack[window.currentNwName] = JSON.stringify(jdata)
    };
    //generate the real network from a network with coarse transitions
    //have to map id back to name to place edges when merging - IDs will all be unique even if the name is the same
    //ID -> NAME will be many -> one
    console.log('start purge of duplicate ids')
    //go through each graph in the stack, create a list of all nodes and edges
    var nodes = [];
    var edges = [];
    var ndupeedges = 0
    var ndupenodes = 0
    
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

    //check nodes for names that aren't in the place metadata
    nodes.forEach(function(el){
        if(!window.stack.metadata.place.hasOwnProperty(el.data.name) && el.classes.search('place') >= 0){
            console.log('id:',el.data.id,' should not exist, name: ',el.data.name)
        }
    })

    allEdgeIds = []
    nedges = 0
    edges.forEach(function(el){
        nedges++
        if(allEdgeIds.indexOf(el.data.id) >=0){
            console.log("duplicate edge id: " + el.data.id)
            ndupeedges++
        } else {
            allEdgeIds.push(el.data.id)
        }
    })

    
    
    //make the matrix - can't use make_matrix() as that requires cytoscape to load the network first
    var p_ids = [];
    var t_ids = [];
    var p_names = [];
    var t_names = [];
    var marking = [];
    var kvector = [];
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
        if(p_ids.indexOf(id)>=0 || t_ids.indexOf(id) >= 0){
                console.log('duplicate node id: ',id)
                ndupenodes++
            }
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
    nnodes = p_ids.length + t_ids.length
    console.log('total nodes in whole project: ' + nnodes)
    console.log('total edges in whole project: ' + nedges)
    if(ndupenodes>0){
        console.log("WARNING: "+ndupenodes+" duplicate node ids")
    } else {
        console.log("Node IDs: PASSED - No duplicate node ids")
    }
    if(ndupeedges>0){
        console.log("WARNING: "+ndupeedges+" duplicate edge ids")
    } else {
        console.log("Edge IDs: PASSED - No duplicate edge ids")
    }

}

//find specific edge that shouldn't be there
function findOne(){
    

    //also find the networks
    var jdata = cy.json()['elements'];
    if('nodes' in jdata){
        //alert('overwriting data for currently open network')
        window.stack[window.currentNwName] = JSON.stringify(jdata)
    };
    //generate the real network from a network with coarse transitions
    //have to map id back to name to place edges when merging - IDs will all be unique even if the name is the same
    //ID -> NAME will be many -> one
    console.log('start finding appearances of duplicates')
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
                    if(tmp.edges[tmp_e[j]].data.source == 'n546' || tmp.edges[tmp_e[j]].data.target == 'n546'){
                        console.log('found n546 in ',allNwNames[i],'edge:',tmp.edges[tmp_e[j]])
                    }
                };  
            };
        }
    };

    edges.forEach(function(el){
            if(el.data.source == 'n546' || el.data.target == 'n546'){
                console.log(el)
            }
        })
}

//not used any more - now the imported network is pre-processed.
//may still be needed to fix errors
//NOTE: NOT UPDATED FOR COMPATIBILITY WITH CITATIONS
function reuniqueIds(){ 
    remove_style()
    var jdata = cy.json()['elements'];
    if('nodes' in jdata){
        //alert('overwriting data for currently open network')
        window.stack[window.currentNwName] = JSON.stringify(jdata)
    };
    //generate the real network from a network with coarse transitions
    //have to map id back to name to place edges when merging - IDs will all be unique even if the name is the same
    //ID -> NAME will be many -> one
    console.log('start purge of duplicate ids')
    //go through each graph in the stack, create a list of all nodes and edges
    var nodes = [];
    var edges = [];
    var newNodeCounter = 0;
    var newEdgeCounter = 0;
    var nameToId = {};
    var new_disperse = {}; //keyed by disperse place NAME -> network: [id(s)]
    var new_place = {};
    var new_transition = {};
    var place_locations = {}; //node NAME -> {network_name:[ids]} using CORRECTED ids
    
    console.log('get all nodes and edges')

    //if the edge data for a network refers to an id that is not that of a node in the current network, delete it


    var allNwNames = Object.keys(window.stack)
    allNwNames.splice(allNwNames.indexOf('metadata'),1) //remove metadata from the list of networks
    if(allNwNames.indexOf('Merge-result') >= 0){
        allNwNames.splice(allNwNames.indexOf('Merge-result'),1) //remove merge network from the list of networks
    }
    for(var i=0; i<allNwNames.length; i++){
        var tmp = JSON.parse(window.stack[allNwNames[i]]); //load network data - doesn't get displayed
        
        if('nodes' in tmp){ //if the network is empty calling Object.keys gives an error
            var tmp_n = Object.keys(tmp.nodes);
            var current_ids = []; //all ids of nodes in this network
            var current_names = [];
            var new_ids = {}; //the new ids we assign keyed by the CURRENT id
            var new_nodes = [];
            var new_edges = [];
            for(var j=0; j<tmp_n.length;j++){ //needed to build the idmap later
                current_names.push(tmp.nodes[tmp_n[j]].data.name);
                current_ids.push(tmp.nodes[tmp_n[j]].data.id);
            };
            //check that the network contains edges
            var real_edges = [];
            if(tmp.hasOwnProperty('edges')){
                for(var j=0; j<tmp.edges.length;j++){
                    //if both the source and target id are found in this network, push to the real_edges array
                    //later we will assign new ids
                    if(current_ids.indexOf(tmp.edges[j].data.source)<0 || current_ids.indexOf(tmp.edges[j].data.target)<0){
                        console.log('deleting edge that should not exist from ',allNwNames[i],tmp.edges[j]);
                    } else {
                        real_edges.push(tmp.edges[j]);
                    }
                };  
            };

            //now we reassign every node a new id and update the nodes and edges
            for(var nn = 0; nn<current_ids.length; nn++){
                //check for duplicate ids in current network
                if(_.keys(new_ids).indexOf(current_ids[nn]) >= 0){
                    console.log('duplicate id:', current_ids[nn], ' in network', allNwNames[i])
                }
                new_ids[current_ids[nn]] = 'n'+newNodeCounter;
                newNodeCounter++
            }
            for(var nn=0; nn<tmp.nodes.length; nn++){
                var copy = tmp.nodes[nn];
                copy.data.id = new_ids[copy.data.id];
                new_nodes.push(copy);
                //update place locations lookup - used to create disperse place metadata without having to search
                if(place_locations.hasOwnProperty(copy.data.name)){
                    if(place_locations[copy.data.name].hasOwnProperty(allNwNames[i])){
                        //already an appearance in the current network, add a new one
                        place_locations[copy.data.name][allNwNames[i]].push(copy.data.id);
                    } else {
                        //create an entry for this network
                        place_locations[copy.data.name][allNwNames[i]] = [copy.data.id];
                    }
                } else {
                    //no existing entries for this place, create a new one
                    var nwkey = allNwNames[i]
                    var val = [copy.data.id]
                    console.log(copy.data.name, ' new place in ', nwkey)
                    place_locations[copy.data.name] = {}
                    place_locations[copy.data.name][nwkey] = val
                }
                if(new_place.hasOwnProperty(copy.data.name)){
                    //there is already a place with this name, so it's a disperse place
                    if(new_disperse.hasOwnProperty(copy.data.name)){
                        //the place is already disperse, add another appearance
                        if(new_disperse[copy.data.name].hasOwnProperty(allNwNames[i])){
                            //there is already an appearance in this network, add another one
                            new_disperse[copy.data.name][allNwNames[i]].push(copy.data.id)
                        } else {
                            //create an entry for this network
                            new_disperse[copy.data.name][allNwNames[i]] = [copy.data.id]
                        }
                    } else {
                        //this is the second appearance so create the disperse metadata
                        //this appearance
                        var nwkey = allNwNames[i]
                        var val = [copy.data.id]
                        console.log(copy.data.name, ' disperse in ', nwkey)
                        new_disperse[copy.data.name] = {}
                        new_disperse[copy.data.name][nwkey] = val

                        //the other appearance
                        othernw = place_locations[copy.data.name]
                        if(_.keys(othernw).length == 1){
                            //the other appearance is in the same network
                            otherid = othernw[allNwNames[i]]
                            otherid.splice(otherid.indexOf(copy.data.id),1) 
                            new_disperse[copy.data.name][allNwNames[i]].push(otherid)
                        } else if(_.keys(othernw).length == 2){
                            //the other appearance is in another network
                            nws = _.keys(othernw)
                            nws.splice(nws.indexOf(allNwNames[i]),1)
                            otherid = othernw[nws[0]]
                            new_disperse[copy.data.name][nws[0]] = otherid //otherid is ALREADY an array, comes from place_locations
                        } else {
                            //there should be at most one other location already known
                            alert('error for disperse place locations for ',copy.data.name)
                        }
                    }
                } else {
                    //create place or transition metadata
                    if(copy.classes.search('place') >= 0){
                        //create place metadata
                        new_place[copy.data.name] = copy.data.marking
                    } else {
                        new_transition[copy.data.name] = copy.data.marking
                    }
                    
                }
            }
            for (var ee = 0; ee < real_edges.length; ee++) {
                var copy = real_edges[ee]
                copy.data.source = new_ids[copy.data.source]
                copy.data.target = new_ids[copy.data.target]
                copy.data.id = 'e'+newEdgeCounter
                new_edges.push(copy)
                newEdgeCounter++
            };

            //update the stack
            window.stack[allNwNames[i]] = JSON.stringify({nodes:new_nodes, edges:new_edges})
        }
    };
    console.log('apply new metadata')

    //update metadata
    window.stack.metadata.place = new_place
    window.stack.metadata.transition = new_transition
    window.stack.metadata.disperse = new_disperse

    //isa and contains
    //contains
    var allNodes = _.keys(window.stack.metadata.place)
    window.stack.metadata.contains = extract(window.stack.metadata.contains, allNodes, allNodes)
    //isa
    window.stack.metadata.isa = extract(window.stack.metadata.isa, allNodes, allNodes)

    //k
    window.stack.metadata.k = _.pick(window.stack.metadata.k, allNodes)

    //nodecounter
    window.stack.metadata.nodecounter = newNodeCounter
    //edgecounter
    window.stack.metadata.edgecounter = newEdgeCounter

    //open a different network to bypass the normal function that would update the stack with the currently loaded (potentially broken) data if view switched
    console.log('load network to reset viewer')
    load_from_stack(allNwNames[0])
    //visual style

}


//pre-processing of project data to make all the ids compatible with the loaded network - all ids must be unique in the final merged project
//renumber all nodes and edges in the loaded network starting from the nodecounter and edgecounter for the current network
function ppProject(project){ //input is JSON.parsed project dat
    console.log('create new ids for imported project')
    //go through each graph in the stack, create a list of all nodes and edges
    var nodes = [];
    var edges = [];

    var nameToId = {};
    var new_disperse = {}; //keyed by disperse place NAME -> network: [id(s)]
    var new_place = {};
    var new_transition = {};
    var place_locations = {}; //node NAME -> {network_name:[ids]} using CORRECTED ids
    var new_citations = {} //element id -> [PMID]
    
    console.log('get all nodes and edges')

    //if the edge data for a network refers to an id that is not that of a node in the current network, delete it

    console.log(project)
    var allNwNames = Object.keys(project)
    allNwNames.splice(allNwNames.indexOf('metadata'),1) //remove metadata from the list of networks
    if(allNwNames.indexOf('Merge-result') >= 0){
        allNwNames.splice(allNwNames.indexOf('Merge-result'),1) //remove merge network from the list of networks
    }
    for(var i=0; i<allNwNames.length; i++){
        var tmp = JSON.parse(project[allNwNames[i]]); //load network data - doesn't get displayed
        
        if('nodes' in tmp){ //if the network is empty calling Object.keys gives an error
            var tmp_n = Object.keys(tmp.nodes);
            var current_ids = []; //all ids of nodes in this network
            var current_names = [];
            var new_ids = {}; //the new ids we assign keyed by the CURRENT id
            var current_edge_ids = []
            var new_edge_ids = {} //used to map citation data for graphs to the new ids
            var new_nodes = [];
            var new_edges = [];
            for(var j=0; j<tmp_n.length;j++){ //needed to build the idmap later
                current_names.push(tmp.nodes[tmp_n[j]].data.name);
                current_ids.push(tmp.nodes[tmp_n[j]].data.id);
            };
            //check that the network contains edges
            var real_edges = [];
            if(tmp.hasOwnProperty('edges')){
                for(var j=0; j<tmp.edges.length;j++){
                    //if both the source and target id are found in this network, push to the real_edges array
                    //later we will assign new ids
                    if(current_ids.indexOf(tmp.edges[j].data.source)<0 || current_ids.indexOf(tmp.edges[j].data.target)<0){
                        console.log('deleting edge that should not exist from ',allNwNames[i],tmp.edges[j]);
                        //effectively deleted as we don't push it to the array of edges to process
                    } else {
                        real_edges.push(tmp.edges[j]);
                    }
                };  
            };

            //now we reassign every node a new id and update the nodes and edges
            for(var nn = 0; nn<current_ids.length; nn++){
                //check for duplicate ids in current network
                if(_.keys(new_ids).indexOf(current_ids[nn]) >= 0){
                    console.log('duplicate id:', current_ids[nn], ' in network', allNwNames[i])
                }
                new_ids[current_ids[nn]] = 'n'+window.stack.metadata.nodecounter;
                window.stack.metadata.nodecounter++
            }
            for(var nn=0; nn<tmp.nodes.length; nn++){
                var copy = tmp.nodes[nn];
                copy.data.id = new_ids[copy.data.id];
                new_nodes.push(copy);
                //update place locations lookup - used to create disperse place metadata without having to search
                if(place_locations.hasOwnProperty(copy.data.name)){
                    if(place_locations[copy.data.name].hasOwnProperty(allNwNames[i])){
                        //already an appearance in the current network, add a new one
                        place_locations[copy.data.name][allNwNames[i]].push(copy.data.id);
                    } else {
                        //create an entry for this network
                        place_locations[copy.data.name][allNwNames[i]] = [copy.data.id];
                    }
                } else {
                    //no existing entries for this place, create a new one
                    var nwkey = allNwNames[i]
                    var val = [copy.data.id]
                    console.log(copy.data.name, ' new place in ', nwkey)
                    place_locations[copy.data.name] = {}
                    place_locations[copy.data.name][nwkey] = val
                }
                if(new_place.hasOwnProperty(copy.data.name)){
                    //there is already a place with this name, so it's a disperse place
                    if(new_disperse.hasOwnProperty(copy.data.name)){
                        //the place is already disperse, add another appearance
                        if(new_disperse[copy.data.name].hasOwnProperty(allNwNames[i])){
                            //there is already an appearance in this network, add another one
                            new_disperse[copy.data.name][allNwNames[i]].push(copy.data.id)
                        } else {
                            //create an entry for this network
                            new_disperse[copy.data.name][allNwNames[i]] = [copy.data.id]
                        }
                    } else {
                        //this is the second appearance so create the disperse metadata
                        //this appearance
                        var nwkey = allNwNames[i]
                        var val = [copy.data.id]
                        console.log(copy.data.name, ' disperse in ', nwkey)
                        new_disperse[copy.data.name] = {}
                        new_disperse[copy.data.name][nwkey] = val

                        //the other appearance
                        othernw = place_locations[copy.data.name]
                        if(_.keys(othernw).length == 1){
                            //the other appearance is in the same network
                            otherid = othernw[allNwNames[i]]
                            otherid.splice(otherid.indexOf(copy.data.id),1) 
                            new_disperse[copy.data.name][allNwNames[i]].push(otherid)
                        } else if(_.keys(othernw).length == 2){
                            //the other appearance is in another network
                            nws = _.keys(othernw)
                            nws.splice(nws.indexOf(allNwNames[i]),1)
                            otherid = othernw[nws[0]]
                            new_disperse[copy.data.name][nws[0]] = otherid //otherid is ALREADY an array, comes from place_locations
                        } else {
                            //there should be at most one other location already known
                            alert('error for disperse place locations for ',copy.data.name)
                        }
                    }
                } else {
                    //create place or transition metadata
                    if(copy.classes.search('place') >= 0){
                        //create place metadata
                        new_place[copy.data.name] = copy.data.marking
                    } else {
                        new_transition[copy.data.name] = copy.data.marking
                    }
                    
                }
            }
            for (var ee = 0; ee < real_edges.length; ee++) {
                var copy = real_edges[ee]
                var oldid = copy.data.id //needed at the end after modified
                current_edge_ids.push(oldid)
                copy.data.source = new_ids[copy.data.source]
                copy.data.target = new_ids[copy.data.target]
                copy.data.id = 'e'+window.stack.metadata.edgecounter
                new_edges.push(copy)
                window.stack.metadata.edgecounter++
                new_edge_ids[oldid] = copy.data.id;
            };

            //update the stack
            project[allNwNames[i]] = JSON.stringify({nodes:new_nodes, edges:new_edges})

            //update citations - always check both nodes and edges in case we allow more citations for either type
            _.each(current_ids, function(el,i,a){
                if(project.metadata.citations.hasOwnProperty(el)){
                    new_citations[new_ids[el]] = project.metadata.citations[el]
                }
            })

            _.each(current_edge_ids, function(el,i,a){
                if(project.metadata.citations.hasOwnProperty(el)){
                    new_citations[new_edge_ids[el]] = project.metadata.citations[el]
                }
            })
        }
        
    };
    console.log('apply new metadata')

    //update metadata
    project.metadata.place = new_place
    project.metadata.transition = new_transition
    project.metadata.disperse = new_disperse
    project.metadata.citations = new_citations

    //isa and contains
    //contains
    var allNodes = _.keys(project.metadata.place)
    project.metadata.contains = extract(project.metadata.contains, allNodes, allNodes)
    //isa
    project.metadata.isa = extract(project.metadata.isa, allNodes, allNodes)

    //k
    project.metadata.k = _.pick(project.metadata.k, allNodes)

    return project;

}

/////////////////////////////////////////////// CITATIONS
//create the gui
function buildCitationInterface(id){
    print('<label class="control-label" for="selectcitation">Citations:</label><div class="input-group"><input type="text" class="form-control" id="textaddcitation"><span class="input-group-btn"><button class="btn btn-default" type="button" id="buttonaddcitation" onclick="addCitationButton('+ "'" + id + "'"+')">Add</button></span></div>')
    print('<div class="control-group"><div class="controls"><select id="selectcitation" name="selectcitation" class="input-sm wide" multiple="multiple"></select></div></div>')
        
    print('<div class="control-group"><button id="buttonremovecitation" class="btn btn-danger" onclick="removeCitationButton('+ "'" + id + "'"+')">Remove Citation(s)</button><button id="gocitation" class="btn btn-primary" onclick="goToCitation()">Go to selected</button></div>')

}
//add and remove citations for an element
function addCitationButton(id) {
    var pmid = $('#textaddcitation').val()
    if(window.stack.metadata.citations.hasOwnProperty(id)){
        //there is already an entry so update it
        if(window.stack.metadata.citations[id].indexOf(pmid) < 0){
            window.stack.metadata.citations[id].push(pmid);
        }
    } else {
        //create a new entry
        window.stack.metadata.citations[id] = [pmid]
    }


  $("#selectcitation").append('<option value="' + pmid + '">' + pmid + '</option>');
  $('#textaddcitation').val(null);
  $('#textaddcitation').focus();


};  


function removeCitationButton(id) {
  var todo = $("#selectcitation").find('option:selected').remove();
  _.each(todo, function(el,i,a){
    //remove the element from the citations object
    window.stack.metadata.citations[id].splice(window.stack.metadata.citations[id].indexOf(el.value),1);
  })
  $("#selectcitation").find('option:selected').remove(); //could put inside _.each but don't want to modify the array size while iterating through
};

function buildCitationList(id){
    //format all citations for a given element (node or edge) for the editor
    if(window.stack.metadata.citations.hasOwnProperty(id)){
        var c = window.stack.metadata.citations[id];
        for (var i = 0; i < c.length; i++) {
            $("#selectcitation").append('<option value="' + c[i] + '">' + c[i] + '</option>');
        };
        
    }
}

function goToCitation(){
    var go = $("#selectcitation").find('option:selected');
    for (var i = 0; i < go.length; i++) {
        console.log('opening link to:', go[i].value)
        window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term="+go[i].value,'_blank')
    };
}

////////////////////////////////////////////////////////////////////////////////////////////

//check whether a project is a merge result and should be locked for editing
function canEdit(){
    if(window.currentNwName == 'Merge-result' && Object.keys(window.stack).length > 2){
        return false;
    } else {
        return true;
    }
}

///////////////////////////////////////////// loading
function startLoadAnimation(){
    if(!window.hasOwnProperty('loadingID')){
        //don't want to start multiple timers animating the same thing
        console.log('start load animation')
        var pos = $('#cy').offset()
        var w = $('#cy').width()
        var h = $('#cy').height()
        $('#loading-text').addClass('load')
        $('#loading-grey').css({ opacity: 0.7, 'width':w,'height':h, 'left':pos.left , 'top':pos.top}); //set size and position
        $('#loading-grey').css({background:'#000'}) //the background colour is set to fade to the new colour when changed
        $('#loading-text').text('Loading...')
        
        window.loadingID = setInterval(cycleColour, 1000)
    } else {
        console.log("load animation already running")
    }
}

function stopLoadAnimation(){
    console.log("stop load animation")
    $('#loading-grey').css({background:'none'}).css({'width':0,'height':0})
    $('#loading-text').text('')
    $('#loading-text').removeClass('load')
    clearInterval(window.loadingID)
    delete window.loadingID //so we can start a new timer if needed
}

function cycleColour(){
    var colours = [
        "rgb(36, 69, 123)",
        "rgb(240, 129, 71)",
        "rgb(145, 31, 80)" ]
    var now = $('#loading-text').css("background-color")
    var idx = colours.indexOf(now)
    var next = idx + 1
    if(next >= colours.length){
        //0 indexed so if next == colours.length it's too high a value
        next = 0;
    }

    $('#loading-text').css({"background-color":colours[next]})
    
}

//generate link to embed network viewer
function generateEmbedLink(){
    var params = window.location.href.split("?")[1]
    var esynlink = "http://www.esyn.org/app.php?embedded=true&"
    var linkout = esynlink + params
    return linkout
}

//determine whether 
function canEmbed(){
    var params = window.location.href.split("?")[1]
    var splitparams = params.split("&")
    var usedparams = splitparams.map(function(el){return el.split("=")[0]})
    if(usedparams.indexOf("publishedid") >= 0 || usedparams.indexOf("source") >= 0){
        return true;
    }
    return false;
}

function setupEmbedLinkTxt(){
    var ok = canEmbed()
    if(ok){
        var link = generateEmbedLink()
        var before = '&lt;iframe class="seamless" frameborder="0" scrolling="no" id="iframe" src="'
        var after = '" width="500" height="500"&gt;&lt;/iframe&gt;'
        document.getElementById("embedLinkTxt").innerHTML = "<pre>" + before + link + after + "</pre>"
        document.getElementById("embedLinkDescription").innerHTML = '<p> Copy and paste the HTML code below to embed this project in another website. For more details on embedding esyN projects, check out the "embed" tab in the <a href="./tutorial.html#embed">documentation</a>.</p>'
    } else {
        document.getElementById("embedLinkTxt").innerHTML = "";
        document.getElementById("embedLinkDescription").innerHTML = '<p>The current project cannot be embedded.</p><p> Only public networks stored in esyN or networks generated automatically using the API can be embedded. Then we can generate the embed code automatically, for you to copy and paste. For more details on embedding esyN, check out the "embed" tab in the <a href="./tutorial.html#embed">documentation</a>.'
    }
    $('#embedLinkModal').modal("show")
}


//generic modal popup that can be dismissed and show arbitrary text
function modalPopup(msg){
    $("#modalPopupTxt").html(msg)
    $("#alertModal").modal("show")
}

//export to PNG
function toPNG(view){
    if(view == "all"){
        var png64 = cy.png({"full":true, "scale":5});
    } else if (view == "current"){
        var png64 = cy.png();
    } else {
        console.log("specified view not recognised, must be 'current' or 'all'")
        return false
    }

    var wind = window.open();
    wind.document.write('<img src="'+png64+'"/>')
    return true
}

//go to tab based on href
function goToTab(href){
    //href should be the href attribute of the tab the user would click
    //don't include the # at the start
    //would be more reliable to use ID

    //get the element
    var tab = $("a[href=#" + href + "]")

    //activate the tab
    tab.click()

    //animate scroll down
    $('html, body').animate({
        scrollTop: tab.offset().top
    }, 1000);
 }
 