document.addEventListener('DOMContentLoaded', function(){ // on dom ready

var cy = cytoscape({
  container: document.querySelector('#cy'),
    
  boxSelectionEnabled: false,
  autounselectify: true,
  minZoom: 1,
  maxZoom: 10,
  zoomingEnabled: false,
  panningEnabled: false,
  
  style: cytoscape.stylesheet()
    .selector('node')
      .css({
        'content': 'data(name)',
        'text-valign': 'center',
        'color': 'white',
        'text-outline-width': 2,
        'background-color': '#999',
        'text-outline-color': '#999'
      })
    .selector('edge')
      .css({
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#ccc',
        'line-color': '#ccc',
        'width': 1
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
      }),
  
  elements: {
    nodes: [
      { data: { id: 'w1', name: 'A&E' } },
      { data: { id: 'w2', name: 'Observation' } },
      { data: { id: 'w3', name: 'Medical Ward' } },
      { data: { id: 'w4', name: 'Exit' } }
    ],
    edges: [
      { data: { source: 'w1', target: 'w2' } },
      { data: { source: 'w1', target: 'w3' } },
      { data: { source: 'w2', target: 'w3' } },
      { data: { source: 'w2', target: 'w4' } },
      { data: { source: 'w3', target: 'w4' } }
    ]
  },
  
  layout: {
    name: 'grid',
    padding: 10
  }
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

}); // on dom ready