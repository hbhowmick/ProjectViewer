$(document).ready(function () {
  require([
    "esri/layers/FeatureLayer",
    "esri/layers/MapImageLayer",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Home",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/widgets/BasemapGallery",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/widgets/Feature",
    "esri/geometry/Extent",
    "esri/geometry/Polygon",
    "esri/geometry/support/webMercatorUtils"
  ], function (FeatureLayer, MapImageLayer, Map, MapView, Home, Legend, Expand, BasemapGallery, Graphic, GraphicsLayer, QueryTask, Query, Feature, Extent, Polygon, webMercatorUtils) {

    projectSearchID = false;
    searchedProject = false;
    sqlFilters = "1=1";
    divisionSQL = "1=1";
    programSQL = "1=1";
    costMinSQL = "Total>=0";
    costMaxSQL = "Total<=5000000000";
    projSrcSQL = "1=1";

    locName = "All";
    locGeom = null;
    hoverGeom = null;

    pointProjects = [];
    pointProjects_ids = [];
    lineProjects = [];
    lineProjects_ids = [];
    mbtaModes = [];
    mbtaFeatures =[];
    mbtaProjects = [];
    locFilterProjects = [];
    statewideProjects = [];
    allProjects = [];
    projectTally = 0;

    possibleLineDivs = [];
    lineDivisions = [];
    possiblePointDivs = [];
    pointDivisions = [];
    mbtaDivisions = [];
    locationDivisions = [];
    statewideDivisions = [];
    allDivisions = [];

    checkedLines = false;
    checkedPoints = false;
    checkedMBTA = false;
    checkedLocFilters = false;
    checkedStatewide = false;

    mapPopups = [];
    popupsShown = [];
    popupCount = 0;
    popupIndex = 0;
    popupIndexVal = 0;

    queryTask = new QueryTask({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/6"
    });

    function possibleDivs(locSrc) {
      var query = new Query({
        outFields: ["*"],
        where: "Location_Source = '" + locSrc + "'"
      });
      return queryTask.execute(query).then(function (result) {
        for(var i=0; i<result.features.length; i++) {
          var locSrc = result.features[i].attributes.Location_Source;
          // console.log(feature_locSrc);
          var locSrc_div = result.features[i].attributes.Division;
          if(locSrc == 'POINT') {
            if(!possiblePointDivs.includes(locSrc_div)){
              possiblePointDivs.push(locSrc_div);
            };
          } else if(locSrc == 'LINE'){
            if(!possibleLineDivs.includes(locSrc_div)){
              possibleLineDivs.push(locSrc_div);
            };
          };
        };
        // if(possiblePointDivs.length>0 && possibleLineDivs.length>0) {
        //   console.log('All Possible Point Divisions:', possiblePointDivs, '\nAll Possible Line Divisions:', possibleLineDivs);
        // };
      });
    };
    possibleDivs('POINT');
    possibleDivs('LINE');

    function updateSQL() {
      sqlFilters = divisionSQL + " AND " + programSQL
      + " AND " + costMinSQL + " AND " + costMaxSQL
       // + " AND " + projSrcSQL;
      // console.log("\nSQL:", sqlFilters, "\n");
    };
    // updateSQL();

    stateExtent = new Polygon({
      rings: [
        [
          [-73.5, 42.5],
          [-73.5, 41.5],
          [-70, 42.5],
          [-70, 41.5]
        ]
      ],
      spatialReference: {
        wkid: 4326
      }
    });

    polySymbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    };

    projectList = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/6",
      outFields: ["*"],
      visible: true,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction,
      }
    });
    projectPoints = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/3",
      outFields: ["*"],
      visible: true,
      title: "Point Projects",
      minScale: 2500000,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction,
      },
    });
    projectLines = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/1",
      outFields: ["*"],
      visible: true,
      title: "Line Projects",
      minScale: 2500000,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction,
      }
    });
    projectMBTA = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter"],
      minScale: 2500000,
      title: "MBTA Projects",
      popupTemplate: {
        title: "MBTA Route: {MBTA_Location}",
        content: popupFunctionMBTA,
      }
    });
    projectLocationsPolygonsMapImageLayer = new MapImageLayer({
      url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer",
      sublayers: [{
        id: 4,
        opacity: 0.3,
        popupEnabled: true,
        definitionExpression: "Location_Type <> 'MPO'",
        popupTemplate: {
          title: "{Location_Type} - {Location}",
          content: "<p id='popupFeatureSelected' class='polyList' modeType='{Location}' val='{Location}'><button class='btn btn-info'>View projects in this {Location_Type}</button><br>"
            + "<p id='popupFeatureSelectedStatewide' class='polyList' modeType='Statewide' val='{Location}'><button class='btn btn-info'>View statewide projects</button>"
        }
      }]
    });

    polyGraphics = new GraphicsLayer({
      title: "Polygon Geographies (GraphicsLayer)"
    });
    highlightGraphics = new GraphicsLayer({
      title: "Highlighted GraphicsLayer"
    });
    clickGraphics = new GraphicsLayer({
      title: "Clicked GraphicsLayer"
    });
    var pointHighlight = new Graphic();
    pointHighlight.symbol = {
      type: "picture-marker",
      url: "https://static.arcgis.com/images/Symbols/Firefly/FireflyC18.png",
      width: "60px",
      height: "60px",

    };
    var lineHighlight = new Graphic();
    var lineHighlight2 = new Graphic();
    var lineHighlight3 = new Graphic();
    var lineHighlight4 = new Graphic();
    lineHighlight.symbol = {
      type: "simple-line",
      color: [255, 255, 255, 1],
      width: 2
    };
    lineHighlight2.symbol = {
      type: "simple-line",
      color: [245, 147, 0, 0.6],
      width: 5
    };
    lineHighlight3.symbol = {
      type: "simple-line",
      color: [240, 154, 15, 0.5],
      width: 7
    };
    lineHighlight4.symbol = {
      type: "simple-line",
      color: [227, 166, 22, 0.3],
      width: 10
    };

    map = new Map({
      // basemap: "streets-night-vector",
      basemap: "dark-gray"
    });
    map.addMany([
      polyGraphics,
      projectMBTA,
      projectLines,
      projectPoints,
      highlightGraphics,
      clickGraphics
    ]);

    view = new MapView({
      map: map,
      // center: [-72, 42],
      // zoom: 8,
      container: "viewDiv",
      popup: {
        autoOpenEnabled: false, // false hides popup in map
        // featureNavigationEnabled: true, // allows pagination of multiple selected features
      },
      spatialReference: {
        wkid: 3857
      },
      highlightOptions: {
        color: [255,165,0], //orange
        fillOpacity: 0.4
      }
    });

    // ---------- Home Widget ----------
    function zoomToLayer(layer) {
      return layer.queryExtent().then(function (response) {
        view.goTo(response.extent)
        .then(function() {
          view.extent = response.extent;
          initialExtent = view.extent;
          initialZoom = view.zoom;
          locExtent = initialExtent;
          locZoom = initialZoom;
          locLat = view.center.latitude;
          locLong = view.center.longitude;
        })
        .catch(function (error) {
          if (error.name != "AbortError") {
            console.error(error);
          };
        });
      });
    };
    projectLines.when(function() {
      zoomToLayer(projectLines);
    });
    homeWidget = new Home({
      view: view
    });

    legend = new Legend({
      view: view,
      layerInfos: [{
        layer: projectLines,
        title: "Linear Projects"
      }, {
        layer: projectPoints,
        title: "Point Projects"
      }]
    });

    var legend = new Expand({
      content: new Legend({
        view: view,
        style: "card"
      }),
      view: view,
      expanded: true
    });

    view.ui.add([
      {
        component: homeWidget,
        position: "top-left",
        index: 1
      }, {
        component:legend,
        position: "bottom-left",
        index: 3
      }
    ]);

    $(document).on("click", ".esri-home", function(e){
      view.goTo(locExtent);
    });

    projectLocationsPolygonsMapImageLayer.when(function () {
      prjLocationPolygons = projectLocationsPolygonsMapImageLayer.findSublayerById(4);
    });

    $("#divisionSelect").change(function() {
      if ($("#divisionSelect").val() !== "All") {
        divisionSQL = "Division='" + $("#divisionSelect").val() + "'"
      } else {
        divisionSQL = "1=1"
      }
      divisionSQL = "(" + divisionSQL + ")"
      $("#programSelect").val("")
      $("#programSelect option").filter(function () {
        $(this).toggle(
          $(this).attr("division") == $('#divisionSelect').val() || $(this).attr("division") == "All")
      });
      programSQL = "1=1"
    });
    $("#programSelect").change(function() {
      if ($("#programSelect").val()[0] == 'All' || $("#programSelect").val()[0] == '') {
        programSQL = "1=1"
      } else {
        $($("#programSelect").val()).each(function () {
          if (this == $("#programSelect").val()[0]) {
            programSQL = "Program='" + this + "'"
          } else {
            programSQL = programSQL + " OR Program = '" + this + "'"
          }
        })
      }
      programSQL = "(" + programSQL + ")"
    });
    $("#minCostSelect").change(function() {
      if ($("#minCostSelect").val() !== 0) {
        costMinSQL = "Total>=" + numeral($("#minCostSelect").val()).value();
      } else {
        costMinSQL = "Total>=0"
      }
    });
    $("#maxCostSelect").change(function() {
      if ($("#maxCostSelect").val() !== 5000000000) {
        costMaxSQL = "Total<=" + numeral($("#maxCostSelect").val()).value();
      } else {
        costMaxSQL = "Total<=5000000000"
      }
    });
    $("#projSources").change(function() {
      if ($("#projSources").val() !== 'All') {
        projSrcSQL = "Source='" + $("#projSources").val() + "'";
      } else {
        projSrcSQL = "1=1"
      }
    });

    function resetLocFilters(dropdown, selection) {
      var locFilters = $(dropdown).parentsUntil("#sideFilters","#spatialFilters").find("select");
      for(var i=0; i<locFilters.length; i++) {
        if(locFilters[i].id == dropdown.substr(1)) {
          $(locFilters[i]).val(selection);
        } else {
          if(locFilters[i].id.includes('town'.toLowerCase())) {
            $(locFilters[i]).val("0");
          } else {
            $(locFilters[i]).val("All");
          };
        };
      };
    };

    $("#spatialFilters select").change(function() {
      var dropdown = '#' + this.id;
      var selection = this.value;
      resetLocFilters(dropdown, selection);

      locName = selection.replace(/'/g, '%');

      var selectDropdown = dropdown.split("elect")[0].substr(1);
      if(selectDropdown.includes("mpo") || selectDropdown.includes("rta")) {
        selectDropdown = selectDropdown.slice(0,3).toUpperCase() + selectDropdown.slice(-1).toLowerCase();
      } else {
        selectDropdown = selectDropdown[0].toUpperCase() + selectDropdown.substr(1).toLowerCase();
      };

      locLayer = new FeatureLayer({
        url: url[selectDropdown]
      });
      locQuery = locLayer.createQuery();

      if(locName !== "All" && locName !== "0") {
        if(selectDropdown.includes("Town")) {
          whereCol = "TOWN LIKE '";
        } else if(selectDropdown.includes("MPO")) {
          whereCol = "MPO LIKE '";
        } else if(selectDropdown.includes("RTA")) {
          whereCol = "RTA_NAME LIKE '";
        } else if(selectDropdown.includes("District")) {
          whereCol = "DistrictName LIKE '";
        }
        locQuery.where = whereCol + locName + "'";
      } else {
        locName = 'All';
        console.log("locName:", locName);
        locGeom = null;
        locQuery.where = "1=1";
        locExtent = initialExtent;

        polyGraphics.removeAll();
      };
    });

    function filterLayers() {
      view.when(function () {
        if(locName !== "All") { // && locName !== 0
          getLocFilterProjects(locName); // if both non-spatial and spatial filters (e.g. Div=Highway, Town=Abington)
        } else {
          getPolyGeomProjects(); // if non-spatial filter(s) only (e.g. Div=Highway, Town=All)
        };
        $("#loadingScreen").css('display', 'none');
        view.map.layers.forEach(function (layer, index) {
          if(layer.title !== null) {
            layer.visible = true;
            view.whenLayerView(layer).then(function (layerView) {
              // console.log("Layer title:", layer.title);
              if(layer.title.includes('Projects')) {
                var layerQuery = layer.createQuery();
                if(!layer.title.includes('MBTA')) {
                  layerQuery.where = sqlFilters;
                  // console.log(layer.title + " where: " + layerQuery.where)
                } else {
                  layerQuery.where = "1=1";
                };

                layerQuery.returnGeometry = true
                layerQuery.outFields = ["*"]
                layerQuery.outSpatialReference = view.spatialReference

                if(locName !== "All") { // && locName !== 0
                  layerQuery.geometry = locGeom,
                  layerQuery.spatialRelationship = "intersects"
                };

                layer.queryFeatures(layerQuery)
                .then(function(results) {
                  if(layer.title.includes('MBTA')) {
                    if($("#divisionSelect").val() == 'MBTA' || $("#divisionSelect").val() == 'All'){
                      if(results.features.length>0) {
                        mbtaModes = ["System"];
                        mbtaDivisions = ["MBTA"];
                        mbtaFeatures = results.features;
                        // console.log("MBTA features:", mbtaFeatures)
                        filterMBTAlines(results);
                        projectMBTA.visible = true;
                      } else {
                        mbtaModes = [];
                        mbtaDivisions = [];
                        checkedMBTA = true;
                        checkLayers();
                        projectMBTA.definitionExpression = "1=0";
                      }
                    } else {
                      mbtaModes = [];
                      mbtaDivisions = [];
                      checkedMBTA = true;
                      checkLayers();
                      projectMBTA.definitionExpression = "1=0";
                    };
                    // console.log("MBTA project modes:", mbtaModes);
                  } else {
                    if(results.features.length>0) {
                      getProjects(results, layer.title);
                    } else if (results.features.length==0) {

                      if(layer.title.toLowerCase().includes('line')) {
                        lineDivisions = [];
                        checkedLines = true;
                        checkLayers();
                      } else if(layer.title.toLowerCase().includes('point')) {
                        pointDivisions = [];
                        checkedPoints = true;
                        checkLayers();
                      };
                      layer.definitionExpression = "1=0";
                    };
                    if(checkedLines==true && checkedPoints==true) {
                      getStatewideProjects();
                    };
                  };
                })
                .catch(function (error) {})
              };
            });
          };
        });
      });
    };

    function getProjects(results, title) {
      var divisionsArray = [];
      var projectIDs = [];
      var defExp = "ProjectID='";
      var features = results.features;
      for(var i=0; i<features.length; i++){
        var projDiv = features[i].attributes.Division;
        if(!divisionsArray.includes(projDiv)) {
          divisionsArray.push(projDiv)
        };
        var projectID = features[i].attributes.ProjectID;
        projectIDs.push(projectID);
        if(projectIDs.length>1) {
          defExp = defExp + " OR ProjectID='" + projectID + "'";
        } else {
          defExp = defExp + projectID + "'";
        };
      };
      if(title.toLowerCase().includes('line')) {
        if(locName=="All") { // || locName == 0
          projectLines.definitionExpression = sqlFilters;
        } else {
          projectLines.definitionExpression = defExp;
        }
        // console.log("Lines defExp:", projectLines.definitionExpression);
        for(var i=0; i<features.length; i++) {
          var pid = features[i].attributes.ProjectID;
          if(!lineProjects_ids.includes(pid)){
            lineProjects_ids.push(pid);
            lineProjects.push(features[i]);
          };
        };
        allProjects.push(lineProjects);
        projectTally = projectTally + features.length;
        // console.log("Line Projects:", lineProjects);
        lineDivisions = divisionsArray;
        checkedLines = true;
        checkLayers();
      } else if (title.toLowerCase().includes('point')) {
        if(locName=="All") { // || locName==0
          console.log("no spatial filters applied")
          projectPoints.definitionExpression = sqlFilters;
        } else {
          console.log('spatial filter applied')
          projectPoints.definitionExpression = defExp;
        }
        // console.log("Points defExp:", projectPoints.definitionExpression);

        for(var i=0; i<features.length; i++) {
          var pid = features[i].attributes.ProjectID;
          if(!pointProjects_ids.includes(pid)){
            pointProjects_ids.push(pid);
            pointProjects.push(features[i]);
          };
        };
        allProjects.push(pointProjects);
        projectTally = projectTally + features.length;
        // console.log("Point Projects:", pointProjects);
        pointDivisions = divisionsArray;
        checkedPoints = true;
        checkLayers();
      };
    };

    function filterMBTAlines(results) {
      var features = results.features;
      var mbtaLocs = [];
      var defExp = "MBTA_Location LIKE '%";

      for(var i=0; i<features.length; i++) {
        var mbtaMode = features[i].attributes.route_desc;
        if(!mbtaModes.includes(mbtaMode)) {
          mbtaModes.push(mbtaMode); // (e.g. Rapid Transit, Commuter Rail)
        };
        var mbtaLoc = features[i].attributes.MBTA_Location;
        if(!mbtaLocs.includes(mbtaLoc)) {
          mbtaLocs.push(mbtaLoc);
          mbtaModes.push(mbtaLoc); // (e.g. Green Line, Haverhill Line)
          if(mbtaLocs.length>1)  {
            defExp = defExp + " OR MBTA_Location LIKE '%" + mbtaLoc + "%'";
          } else {
            defExp = defExp + mbtaLoc + "%'";
          }
        }
      }
      // console.log("mbtaLocs:", mbtaLocs);
      getMBTAprojects(mbtaModes);
      projectMBTA.definitionExpression = defExp;
    };

    function getMBTAprojects(mbta_locations) {
      var mbtaWhere = "(" + sqlFilters + " AND Location_Source <> 'POINT' AND  Location_Source <> 'LINE' AND Location_Source <> 'Statewide'" + ") AND (";
      var mbtaQuery = projectList.createQuery();
      for(var i=0; i<mbta_locations.length; i++) {
        var last = mbta_locations.length - 1;
        if(i == 0){
          mbtaWhere = mbtaWhere + "MBTA_Location LIKE '%" + mbta_locations[i] + "%'";
        } else {
          mbtaWhere = mbtaWhere + " OR MBTA_Location LIKE '%" + mbta_locations[i] + "%'";
        };
        if(i == last) {
          mbtaWhere = mbtaWhere + ")";
        };
      };
      mbtaQuery.where = mbtaWhere;
      mbtaQuery.outFields = ["*"]

      projectList.queryFeatures(mbtaQuery)
      .then(function(results) {
        for(var i=0; i<results.features.length; i++) {
          var geom = getMBTAgeometry(results.features[i]);
          results.features[i].geometry = geom;
        };
        mbtaProjects.push(results.features);
        allProjects.push(results.features);
        projectTally = projectTally + results.features.length;
        // console.log("MBTA Projects:", mbtaProjects);
        checkedMBTA = true;
        checkLayers();
      });
    };

    function getMBTAgeometry(feature) {
      // console.log("MBTA_Location:", feature.attributes.MBTA_Location);
      for(var i=0; i<mbtaFeatures.length; i++) {
        if (mbtaFeatures[i].attributes.MBTA_Location == feature.attributes.MBTA_Location) {
          var geom = mbtaFeatures[i].geometry;
          return geom;
        } else {
          return
        }
      }
      // console.log("MBTA geometries:", mbtaFeatures);
    };

    function getLocFilterProjects(locName) {
      var divisionsArray = [];
      var projectIDs = [];
      locFilterQuery = projectList.createQuery();
      locFilterQuery.where = sqlFilters + " AND Location_Source LIKE '%" + locName + "%'";
      projectList.queryFeatures(locFilterQuery).then(function(results) {
        locFilterProjects = results.features;
        allProjects.push(locFilterProjects);
        projectTally = projectTally + results.features.length;
        // console.log("Location Projects:", locFilterProjects);

        for(var i=0; i<locFilterProjects.length; i++){
          var projDiv = locFilterProjects[i].attributes.Division;
          if(!divisionsArray.includes(projDiv)) {
            divisionsArray.push(projDiv)
          };
          var projectID = locFilterProjects[i].attributes.ProjectID;
          projectIDs.push(projectID);
        };
        locationDivisions = divisionsArray;

        checkedLocFilters = true;
        checkLayers();
      });
    };

    function getPolyGeomProjects() {
      var divisionsArray = [];
      var projectIDs = [];
      polyGeomQuery = projectList.createQuery();
      polyGeomQuery.where = sqlFilters + " AND Location_Source <> 'POINT' AND  Location_Source <> 'LINE' AND Location_Source <> 'MBTA' AND Location_Source <> 'Statewide'";
      projectList.queryFeatures(polyGeomQuery).then(function(results) {
        polyGeomProjects = results.features;
        allProjects.push(polyGeomProjects);
        projectTally = projectTally + results.features.length;
        // console.log("Location Projects:", polyGeomProjects);

        for(var i=0; i<polyGeomProjects.length; i++){
          var projDiv = polyGeomProjects[i].attributes.Division;
          if(!divisionsArray.includes(projDiv)) {
            divisionsArray.push(projDiv)
          };
          var projectID = polyGeomProjects[i].attributes.ProjectID;
          projectIDs.push(projectID);
        };
        locationDivisions = divisionsArray;

        checkedLocFilters = true;
        checkLayers();
      });
    };

    function getStatewideProjects() {
      statewideQuery = projectList.createQuery();
      statewideQuery.where = sqlFilters + " AND Location_Source = 'Statewide'";
      projectList.queryFeatures(statewideQuery).then(function(results) {
        statewideProjects = results.features;
        allProjects.push(statewideProjects);
        console.log("Statewide Projects:", statewideProjects);
        checkedStatewide = true;
        checkLayers();
      });
    };

    function checkStatewideDivs(divArray) {
      for(var i=0; i<divArray.length; i++) {
        var array = divArray[i];
        for(var j=0; j<array.length; j++) {
          if(!allDivisions.includes(array[j])) {
              allDivisions.push(array[j]);
          };
        };
      };
      // console.log("Point Divisions:", pointDivisions);
      // console.log("Line Divisions:", lineDivisions);
      console.log("All Divisions (before Statewide):", allDivisions);
      var divisionsArray = [];
      for(var k=0; k<statewideProjects.length; k++) {
        var projDiv = statewideProjects[k].attributes.Division;
        var projectID = statewideProjects[k].attributes.ProjectID;
        if(!divisionsArray.includes(projDiv)) {
          divisionsArray.push(projDiv);
          if(!allDivisions.includes(projDiv)) {
            if(possibleLineDivs.includes(projDiv) || possiblePointDivs.includes(projDiv)){
              console.log(projDiv, 'does not have intersecting points or lines with geometry filtered on');
            } else {
              allDivisions.push(projDiv);
            };
          };
        };

      };
      statewideDivisions = divisionsArray;
      // console.log('Statewide Divisions:', statewideDivisions);
      projectTally = projectTally + divisionsArray.length;
      console.log("All Divisions (after Statewide):", allDivisions);
      checkedStatewide = true;
      populateList();
    };

    function checkLayers() {
      if(checkedLines == true && checkedPoints == true && checkedMBTA == true && checkedLocFilters == true && checkedStatewide == true) {
        checkStatewideDivs([pointDivisions, lineDivisions, mbtaDivisions, locationDivisions]);
      };
    };

    function projectsByDiv(projects, tally) {
      console.log("All Projects:", projects);
      resultObject = {};
      resultObject['Division'] = {};
      for(var i=0; i<allDivisions.length; i++) {
        resultObject['Division'][allDivisions[i]] = [];
      };
      for(var i=0; i<projects.length; i++) {
        for(var j=0; j<projects[i].length; j++) {
          // console.log(projects[i][j].attributes.Division);
          var divKey = projects[i][j].attributes.Division;
          Object.keys(resultObject['Division']).forEach(function(key) {
            if (divKey == key) {
              resultObject['Division'][key].push(projects[i][j]);
            };
          });
        };
      };
      console.log(resultObject);
    };

    function getDivLength(divName) {
      var divLength;
      Object.keys(resultObject['Division']).forEach(function(key, index) {
        if(divName == key) {
          divLength = resultObject['Division'][key].length;
        };
      });
      return divLength;
    };

    function populateDivHeadings(divs) {
      console.log("All Divisions:", divs);
      if(divs.length>0){
        for(var i=0; i<divs.length; i++){
          var currentDiv = divs[i];
          var currentDivLength = getDivLength(currentDiv);
          currentDiv = currentDiv.replace(/ /g, "_");
          console.log(currentDiv, ':', currentDivLength);
          var listDivID = "div_".concat(currentDiv);
          var selectDivID= "#".concat(listDivID);
          var divHeading = divs[i].concat(" Projects (").concat(currentDivLength).concat(")");
          $("#listContent").append("<div class='listDivision' id='"+listDivID+"'><button type='button' class='btn collapsible' data-toggle='collapse'>"+divHeading+"</button><div class='projectGroup' style='display:none'></div></div>");
        };
      };
    };

    function populateList() {
      projectsByDiv(allProjects, projectTally);

      if(allDivisions.length>0){
        populateDivHeadings(allDivisions);
        var allDivHeadings = $("#listContent").children();

        for(var i=0; i<allProjects.length; i++) {
          for(var j=0; j<allProjects[i].length; j++){
            var currentProject = allProjects[i][j];
            // console.log(currentProject);
            var currentProjectDiv = currentProject.attributes.Division;
            if(!currentProject.attributes.Location_Source) {
              var currentProjectLocSrc = currentProject.sourceLayer.title.split(" ")[0].toUpperCase();
            } else {
              var currentProjectLocSrc = currentProject.attributes.Location_Source;
            };
            if(currentProjectLocSrc == 'MBTA') {
              var currentProjectMBTALoc = currentProject.attributes.MBTA_Location;
              var currentProjectLoc = currentProjectMBTALoc;
            } else {
              var currentProjectMBTALoc = '';
              var currentProjectLoc = currentProject.attributes.Location;
            };
            var currentProjectID = currentProject.attributes.ProjectID;
            var currentProjectDesc = currentProject.attributes.Project_Description;

            for(var k=0; k<allDivHeadings.length; k++) {
              var currentHeadingID = $(allDivHeadings[k]).attr('id');
              var currentHeading = (currentHeadingID.replace(/_/g, " ")).split(" ")[1];
              var currentHashID = "#".concat(currentHeadingID);
              // console.log(currentHeading);
              if(currentProjectDiv.includes(currentHeading)) {
                $(currentHashID).children('.projectGroup').append("<div class='listItem' div='"+currentProjectDiv+"' projID='"+currentProjectID+"' loc='"+currentProjectLoc+"' locSrc='"+currentProjectLocSrc+"' mbtaLoc='"+currentProjectMBTALoc+"'>"+(currentProjectDesc).toUpperCase()+" ("+currentProjectLoc+")</div>")
              };
            };
          };
        };
      } else {
        $("#listContent").append("<p class='emptyListHeading'>No projects match your search criteria.<p>");
      };

      $("#loadingScreen").css('display', 'none');
      $("#listModal").css("display", "block")
      $("#closeList-btn").css("display", "inline-block")

      $(".collapsible").click(function() {
        if($(this).attr("class").includes("active")) {
          $(this).removeClass("active")
        } else {
          $(this).addClass("active")
        }
      });

      $(".listDivision button").on("click", function() {
        if($(this).siblings('.projectGroup').css('display')=='block') {
          $(this).siblings('.projectGroup').css('display', 'none');
        } else {
          $(this).siblings('.projectGroup').css('display', 'block');
        }
      });
    };

    /* The following controls the project search bar. It defines it as an autopopulate input search. It also tells it what to search for when a user inputs some text. The second function is called when a project has been selected. */
    $("#projectSearch").autocomplete({
      source: function (request, response) {
        $.ajax({
          type: "POST",
          dataType: "json",
          url: "https://gis.massdot.state.ma.us/rh/rest/services/Projects/CIPCommentTool/MapServer/6/query",
          data: {
            where: "(Project_Description like '%" + request.term + "%' OR ProjectID like '%" + request.term + "%' OR Location like '%" + request.term + "%')" //+" AND " + sql,
            ,
            outFields: "Project_Description, ProjectID, MBTA_Location, Location_Source",
            returnGeometry: false,
            orderByFields: 'Project_Description',
            returnDistinctValues: true,
            f: 'pjson'
          },
          success: function (data) {
            const resultsArray = data.features;
            const searchSuggestions = resultsArray.map(p => {
              var rObj = {};
              rObj["id"] = p.attributes.ProjectID;
              rObj["value"] = p.attributes.Project_Description;
              rObj["mbta_loc"] = p.attributes.MBTA_Location;
              rObj["loc_source"] = p.attributes.Location_Source;
              return rObj;
            });
            response(searchSuggestions);
            $(".ui-autocomplete").css({
              'width': ($("#projectSearch").width() + 'px')
            });
          }
        });
      },
      minLength: 2,
      select: function (event, ui) {
        searchedProject = ui.item.id;
        console.log("searchedProject:", searchedProject);
      }
    });

    $("#projectSearch").autocomplete("option", "select", function (event, ui) {
      legend.expanded = false;
      allPopups = [];
      popupCount = 0;
      $("#popupIndex").html(1);
      $("#popupTotal").html(1);
      highlightGraphics.removeAll();
      clickGraphics.removeAll();
      popupSelected = new Graphic({});
      projectSearchID = ui.item.id;
      popupFromId(projectSearchID, true);
    });

    $("#listModal").on("mouseover", ".listItem", function() {
      highlightGraphics.removeAll();
      updateHoverProject($(this));
    });
    $("#listModal").on("mouseout", ".listItem", function() {
      highlightGraphics.removeAll();
    });
    //--------------------Click from List---------------------//
    $("#listModal").on("click", ".listItem", function () {
      console.log("clicked list item:", this);
      $("#projectSearch").val("");
      $(".listItemSelected").removeClass("listItemSelected");
      $(this).addClass("listItemSelected");
      allPopups = [];
      popupCount = 0;
      $("#popupIndex").html(1);
      $("#popupTotal").html(1);
      highlightGraphics.removeAll();
      clickGraphics.removeAll();
      var clickProjectID = $(this).attr('projid');
      var clickProjectLoc = $(this).attr('loc')
      var clickProjectLocSrc = $(this).attr('locsrc')
      // console.log(clickProjectID, clickProjectLoc, clickProjectLocSrc)

      if(clickProjectLocSrc.toLowerCase().includes("point") || clickProjectLocSrc.toLowerCase().includes('line') || clickProjectLocSrc.includes('MBTA') ) {
        currentProjectHighlight(symbols, hoverGeom);
        if(!clickProjectLocSrc.includes('MBTA')) {
          goToGeom(hoverGeom);
          googleStreetView(hoverGeom);
        };
      };

      popupFromId(clickProjectID);

      if(!clickProjectLocSrc.includes('POINT') && !clickProjectLocSrc.includes('LINE')) {
        var geomFromLocSrc = getGeomFromLocSrc(clickProjectLoc, clickProjectLocSrc);
        console.log("non-point/line geom:", geomFromLocSrc);
        if(geomFromLocSrc !== undefined) {
          goToGeom(geomFromLocSrc);
          googleStreetView(geomFromLocSrc);
        } else {
          $("#imageryAPI").css("display", "none");
        }
      };
    });

    function getGeomFromLocSrc(uniqueRecord, locSrc) {
      console.log("unique record:", uniqueRecord);
      console.log("locSrc:", locSrc);
      if(locSrc=="MBTA") {
        var title = "MBTA Projects"
        var layer = layerFromTitle(title);
        if(uniqueRecord == 'System' || uniqueRecord == 'Commuter Rail' || uniqueRecord == 'Ferry' || uniqueRecord == 'Rapid Transit') {
          var extent = layer.fullExtent;
          var geometry = Polygon.fromExtent(extent);
          projectSearchID = false;
        };
        return geometry;
      } else {
        if(locSrc=="LINE") {
          var title = "Line Projects"
        } else if(locSrc=="POINT") {
          var title = "Point Projects"
        };
        var layer = layerFromTitle(title);
        getGeomFromId(layer, projectSearchID);
      };
    };

    function getGeomFromId(layer, id) {
      // console.log(layer.title, id);
      layerQuery = layer.createQuery();
      layerQuery.where = "ProjectID = '"+id+"'";
      layerQuery.returnGeometry = true;
      layerQuery.outFields = ["*"];
      layer.queryFeatures(layerQuery).then(function(results) {
        projectSearchID = false;
        hoverGeom = results.features[0].geometry;
        console.log("Geometry:", hoverGeom);

        var symbols = assignSymbols(results.features[0].layer);
        currentProjectHighlight(symbols, hoverGeom);
        goToGeom(hoverGeom);
        googleStreetView(hoverGeom);
      });
    };

    function goToGeom(geometry) {
      view.goTo({
        target: geometry,
      });
      locExtent = geometry.extent;
      // console.log("locExtent:", locExtent);
    };

    function updateHoverProject(project) {
      resultFeatures = [];
      var locSrc = project.attr('locsrc');
      var projID = project.attr('projid');
      console.log("locSrc:", locSrc);
      console.log("projID:", projID);
      if(locSrc=="POINT") {
        hoverQuery(projectPoints, projID);
      } else if(locSrc=="LINE") {
        hoverQuery(projectLines, projID);
      } else if(locSrc=="MBTA") {
        var mbtaLoc = project.attr('mbtaloc');
        hoverQuery(projectMBTA, mbtaLoc);
      };
    };

    function hoverQuery(layer, id) {
      var layerQuery = layer.createQuery();
      if(layer.title.includes('MBTA')) {
        layerQuery.where = "MBTA_Location LIKE'%" + id +"%'";
        if(id.includes(",")) {
          var idArray = id.split(", ");
          for(var i=1; i<idArray.length; i++) {
            layerQuery.where = layerQuery.where + " OR MBTA_Location LIKE'%" + idArray[i] +"%'";
          };
        };
      } else {
        layerQuery.where = "ProjectID = '" + id + "'";
      };
      // console.log(layerQuery.where);

      layerQuery.returnGeometry = true;
      layerQuery.outFields = ["*"];
      console.log("id:", id);
      if(id!=="System" && id!=="Commuter Rail" && id!=="Ferry" && id!=="Rapid Transit") {
        layer.queryFeatures(layerQuery)
        .then(function(results) {
          // // console.log(results)
          hoverGeom = results.features[0].geometry;
          var symbols = assignSymbols(layer);
          hoverHighlight(symbols);
        });
      };
    };

    function assignSymbols(layer) {
      symbols = [];
      if(layer.title.includes('Line') || layer.title.includes('MBTA')) {
        var symbol = lineHighlight.symbol;
        var symbol2 = lineHighlight2.symbol;
        var symbol3 = lineHighlight3.symbol;
        var symbol4 = lineHighlight4.symbol;
        symbols = [symbol, symbol2, symbol3, symbol4];
      } else if (layer.title.includes('Point')) {
        symbols = [pointHighlight.symbol];
      };
      return symbols;
    };

    function hoverHighlight(symbols) {
      highlightGraphics.removeAll();
      highlightGraphic = new Graphic({
        geometry: hoverGeom,
        symbol: symbols[0]
      });
      for(var i=0; i<symbols.length; i++) {
        var highlightGraphic = new Graphic({
          geometry: hoverGeom,
          symbol: symbols[i]
        });
        highlightGraphics.add(highlightGraphic);
      };
    };

    function currentProjectHighlight(symbols, geom) {
      highlightGraphics.removeAll();
      highlightGraphic = new Graphic({
        geometry: geom,
        symbol: symbols[0]
      });
      for(var i=0; i<symbols.length; i++) {
        var highlightGraphic = new Graphic({
          geometry: geom,
          symbol: symbols[i]
        });
        clickGraphics.add(highlightGraphic);
      };
    };

    function clearCollections() {
      pointProjects = [];
      pointProjects_ids = [];
      lineProjects = [];
      lineProjects_ids = [];
      mbtaFeatures = [];
      mbtaProjects = [];
      locFilterProjects = [];
      statewideProjects = [];
      allProjects = [];
      projectTally = 0;
      allDivisions = [];

      checkedLines = false;
      checkedPoints = false;
      checkedMBTA = false;
      checkedLocFilters = false;
      checkedStatewide = false;

      highlightGraphics.removeAll();
      clickGraphics.removeAll();
      $("#projectModal").css("display", "none")
      $("#viewDiv").css("height", "100%")
      $("#listModal").css("display", "none")
      $("#listContent").empty()
    };

    $(".searchBtn").on("click", function() {
      console.log("clicked the search button");
      $("#projectSearch").val("");
      legend.expanded = false;
      $("#loadingScreen").css('display', 'block');
      $("#reopenList-btn").css("display", "none"); //4%
      $("#reopenPopup-btn").css("display", "none"); //4%
      $("#closePopup-btn").css("display", "none"); //4%
      clearCollections();
      updateSQL();
      console.log("locName:", locName);

      if(locName !== "All") { // && locName !== 0
        locQuery.returnGeometry = true;
        locQuery.outSpatialReference = view.spatialReference;

        locLayer.queryFeatures(locQuery).then(function(results) {
          locGeom = results.features[0].geometry;
          console.log("locGeom:", locGeom);
          // console.log(results.features[0].attributes)
          view.goTo({
            target: locGeom,
          });
          locExtent = locGeom.extent;
          polyGraphic = new Graphic({
            geometry:locGeom,
            symbol: {
              type: "simple-fill",
              color: [255, 255, 255, 0.2],
              style: "solid",
              outline: {
                color: [50, 50, 50, 0.8],
                width: "1px"
              }
            }
          });
          polyGraphics.removeAll();
          polyGraphics.add(polyGraphic);

          spatialQuery = "(Location LIKE '" + locName + "' OR Location='Statewide'" + " OR Location_Source LIKE '" + locName +  "' OR Location_Source='Statewide')";

          filterLayers();
        })
      } else {
        locName = 'All';
        locGeom = null;
        view.goTo({
          target: initialExtent,
          zoom: locZoom
        });
        locExtent = initialExtent;
        filterLayers();
      };
    });

    $(".resetBtn").on("click", function() {
      console.log("clicked the reset button");
      $("#projectSearch").val("");
      legend.expanded = false;
      $("#loadingScreen").css('display', 'block');
      $("#listModal").css("display", "none");
      $("#reopenList-btn").css("display", "none"); //4%
      $("#closeList-btn").css("display", "none"); //
      $("#projectModal").css("display", "none");
      $("#reopenPopup-btn").css("display", "none"); //4%
      $("#closePopup-btn").css("display", "none"); //4%
      clearCollections();
      $("#divisionSelect").val("All");
      $("#programSelect option").filter(function () {
        $(this).toggle(
          $(this).attr("division") == $('#divisionSelect').val() || $(this).attr("division") == "All")
      });
      $('#minCostSelect').val(0);
      $('#maxCostSelect').val(5000000000);
      $('#projSources').val("CIP");
      $('#townSelect').val(0);
      $('#mpoSelect').val("All");
      $('#rtaSelect').val("All");
      $('#districtSelect').val("All");

      sqlFilters = "1=1";
      divisionSQL = "1=1";
      programSQL = "1=1";
      costMinSQL = "Total>=0";
      costMaxSQL = "Total<=5000000000";
      projSrcSQL = "1=1";
      updateSQL();
      locName = "All";
      //
      // console.log("locName:", locName);
      // console.log("sqlFilters:", sqlFilters);

      polyGraphics.removeAll();
      view.map.layers.forEach(function(layer) {
        layer.definitionExpression = "1=1";
      });
      view.goTo({
        target: initialExtent,
        zoom: locZoom
      });
      locExtent = initialExtent;
      $("#loadingScreen").css('display', 'none');
    });

    function popupFunction(feature) {
      // console.log(feature);
      var query = new Query({
        outFields: ["*"],
        where: "ProjectID = '" + feature.attributes.ProjectID + "'"
      });
      return queryTask.execute(query).then(function (result) {
        var attributes = result.features[0].attributes
        if (attributes.Division == "Highway") {
          link = "<a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink' class='popup-link' style='color: blue'>Additional Project Information.</a>"
        } else if (attributes.Division == "MBTA") {
          link = "<a href='https://www.mbta.com/projects' target=blank id='pinfoLink' class='popup-link'>Learn more about MBTA capital projects and programs.</a>"
        } else {
          link = ""
        }
        return "<p>This project was programmed by the " + attributes.Division + "</b> division within the <b>" + attributes.Program + "</b> CIP Program. It is located in <b>" + attributes.Location + "</b> and has a total cost of <b>" + numeral(attributes.Total).format('$0,0[.]00') + "</b>.</p>"
      });
    };

    function popupFunctionMBTA(feature) {
      mbtaLineProjects = [];
      mbtaModeProjects = [];
      mbtaSystemProjects = [];

      var mbtaLine = feature.attributes.MBTA_Location;
      var mbtaMode = feature.attributes.route_desc;
      // console.log("Line:", mbtaLine, "\nMode:", mbtaMode);

      var query = new Query({
        outFields: ["*"],
        where: "(MBTA_Location like '%" + mbtaLine + "%' or MBTA_Location = '" + mbtaMode + "' or MBTA_Location = 'System')"
      })
      return queryTask.execute(query).then(function (results) {
        // console.log(results.features);
        $(results.features).each(function() {
          if(this.attributes.MBTA_Location.includes(mbtaLine)) {
            mbtaLineProjects.push(this);
          } else if (this.attributes.MBTA_Location.includes(mbtaMode)) {
            mbtaModeProjects.push(this);
          } else {
            mbtaSystemProjects.push(this);
          };
        });
        // console.log("Line projects:", mbtaLineProjects, "\nMode projects:", mbtaModeProjects, "\nSystem projects:", mbtaSystemProjects);

        if(mbtaLineProjects.length>0) {
          var lineContent = "<div><button class='btn btn-info mbtaBtn' id='mbtaLine'>View "+mbtaLine+" projects</button></div>";
        } else {
          var lineContent = "<div><p class='mbtaBtn' id='mbtaLine'>No "+mbtaLine+" projects currently match your search criteria</p></div>"
        };
        if(mbtaModeProjects.length>0) {
          var modeContent = "<div><button class='btn btn-info mbtaBtn' id='mbtaMode'>View "+mbtaMode+" projects</button></div>";
        } else if (mbtaMode == 'Silver Line'){
          var modeContent = "<div></div>"
        } else {
          var modeContent = "<div><p class='mbtaBtn' id='mbtaMode'>No "+mbtaMode+" projects currently match your search criteria</p></div>"
        };
        var systemContent = "<div><button class='btn btn-info mbtaBtn' id='mbtaSystem'>View MBTA Systemwide projects</button></div>";
        var fullContent = "<div>" + lineContent + modeContent + systemContent + "</div>";
        popupFeature.graphic.popupTemplate.title = mbtaLine;
        popupFeature.graphic.popupTemplate.content = $(fullContent)[0];
      });
    };

    view.when().then(function() {
      var graphic = {
        popupTemplate: {
          content: "Click a feature to show details..."
        }
      };
      popupFeature = new Feature({
        // container: "popupDock",
        container: "popupContainer",
        graphic: graphic,
        map: view.map,
        spatialReference: view.spatialReference,
      }) // Provide graphic to a new instance of a Feature widget

      featureLayers = {};
      view.map.layers.forEach(function (layer, index) {
        // console.log(layer.title, ":", index);
        featureLayers[layer.title] = layer;
      });
      // console.log("All feature layers on map:", featureLayers);
    }); // template graphic for popup

    view.whenLayerView(projectLines).then(function(layerView){
      layerView.watch("updating", function(value) {
        if(!value) {
          $('.searchBtn').css('background-color', '#14558f').prop("disabled", false);
          $('.resetBtn').css('background-color', '#14558f').prop("disabled", false);
        }
      });
    });

    view.on("click", function(event) {
      $("#projectSearch").val("");
      $("#backBtnRow").css("display", "none");
      $("#navigationArrows").css("display", "inline-block");
      legend.expanded = false;

      var mapLayersChecked = 0;
      mapPopups = [];
      popupCount = 0;

      var extentGeom = pointToExtent(view, event.mapPoint, 10);
      function pointToExtent(view, point, toleranceInPixel) {
        var pixelWidth = view.extent.width / view.width; //calculate map coords represented per pixel
        var toleranceInMapCoords = toleranceInPixel * pixelWidth; //calculate map coords for tolerance in pixel
        var extent = new Extent(point.x - toleranceInMapCoords, point.y - toleranceInMapCoords, point.x + toleranceInMapCoords, point.y + toleranceInMapCoords, view.spatialReference)
        return extent
      };
      var polygon = Polygon.fromExtent(extentGeom);

      for(var i=0; i<map.layers.items.length; i++) {
        var layer = map.layers.items[i];
        if(layer.title.includes('Point') || layer.title.includes('Line') || layer.title.includes('MBTA')) {
          var layerQuery = layer.createQuery();
          layerQuery.returnGeometry = true;
          layerQuery.outFields = ["*"];
          layerQuery.outSpatialReference = view.spatialReference;
          layerQuery.geometry = polygon;
          layerQuery.spatialRelationship = "intersects";

          layer.queryFeatures(layerQuery).then(function(results) {
            // console.log("Layer:", layer.title, ", Results:", results.features);
            mapLayersChecked += 1;
            mapPopups.push(results.features);

            if(mapLayersChecked == 3) {
              countMapPopups(mapPopups);
            };
          });
        };
      };
    });

    function countMapPopups(array) {
      allPopups = [];
      for(var i=0; i<array.length; i++) {
        var innerArray = array[i];
        popupCount = popupCount + innerArray.length;
        for(var j=0; j<innerArray.length; j++) {
          allPopups.push(innerArray[j])
        };
      };
      if(popupCount>0) {
        popupsShown = allPopups;
        popupIndex = 0;
        popupIndexVal = 0;
        highlightGraphics.removeAll();
        clickGraphics.removeAll();
        popupIndexVal = popupIndex + 1;
        $("#popupIndex").html(popupIndexVal)
        $("#popupTotal").html(popupCount)
        currentFeature = getCurrentPopup(popupIndex);
        replacePopupGraphic(currentFeature);
        var symbols = assignSymbols(currentFeature.layer);
        currentProjectHighlight(symbols, currentFeature.geometry);
        goToGeom(currentFeature.geometry);
        googleStreetView(currentFeature.geometry);
      };
      popupCount = popupsShown.length;
    };

    $("#rightArrow").on("click", function(){
      if(popupCount>0) {
        highlightGraphics.removeAll();
        clickGraphics.removeAll();
        popupIndexVal += 1;
        if(popupIndexVal>popupCount) {
          popupIndexVal = 1;
        };
        popupIndex = popupIndexVal - 1;
        $("#popupIndex").html(popupIndexVal);
        currentFeature = getCurrentPopup(popupIndex);
        replacePopupGraphic(currentFeature);
        var symbols = assignSymbols(currentFeature.layer);
        currentProjectHighlight(symbols, currentFeature.geometry);
        goToGeom(currentFeature.geometry);
        googleStreetView(currentFeature.geometry);
      };
    });
    $("#leftArrow").on("click", function(){
      if(popupCount>0) {
        highlightGraphics.removeAll();
        clickGraphics.removeAll();
        popupIndexVal -= 1;
        if(popupIndexVal<1) {
          popupIndexVal=popupCount;
          popupIndex = popupCount - 1;
        } else {
          popupIndex = popupIndexVal - 1;
        };
        $("#popupIndex").html(popupIndexVal);
        currentFeature = getCurrentPopup(popupIndex);
        replacePopupGraphic(currentFeature);
        var symbols = assignSymbols(currentFeature.layer);
        currentProjectHighlight(symbols, currentFeature.geometry);
        goToGeom(currentFeature.geometry);
        googleStreetView(currentFeature.geometry);
      };
    });

    function getCurrentPopup(index) {
      highlightGraphics.removeAll();
      clickGraphics.removeAll();
      // console.log("Index:", index);
      var feature = popupsShown[index];
      return feature;
    };

    function popupFromId(id, fromSearchBar=false) {
      console.log("projectID:", id);
      console.log("From searchBar @ top?", fromSearchBar);
      var clickQuery = projectList.createQuery();
      clickQuery.where = "ProjectID = '"+id+"'";
      // clickQuery.where = "ProjectID LIKE '%"+id+"%'"
      clickQuery.outFields = ["*"];
      // clickQuery.returnGeometry = true;
      projectList.queryFeatures(clickQuery).then(function(results) {
        var feature = results.features[0];
        console.log("feature:", feature);
        replacePopupGraphic(feature);

        queryProjectList(id);

        if(fromSearchBar==true) {
          var loc = feature.attributes.Location;
          var locSrc = feature.attributes.Location_Source;
          // var symbols = assignSymbols(feature.layer);
          getGeomFromLocSrc(loc, locSrc);

        }
      });
    };

    function queryProjectList(id) {
      var listQuery = projectList.createQuery();
      listQuery.where = "ProjectID = '"+id+"'";
      listQuery.outFields = ["*"];
      projectList.queryFeatures(listQuery).then(function(results){
        console.log(results.features)
        hoverLoc = results.features[0].attributes.Location;
        hoverMBTA_Loc = results.features[0].attributes.MBTA_Location;
        hoverLoc_Src = results.features[0].attributes.Location_Source;
        if(hoverLoc_Src!=="POINT" && hoverLoc_Src!=="LINE" &&  hoverLoc_Src!=="MBTA") {
          hoverGeom = stateExtent;
          goToGeom(hoverGeom);
          highlightGraphics.removeAll();
          clickGraphics.removeAll();
          $("#imageryAPI").css("display", "none");
        };
        var layer = getLayerFromSrc(id, hoverLoc, hoverMBTA_Loc, hoverLoc_Src);
        console.log("Layer:", layer);
        if (layer.title.includes('MBTA')) {
          var identifier = hoverMBTA_Loc;
        } else {
          var identifier = id;
        }
        getProjectGeom(identifier, layer);
        mbtaSymbols = assignSymbols(layer);
      });
    };

    function getProjectGeom(identifier, layer) {
      console.log(identifier, layer.title);
      var layerQuery = layer.createQuery();
      if(layer.title.includes('MBTA')) {
        layerQuery.where = "MBTA_Location LIKE '%"+identifier+"%'";
        hoverGeom = layer.fullExtent;
        goToGeom(hoverGeom);
      } else {
        layerQuery.where = "ProjectID= '"+identifier+"'";
      }
      layerQuery.outFields = ["*"];
      layerQuery.returnGeometry = true;
      layer.queryFeatures(layerQuery).then(function(results) {
        console.log(results.features[0]);
        if(results.features[0]) {
          hoverGeom = results.features[0].geometry;
          currentProjectHighlight(mbtaSymbols, hoverGeom);
          goToGeom(hoverGeom);
          googleStreetView(hoverGeom);
        } else {
          highlightGraphics.removeAll();
          clickGraphics.removeAll();
          $("#imageryAPI").css("display", "none");
        }

      })
    };

    function getLayerFromSrc(id, loc, mbta_loc, loc_src) {
      console.log("ID:", id, "Location:", loc, "\nMBTA Location:", mbta_loc, "\nLocation Source:", loc_src);
      // console.log('featureLayers:', featureLayers);
      var layers = Object.keys(featureLayers);
      // console.log('layers:', layers);
      return layers.forEach(function(layer) {
        // console.log(layer)
        if(layer.includes(loc_src)) {
          console.log(featureLayers[layer]);
          return featureLayers[layer];

        }
      });
      // var layerTitle = Object.keys(featureLayers).forEach(function(k) {
      //   console.log(k.title)
      //   return k.title.includes(loc_src);
      // })
      // return featureLayers[layerTitle];

    };

    function replacePopupGraphic(feature) {
      // console.log("Feature to replace popup:", feature);
      if(feature.attributes.ProjectID) {
        var featureID = feature.attributes.ProjectID;
        var featureDesc = feature.attributes.Project_Description;
        var currentProject_title = featureDesc + " - (" + featureID + ")";
        popupFeature.graphic.popupTemplate.title = currentProject_title;
        popupFeature.graphic.popupTemplate.content = popupFunction(feature);
      } else {
        var mbtaLoc = feature.attributes.MBTA_Location;
        popupFunctionMBTA(feature);
      };
      $("#reopenPopup-btn").css("display", "none");
      $("#closePopup-btn").css("display", "block"); //4%
      $("#projectModal").css("display", "block"); //37%
      $("#viewDiv").css("height", "59%");
    };

    //----------------MBTA Popups---------------//
    $(document).on("click", ".mbtaBtn", function(e) {
      $("#navigationArrows").css("display", "none");
      $("#backBtnRow").css("display", "inline-block");
      mbtaPopupId = $(this).attr('id');
      populateMbtaTable(mbtaPopupId);
    });

    function populateMbtaTable(id) {
      // console.log("Id:", id);
      if(id.includes("Line")) {
        var tableProjects = mbtaLineProjects;
      } else if(id.includes("Mode")) {
        var tableProjects = mbtaModeProjects;
      } else if(id.includes("System")) {
        var tableProjects = mbtaSystemProjects;
      };
      mbtaTableContent = "";
      var mbtaCount = 0;
      $(tableProjects).each(function() {
        var id = this.attributes.ProjectID;
        var desc = this.attributes.Project_Description;
        mbtaCount = mbtaCount + 1;
        mbtaTableContent = mbtaTableContent.concat("<tr><td class='mbtaCount'>"+mbtaCount+"</td><td class='mbtaDesc' id='"+id+"'>"+desc+"</td></tr>");
      })
      // console.log("mbtaCount:", mbtaCount);
      var newTable = "<div id='mbtaPopupTable'><table class='table-bordered mbtaTable'><tbody>" + mbtaTableContent + "</tbody></table></div>";
      popupFeature.graphic.popupTemplate.title = mbtaCount+" results";
      popupFeature.graphic.popupTemplate.content = $(newTable)[0];
    };

    $(document).on("click", "#backToModes", function(e) {
      replacePopupGraphic(currentFeature);
      $("#navigationArrows").css("display", "inline-block");
      $("#backBtnRow").css("display", "none");
    });

    $(document).on("click", "#mbtaPopupTable td", function(e) {
      popupFromId(this.id);
      $("#backToModes").attr("id", "backToTable");
    });

    $(document).on("click", "#backToTable", function(e) {
      populateMbtaTable(mbtaPopupId);
      $("#backToTable").attr("id", "backToModes");
    });

    $(document).on("click", "#closePopup-btn", function() {
      // console.log('close popup');
      $("#reopenPopup-btn").css("display", "block"); //4%
      $("#viewDiv").css("height", "96%")
    });

    function layerFromTitle(title){
      var layer = featureLayers[title];
      // console.log("Layer from title:", layer.title);
      return layer;
    };

    function googleStreetView(geometry) {
      // console.log("Web mercator geometry:", geometry);
      var geom = webMercatorUtils.webMercatorToGeographic(geometry);
      // console.log("Geographic Projection geometry:", geom);


      if(geom.latitude) {
        var lat = geom.latitude;
        var long = geom.longitude;
      } else if(geom.paths) {
        var lat = geom.paths[0][0][1];
        var long = geom.paths[0][0][0];
      };
      lat = +lat.toFixed(3);
      long = +long.toFixed(3);

      var mapCenter = {
        lat: lat,
        lng: long
      };
      // var mapCenter = {
      //   lat: 42.179,
      //   lng: -70.746
      // };
      // var mapCenter = {
      //   lat: 42.179,
      //   lng: -70.747
      // };
      // console.log("mapCenter:", mapCenter);

      var gMap = new google.maps.Map(document.getElementById('g_map'), {
        zoom: 14,
        center: mapCenter,
      });

      var gPanorama = new google.maps.StreetViewPanorama(document.getElementById('g_stview'), {
        position: mapCenter,
        pov: {
          heading: 34,
          pitch: 10
        },
        // fov: 20,
        visible: true
      });

      var sv = new google.maps.StreetViewService();
      sv.getPanorama({location:mapCenter, radius: 50}, processSVData);

      function processSVData(data, status) {
        // console.log("Data:", data);
        // console.log("Status:", status);

        if(status == "OK") {
          // console.log();
          $("#imageryAPI").css("display", "block");
        } else if (status == "ZERO_RESULTS") {
          $("#imageryAPI").css("display", "none");
          // console.log("no imagery available");
          // sv.getPanorama({location:mapCenter, radius: 200}, processSVData);
        } else {
          $("#imageryAPI").css("display", "none");
          // console.log("UNKNOWN ERROR");
        }
      }


      gMap.setStreetView(gPanorama)
    };


  });

});
