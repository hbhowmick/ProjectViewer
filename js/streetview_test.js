// Event handler that fires each time an action is clicked.
view.popup.on("trigger-action", function(event) {
  // console.log(event)
  // Execute the openProjectModal() function if the more-info action is clicked
  if (event.action.id === "more-info") {
    // var popupIndex = view.popup.selectedFeatureIndex;
    // var popupID = view.popup.features[popupIndex].attributes.ProjectID;
    // openProjectModal(popupID);

    selectedFeature = view.popup.selectedFeature;
    openProjectModal(selectedFeature);

  }

  var geomType = selectedFeature.geometry.type
  if (geomType == 'point') {
    geomLat = selectedFeature.geometry.latitude;
    geomLong = selectedFeature.geometry.longitude;
  } else if (geomType == 'polyline') {
    geomLat = selectedFeature.geometry.extent.center.latitude;
    geomLong = selectedFeature.geometry.extent.center.longitude;
  } else {
    console.log("need to add code") // TODO: add appropriate code
  }
  // console.log(geomLong, geomLat);
  mapillaryImage(geomLat, geomLong);
  // googleMap(geomLat, geomLong);
  googleStreetView(geomLat, geomLong)
});


function googleStreetView(lat, long) {
  var mapCenter = {
    lat: lat, // 42.344
    lng: long // -71.036
  }
  // var gMap = new google.maps.Map(document.getElementById('g_map'), {
  //   zoom: 14,
  //   center: mapCenter
  // })
  var gPanorama = new google.maps.StreetViewPanorama(document.getElementById('g_streetview'), {
    position: mapCenter,
    pov: {
      heading: 34,
      pitch: 10
    },
    // fov: 20,
    visible: true
  })
  // gMap.setStreetView(gPanorama)
};



function mapillaryImage(lat, long) {
  console.log(lat, long);
  $.get("https://a.mapillary.com/v3/images", {
    client_id: 'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
    closeto: [long,lat], // [-71.1189,42.3733]
    per_page: 100,
    radius: 10000,
  })
  .done(function (data) {
    var featuresMapAPI = [];
    featuresMapAPI = data.features;
    var latMapAPI = featuresMapAPI[0].geometry.coordinates[1];
    var longMapAPI = featuresMapAPI[0].geometry.coordinates[0];
    // console.log(longMapAPI, latMapAPI);
    var keyMapAPI = String(featuresMapAPI[0].properties.key);
    // console.log(keyMapAPI);
    var mlyCombined;
    mlyCombined = {};
    mlyCombined = new Mapillary.Viewer(
      'mly',
      'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
      keyMapAPI,
    )
  })
}
