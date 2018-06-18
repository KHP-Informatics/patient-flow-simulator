//plotting simulation results

function plotSimulationResults(data, subset, container, title, xlab, ylab, width, height, proportional){
	var plot_name = container + '-plot'
	$('#' + plot_name).remove(); 
 	$('#' + container).append('<canvas id="'+plot_name+'"><canvas>');
	var ctx = document.getElementById(plot_name).getContext("2d");
    ctx.canvas.width = width;
    ctx.canvas.height = height;
	var scatter_config = {
	    type: 'line',
	    data: {
	        datasets: []
	    },
	    options: {
	    	responsive: false,
            maintainAspectRatio: false,
	        scales: {
	            xAxes: [{
	                type: 'linear',
	                position: 'bottom',
                    beginAtZero: true,
                    scaleLabel: {
                        display: true,
                        labelString: xlab
                      }
	            }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: ylab
                      }
                }]
	        },
            title: {
                display: true,
                text: title
            }
	    }
	}

	//colour for each ward
	var fills = {}
	data.config.forEach(function(el){
		fills[el.name] = el.fill_colour
	})

	var ward_names = Object.keys(data[subset]) 
	var cfg = {} //convert config from list to dict
	data.config.forEach(function(el){
		cfg[el.name] = el
	})
	var plot_data = {}
	ward_names.forEach(function(el){
		if(el != "Pool" & el != "Exit"){
			plot_data[el] = []
			if(proportional){
				for (var i = 0; i < data[subset][el].length; i++) {
					var dt = Object.assign({},data[subset][el][i])
					dt.y = data[subset][el][i].y / cfg[el].capacity 
					plot_data[el].push(dt)
				}
			} else {
				plot_data[el] = data[subset][el]
			}
		}
	})

	//push each dataset
	//remember to add chartjs specific details
	
	ward_names.forEach(function(el){
		if(el != "Pool" & el != "Exit"){
			line_data = {
				label: el,
	            lineTension: 0, //set to zero to draw stright lines between points
	            fill: false,
	            borderColor: fills[el],
	            backgroundColor: fills[el],
	            //steppedLine: true, //alternative to straigh lines between points, technically more correct
	            data: plot_data[el]
	        }
			scatter_config.data.datasets.push(line_data)
		}
		
	})

	//window.myLine = new Chart(ctx, scatter_config);
    var myLine = new Chart(ctx, scatter_config);
    return myLine;
}

//waiting time distribution
function plotWaitingTimeCumulative(patients, ward, container, width, height) {
	//get all waiting times for the ward
	distribution = cumulativeDistribution(patients, ward)

	plotSimulationResults(distribution, container, "cumulative distribution", "waiting time", "cumulative proportion", width, height)
}

//histogram of waiting time
function plotWaitingTimeFreq(patients, ward, container, width, height, text_output){
	var counts = visitCounts(patients, ward)
	points = []
	var total = 0
	var n = 0
	for (var i = 0; i < counts['counts'].length; i++) {
		points.push({'x': counts['values'][i], 'y': counts['counts'][i]})
		total += counts['values'][i] * counts['counts'][i]
		n += counts['counts'][i]
	}
	var result = {} 
	result['results'] = {"frequency": points}
	result['config'] = [{name:"frequency", fill_colour: "#ccc"}]
	plotSimulationResults(result, 'results', container, "Waiting time distribution: " + ward, "waiting time", "count", width, height)
	var mean = total/n
	$('#' + text_output).text(mean.toFixed(2))
	return mean
}

//histogram of delays in required wards
function plotDelayTimeFreq(patients, ward, container, width, height, text_output){
	var counts = delayCounts(patients, ward)
	points = []
	var total = 0
	var n = 0
	for (var i = 0; i < counts['counts'].length; i++) {
		points.push({'x': counts['values'][i], 'y': counts['counts'][i]})
		total += counts['values'][i] * counts['counts'][i]
		n += counts['counts'][i]
	}
	var result = {} 
	result['results'] = {"frequency": points}
	result['config'] = [{name:"frequency", fill_colour: "#ccc"}]
	plotSimulationResults(result, 'results', container, "Delay distribution: " + ward, "delay time", "count", width, height)
	var mean = total/n
	$('#' + text_output).text(mean.toFixed(2))
	return mean
}

function plotPathLengthDistribution(patients, container, width, height, total_paths_output, top_paths_output, top_paths_limit){
	var paths = {}// used to count unique sequences and occurrences of each sequence
	var path_to_durations = {}
	var lengths = patients.map(function(p){
		var k = p.observed.wards.slice(1).toString() //slice to remove pool
		if(!paths.hasOwnProperty(k)){
			paths[k] = 0
			path_to_durations[k] = []
		}
		paths[k] += 1
		var emergency_arrival = p.observed.entry_times[1] //index 0 is the pool
		var exit_time = p.observed.entry_times[p.observed.entry_times.length-1]
		path_to_durations[k].push( exit_time - emergency_arrival )
		return p.observed.wards.length - 1 //-1 to ignore pool
	})

	var counts = arrayCount(lengths)
	points = []
	for (var i = 0; i < counts['counts'].length; i++) {
		points.push({'x': counts['values'][i], 'y': counts['counts'][i]})

	}
	var result = {} 
	result['results'] = {"frequency": points}
	result['config'] = [{name:"frequency", fill_colour: "#ccc"}]
	plotSimulationResults(result, 'results', container, "Path length distribution", "Path length (wards)", "Patients", width, height)
	console.log(result)
	$('#' + total_paths_output).text(Object.keys(paths).length)

	//show top paths
	var shown = []
	var path_counts = []
	for (var k in paths) {
		path_counts.push(paths[k])
	}
	var max_count = Math.max.apply(null, path_counts)
	while(shown.length <= top_paths_limit & max_count > 0){
		for(k in paths){
			if(paths[k] == max_count){
				var min_duration = Math.min.apply(null, path_to_durations[k])
				var max_duration = Math.max.apply(null, path_to_durations[k])
				var mean_duration = path_to_durations[k].reduce(function(acc, val) {
					return acc + val;
				}, 0)
				mean_duration = mean_duration / path_to_durations[k].length
				var median_duration = median(path_to_durations[k])
				shown.push({path:k.replace(/,/g, ', '), count:max_count, max_duration: max_duration, min_duration: min_duration, mean_duration: mean_duration, median_duration: median_duration})
			}
		}
		max_count -= 1
	}
	
	console.log(shown)
	var tbl = '' 
	tbl += '<thead><tr><th>Rank</th><th>Sequence</th><th>Length</th><th>Count</th><th>Min duration</th><th>Max duration</th><th>Mean duration</th><th>Median duration</th></tr></thead>'
	tbl += '<tbody>'
	for (var i = 0; i < shown.length; i++) {
		var rank  = i+1
		var pl = (shown[i].path.match(/,/g) || []).length + 1;
		tbl += '<tr><td>' + rank.toString() + '</td><td>' + shown[i].path + '</td><td>' + pl.toString() + '</td><td>' + shown[i].count + '</td>' 
		tbl += '<td>' + shown[i].min_duration + '</td>'
		tbl += '<td>' + shown[i].max_duration + '</td>'
		tbl += '<td>' + shown[i].mean_duration.toFixed(2) + '</td>'
		tbl += '<td>' + shown[i].median_duration + '</td>'
		tbl += '</tr>'
	}
	tbl += "</tbody>"
	$('#' + top_paths_output).html(tbl)

}