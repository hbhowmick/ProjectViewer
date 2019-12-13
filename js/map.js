$(document).ready(function () {

  require(["esri/views/MapView", "esri/Map", "esri/WebMap", "esri/layers/MapImageLayer", "esri/tasks/QueryTask", "esri/tasks/support/Query", "esri/core/watchUtils",
    "esri/widgets/Search",
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/tasks/Locator",
    "esri/Graphic"
  ], function (MapView, Map, WebMap, MapImageLayer, QueryTask, Query, watchUtils, Search, Expand, Legend, FeatureLayer, GraphicsLayer, Locator, Graphic) {
    var projId;
    var reset;
    var extentForRegionOfInterest = false;
    var map = new Map({
      basemap: "topo"
    });

    var view = new MapView({
      map: map,
      container: "viewDiv",
      zoom: 9, // Sets zoom level based on level of detail (LOD)
      center: [-71.8, 42] // Sets center point of view using longitude,latitude
    });

    var projectLocations = new MapImageLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer",
      sublayers: [{
        id: 1,
        title: "MassDOT Division",
        outFields: ["*"],
        visible: true,
        popupEnabled: true,
        popupTemplate: {
          title: "{Project_Description}",
          content: popupFunction
        }
      }],
    });

    var legend = new Expand({
      content: new Legend({
        view: view,
        style: "classic",
        layerInfos: [{
          layer: projectLocations,
          title: "Capital Investment Plan Projects"
        }],
      }),
      view: view,
      expanded: true
    });
    view.ui.add(legend, "top-right");


    var queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/0"
    });

    var townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });


    function popupFunction(target) {
      var query = new Query({
        outFields: ["*"],
        where: "Project_Description = '" + target.graphic.attributes.Project_Description + "'"
      });
      return queryProjectTask.execute(query).then(function (result) {
        var attributes = result.features[0].attributes;
        if (view.popup.selectedFeature.attributes.Project_Description == attributes.Project_Description) {
          projId = attributes.ProjectID;
          console.log("FIRST POPUP PROJ ID SET", projId);
          showComments(projId);
        }
        return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'>" + attributes.ProjectID + "</br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + attributes.Total__M + "</p>";
      });
    }

    var searchWidget = new Search({
      view: view,
      allPlaceholder: "Search location or project (ex. Red-Blue Connector)",
      locationEnabled: false,
      popupEnabled: true,
      container: "searchPlace",
      includeDefaultSources: false,
      sources: [{
        layer: new FeatureLayer({
          url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/1",
          outFields: ["*"],
          popupTemplate: {
            title: "{Project_Description}",
            content: popupFunction
          }
        }),
        searchFields: ["Project_Description", "Program"],
        displayField: "Project_Description",
        exactMatch: false,
        outFields: ["*"],
        name: "CIP Projects",
        placeholder: "example: Red-Blue Connector",
        maxResults: 60,
        maxSuggestions: 6,
        suggestionsEnabled: true,
        minSuggestCharacters: 2,
        popupEnabled: true,
        autoNavigate: true
      }, {
        locator: new Locator({
          url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
        }),
        singleLineFieldName: "SingleLine",
        outFields: ["Addr_type"],
        name: "Address Search"
      }]
    });

    map.add(projectLocations);

    view.on('click', function (event) {
      projId;
      $('#projectList').hide();
      searchWidget.clear();
    })

    watchUtils.watch(view.popup, "visible", function () {
      $(".esri-popup__navigation").on("click", function (e) {
        projId = false;
        console.log("BUTTON PRESSED", projId);
        showComments(projId);
      });
    });

    watchUtils.watch(view.popup, "selectedFeature", function () {
      projId = false;
      console.log("SELECTED FEATURE CHANGED", projId)
    });

    $(".filter").change(function () {
      filterMap();
      console.log("triggered");
    });


    $("#townSelect").change(function () {
      var query = townLayer.createQuery();
      if ($("#townSelect").val() > 0) {
        query.where = "TOWN_ID = " + $("#townSelect").val();
        query.returnGeometry = true;
        query.outFields = ["TOWN_ID", "TOWN"];
        query.outSpatialReference = view.spatialReference;
        townLayer.queryFeatures(query)
        .then(function (response) {
          console.log(response.features[0].geometry);
          extentForRegionOfInterest = response.features[0].geometry
			view.goTo({
			  target: response.features[0].geometry,
			  zoom: 5
			});
			filterMap();
          });
      } else {
        extentForRegionOfInterest = false;
        filterMap();
      }
    });

    var resultsLayer = new GraphicsLayer();
    map.add(resultsLayer);

    $(".listItem").click(function() {
      console.log("clicked");
      // projectSelected = $(".listItem").val()
      // projectSelected = "ACTON- CONCORD- BRUCE FREEMAN RAIL TRAIL CONSTRUCTION, INCLUDES REPLACING BRIDGE C-19-037, RAIL TRAIL OVER NASHOBA BROOK, NEW BRIDGE C-19-039, RAIL TRAIL OVER ROUTE 2 & NEW CULVERT C-19-040, ROUTE 2 OVER WILDLIFE CROSSING (PHASE II-B)"
      // projects = "Project_Description = '" + projectSelected + "'"
    });

    function filterMap() {
      resultsLayer.removeAll();
      sql = "1=1"
      var divisions = "(1=1)";
      if ($("#division").val() !== "All") {
        divisions = "Division = '" + $("#division").val() + "'";
      } else {
        divisions = "1=1"
      }

      programs = "(1=1)"
      if ($("#programs").val()[0] == 'All') {
        programs = "(1=1)"
      } else {
        $($("#programs").val()).each(function () {
          if (this == $("#programs").val()[0]) {
            programs = "Program = '" + this + "'"
          } else {
            programs = programs + " OR Program = '" + this + "'"
          }
        });
      }

      // var projects = "(1=1)"
      // if ($("#programs").val()[0] == 'All') {
      //   projects = "(1=1)"
      // } else {
      //   projectSelected = "ACTON- CONCORD- BRUCE FREEMAN RAIL TRAIL CONSTRUCTION, INCLUDES REPLACING BRIDGE C-19-037, RAIL TRAIL OVER NASHOBA BROOK, NEW BRIDGE C-19-039, RAIL TRAIL OVER ROUTE 2 & NEW CULVERT C-19-040, ROUTE 2 OVER WILDLIFE CROSSING (PHASE II-B)"
      //   projects = "Project_Description = '" +
      //   projectSelected + "'"
      // }
      projects = "1=1"
      // $(".listItem").click(function() {
      //   console.log("clicked");
      //   // projectSelected = $(".listItem").val()
      //   projectSelected = "ACTON- CONCORD- BRUCE FREEMAN RAIL TRAIL CONSTRUCTION, INCLUDES REPLACING BRIDGE C-19-037, RAIL TRAIL OVER NASHOBA BROOK, NEW BRIDGE C-19-039, RAIL TRAIL OVER ROUTE 2 & NEW CULVERT C-19-040, ROUTE 2 OVER WILDLIFE CROSSING (PHASE II-B)"
      //   projects = "Project_Description = '" + projectSelected + "'"
      // });

      // projectSelected = "ACTON- CONCORD- BRUCE FREEMAN RAIL TRAIL CONSTRUCTION, INCLUDES REPLACING BRIDGE C-19-037, RAIL TRAIL OVER NASHOBA BROOK, NEW BRIDGE C-19-039, RAIL TRAIL OVER ROUTE 2 & NEW CULVERT C-19-040, ROUTE 2 OVER WILDLIFE CROSSING (PHASE II-B)"
      // projects = "Project_Description = '" + projectSelected + "'"


      $("#minValue").html("Minimum project cost: $" + parseInt($("#min").val().replace(/\D/g, '')).toLocaleString())
      $("#maxValue").html("Maximum project cost: $" + parseInt($("#max").val().replace(/\D/g, '')).toLocaleString())
      sql = sql + " AND (" + divisions + ") AND (" + programs + ") AND (" + projects + ") AND ( Total__M >= " + $("#min").val() + " AND Total__M <= " + $("#max").val() + ")"


      projectLocations.findSublayerById(1).definitionExpression = sql;
      queryParams = projectLocations.findSublayerById(1).createQuery();
      if (extentForRegionOfInterest == false) {} else {
        queryParams.geometry = extentForRegionOfInterest;
      }
      queryParams.where = sql;
      projectLocations.findSublayerById(1).queryFeatures(queryParams).then(function (results) {
        view.goTo(extentForRegionOfInterest);
        var features = results.features.map(function (graphic) {
          graphic.symbol = {
            type: "simple-line",
            cap: "round",
            width: 4,
            color: [255, 0, 197, 0.51]
          };
          return graphic;
        });
        resultsLayer.addMany(features).then(function (results) {
        });
      });
    };



  });
});
