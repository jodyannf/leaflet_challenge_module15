// Store our API endpoint as queryUrl.
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let tectonicplatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Perform a GET request to the query URL
d3.json(queryUrl).then(function (data) {
  // Console log the data retrieved 
  //console.log(data);
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

// Function to determine marker size
function markerSize(magnitude) {
    return magnitude * 20000;
  };

// Circles color palette based on mag (feature) data marker: data markers should reflect the magnitude of the earthquake by their size and the depth of the earthquake by color. Earthquakes with higher magnitudes should appear larger, and earthquakes with greater depth should appear darker in color.
function chooseColor(mag){
  switch(true){
      case(1.0 <= mag && mag <= 2.5):
          return "#0071BC"; // Strong blue
      case (2.5 <= mag && mag <=4.0):
          return "#35BC00";
      case (4.0 <= mag && mag <=5.5):
          return "#BCBC00";
      case (5.5 <= mag && mag <= 8.0):
          return "#BC3500";
      case (8.0 <= mag && mag <=20.0):
          return "#BC0000";
      default:
          return "#E2FFAE";
  }
}

function createFeatures(earthquakeData) {

    // Define a function that we want to run once for each feature in the features array.
    // Give each feature a popup that describes the place and time of the earthquake.
    function onEachFeature(feature, layer) {
      layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
    }

    // Create a GeoJSON layer that contains the features array on the earthquakeData object.
    // Run the onEachFeature function once for each piece of data in the array.
    let earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,

    // Point to layer used to alter markers
    pointToLayer: function(feature, latlng) {

        // Determine the style of markers based on properties
      let markers = {
        radius: markerSize(feature.properties.mag),
        fillColor: chooseColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        stroke: true,
        weight: 0.5
      }
      return L.circle(latlng,markers);
     }
    });
    // Send our earthquakes layer to the createMap function/
    createMap(earthquakes);
}

// Create layer for tectonic plates
let tectonicPlates = new L.layerGroup();

// Perform a GET request to the tectonicplatesURL
d3.json(tectonicplatesUrl).then(function (plates) {

    // Console log the data retrieved 
    console.log(plates);
    L.geoJSON(plates, {
        color: "orange",
        weight: 2
    }).addTo(tectonicPlates);
});

function createMap(earthquakes) {

  // Add a Satellite layer 
  let googleSatmap = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
  });

  // Define Base map layer
  let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Add a TopoMap tile layer.
  let topographicmap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

   // Define a baseMaps object to hold our base layers
   let baseMaps = {
    "Street Map": basemap,
    "Satellite": googleSatmap,
    "Topographic": topographicmap
  };

  // Create overlay object to hold our overlay layer
  let overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic plates": tectonicPlates
  };

   // Create our map, giving it the streetmap and earthquakes layers to display on load
   let myMap  = L.map("map", {
    center: [
      9.8282, -28.5795
    ],
    zoom: 3,
    layers: [basemap, earthquakes]
  });

  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
 
  // Add legend
  let legend = L.control({position: 'bottomright'});

  legend.onAdd = function() {
       var div = L.DomUtil.create('div', 'info legend');
       var grades = [1.0, 2.5, 4.0, 5.5, 8.0];
       var labels = [];
       var legendInfo = "<h4>Magnitude</h4>";
   
       div.innerHTML = legendInfo
   
       // go through each magnitude item to label and color the legend
       // push to labels array as list item
       for (var i = 0; i < grades.length; i++) {
             labels.push('<ul style="background-color:' + chooseColor(grades[i] + 1) + '"> <span>' + grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '' : '+') + '</span></ul>');
           }
   
         // add each label list item to the div under the <ul> tag
         div.innerHTML += "<ul>" + labels.join("") + "</ul>";
       
       return div;
  };

   legend.addTo(myMap)
};