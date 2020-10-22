"https://unpkg.com/mapillary-js@1.7.1/dist/mapillary-js.min.js",
Mapillary

function mapillaryImage(lat, long) {
  console.log("Mapillary lat/long: ", lat, long);
  $.get("https://a.mapillary.com/v3/images", {
    client_id: 'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
    // closeto: [long,lat], // [-71.1189,42.3733]
    closeto: [-71.1189,42.3733],
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
};
