$(document).ready(function () {

  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/geometry/Point",
    "esri/symbols/SimpleMarkerSymbol",
    "https://unpkg.com/mapillary-js@1.7.1/dist/mapillary-js.min.js",
    // "https://unpkg.com/mapillary-js@2.18.0/dist/mapillary.min.js",
    "dojo/domReady!"
  ], function (Map, MapView, Graphic, Point, MarkerSymbol, Mapillary) {



    var mlyCombined = new Mapillary.Viewer(
      'mly',
      'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
      'r14qaUsIsVfOdkclEXb3Ig',
      // {cover: false},
      {
        component: {
          cover: false,
          sequence: {
            visible: false
          },
        }
      }
    );

    $('.mapillary').hide();
    $('.tw-toggle').click(function(){
      $('#viewMini,.mapillary').toggle();
    });


    // var symbolJson = {
    //   "style": "Circle",
    //   "color": [54, 175, 109, 255],
    //   "size": 12,
    //   "outline": {
    //     "color": [255,255,255],
    //     "width": 2
    //   }
    // };
    //
    // var view;
    // var marker;
    //
    // mly.on("nodechanged", function (node) {
    //   var latLon = new Point({
    //     longitude: node.latLon.lon,
    //     latitude: node.latLon.lat
    //   });
    //
    //
    //   if (!view) {
    //     var map = new Map({
    //       basemap: "gray"
    //     });
    //
    //     view = new MapView({
    //       // center: [node.latLon.lon, node.latLon.lat],
    //       // container: "viewDiv",
    //       // map: map,
    //       // zoom: 15,
    //       map: map,
    //       container: "viewDiv",
    //       zoom: 12,
    //       center: [-71.2, 42.2],
    //     });
    //   } else {
    //     view.centerAt(latLon);
    //   }
    //
    //   if (!marker) {
    //     marker = new Graphic();
    //     marker.symbol = new MarkerSymbol(symbolJson);
    //     view.graphics.add(marker);
    //     marker.geometry = latLon;
    //     marker.watch("geometry", function (oldValue, newValue) {
    //       view.graphics.removeAll();
    //       view.graphics.add(marker);
    //       view.goTo(newValue);
    //     })
    //
    //   }
    //   marker.geometry = latLon;
    // });
  }); // end required function
}); // end document ready
