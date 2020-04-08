$(document).ready(function () {
  require([
    "esri/views/MapView",
    "esri/Map",
    "esri/WebMap",
    "esri/layers/MapImageLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/core/watchUtils",
    "esri/widgets/Feature",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/geometry/Extent",
    "esri/geometry/Polygon",
    "esri/tasks/Locator",
    "esri/widgets/Search",
    "esri/widgets/Popup",
    "esri/widgets/Home",
    "esri/widgets/Legend",
    "esri/views/layers/support/FeatureFilter",
    "esri/Graphic",
    "esri/widgets/Sketch/SketchViewModel",
    "https://unpkg.com/mapillary-js@1.7.1/dist/mapillary-js.min.js",
    // "esri/symbols/Symbol",
  ], function (MapView, Map, WebMap, MapImageLayer, QueryTask, Query, watchUtils, Feature, FeatureLayer, GraphicsLayer, Extent, Polygon, Locator, Search, Popup, Home, Legend, FeatureFilter, Graphic, SketchViewModel, Mapillary) {

    //------GLOBAL VARIABLES------//
    filterStart = false;
    spatialFilter = false;

    sqlQuery = "";
    divisionSQL = "(1=1)";
    programSQL = "(1=1)";

    stateExtent = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/Boundaries/State/MapServer/0",
      visible: false,
      title: "State of MA",
      // spatialReference: {
      //   wkid: 3857
      // },
    });

    spatialSQL = "(1=1)";
    townName = "All";
    townSQL = "(1=1)";
    mpoName = "All";
    mpoSQL = "(1=1)";
    rtaName = "All";
    rtaSQL = "(1=1)";
    distName = "All";
    distSQL = "(1=1)";

    checkedLayers = [];
    mbtaProjectString = "";

    allProjectIDs = [];

    resultObject = {
      "Division":
      [
        {"Aeronautics":[]},
        {"Highway":[]},
        {"IT":[]},
        {"MBTA":[]},
        {"Planning":[]},
        {"Rail":[]},
        {"RMV":[]},
        {"Transit":[]},
      ],
      "Source":
      [
        {"CIP":[]},
        {"MapIT":[]},
        {"STIP":[]},
      ]
    };
    resultKeys = [];
    resultVals = [];

    projectSearchID = false;

    sourceLayerView = false;
    highlight = false;
    highlightClickL = null;
    highlightClickP = null;
    results = [];
    popupIndex = 0;
    popupIndexVal = 0;
    projectPopup = '';


    //-------LAYERS--------//
    polySymbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    }

    projectList = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6",
      outFields: ["*"],
      visible: true,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction,
        actions: [zoomTo]
      }
    });
    projectLocations = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1",
      outFields: ["*"],
      visible: true,
      title: "Linear Projects",
      minScale: 2500000,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction,
        actions: [zoomTo]
      }
    });
    projectLocationsPoints = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/3",
      outFields: ["*"],
      visible: true,
      title: "Point Projects",
      minScale: 2500000,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction,
        actions: [zoomTo]
      }
    });
    projectLocationsPolygonsMapImageLayer = new MapImageLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer",
      sublayers: [{
        id: 4,
        opacity: 0.3,
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-fill",
            color: [0,0,0,0],
            style: "solid",
            outline: {
              color: [0,0,0,0.1],
              width: 1
            }
          }
        },
        // definitionExpression: "Location_Type <> 'MPO'",
        popupEnabled: true,
        popupTemplate: {
          title: "POLYGON!!!!!!! {Location_Type} - {Location}", //TODO: remove POLYGON flag
          content: "<p id='popupFeatureSelected' class='polyList' modeType='{Location}' val='{Location}'><button class='btn btn-info'>View projects in this {Location_Type}</button><br>"
            + "<p id='popupFeatureSelectedStatewide' class='polyList' modeType='Statewide' val='{Location}'><button class='btn btn-info'>View statewide projects</button>",
          actions: [zoomTo]
        }
      }]
    }); // do i need this?
    projectLocationsPolygons = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/4",
      outFields: ["*"],
      visible: true,
      opacity: 0.3,
      title: "CIP Project Areas",
      popupEnabled: true,
      popupTemplate: {
        title: "POLYGON!!!!!!! {Location_Type} - {Location}",//TODO: remove POLYGON flag
        content: "<p id='popupFeatureSelected' class='polyList' modeType='{Location}' val='{Location}'><button class='btn btn-info'>View projects in this {Location_Type}</button><br>"
          + "<p id='popupFeatureSelectedStatewide' class='polyList' modeType='Statewide' val='{Location}'><button class='btn btn-info'>View statewide projects</button>",
        actions: [zoomTo]
      }
    }); //do i need this?
    projectLocationsMBTA = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter"],
      minScale: 2500000,
      // title: "MBTA Projects",
      popupTemplate: {
        title: "MBTA Route: {MBTA_Location}",
        content: popupFunctionMbtaAsset,
        actions: [zoomTo]
      }
    });

    function popupFunction(feature) {
      var query = new Query({
        outFields: ["*"],
        where: "ProjectID = '" + feature.graphic.attributes.ProjectID + "'"
      });
      return queryProjectTask.execute(query).then(function (result) {
        var attributes = result.features[0].attributes;
        if (attributes.Division == "Highway") {
          link = "<a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink' class='popup-link' style='color: blue'>Additional Project Information.</a>"
        } else if (attributes.Division == "MBTA") {
          link = "<a href='https://www.mbta.com/projects' target=blank id='pinfoLink' class='popup-link'>Learn more about MBTA capital projects and programs.</a>"
        } else {
          link = ""
        }

        return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "' votes='" + attributes.Votes + "'>" + link + "</br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + numeral(attributes.Total).format('$0,0[.]00') + "</p> This project was programmed by the <b>" + attributes.Division + "</b> within the <b>" + attributes.Program + "</b> CIP Program. It is located in <b>" + attributes.Location + "</b> and has a total cost of <b>" + numeral(attributes.Total).format('$0,0[.]00') + "</b>."
      });
    }
    //This function creates the content for the popups for MBTA lines
    function popupFunctionMbtaAsset(feature) {
      $(".line").remove();
      $(".mode").remove();
      $(".system").remove();

      thisFeature = feature;
      console.log(feature)
      lineProjects = [];
      modeProjects = [];
      systemProjects = [];
      if(sqlQuery){
        sqlQuery = sqlQuery;
      } else {
        sqlQuery = "(1=1)";
      }
      var query = new Query({
        outFields: ["*"],
        where: "(MBTA_Location like '%" + feature.graphic.attributes.MBTA_Location + "%' or MBTA_Location = '" + feature.graphic.attributes.route_desc + "' or MBTA_Location = 'System') AND " + sqlQuery
      });
      // console.log(query.where)
      return queryProjectTask.execute(query).then(function (result) {
        if (result.features.length > 0) {
          var table = "";
          $(result.features).each(function () {
            // thisProject = "<p><button class='btn info tProjList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
            // table = table.concat(thisProject);
            thisProject = "<p><button class='btn info tProjList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
            table = table.concat(thisProject);

            var thisProject = new Graphic({
              // geometry: view.popup.selectedFeature.geometry,
              geometry: thisFeature.graphic.geometry,
              attributes: this.attributes,
              symbol: {
                type: "simple-line",
                color: [226, 119, 40],
                width: 10
              },
              popupTemplate: {
                title: "{Project_Description}",
                content: popupFunction,
                actions: [{
                  id: "back",
                  title: "Go back",
                  className: "esri-icon-undo"
                }]
              }
            });
            if (this.attributes.MBTA_Location.includes(feature.graphic.attributes.MBTA_Location)) {
              lineProjects.push(thisProject);
            } else if (this.attributes.MBTA_Location === feature.graphic.attributes.route_desc) {
              modeProjects.push(thisProject);
            } else {
              systemProjects.push(thisProject);
            }
          });

          $(".mbtaPopup")
          .append("<p id='popupFeatureSelected' class='tProjList line' modeType='line' val='" + feature.graphic.attributes.MBTA_Location + "'></p>")
          .append("<p id='popupFeatureSelected' class='tProjList mode' modeType='mode' val='" + feature.graphic.attributes.route_desc + "'></p>")
          .append("<p id='popupFeatureSelected' class='tProjList system' modeType='system' val='System'></p>");

          if (lineProjects.length > 0) {
            $(".line").append("<button class='btn btn-info' id='mbtaLine'></button>")
            line = "View " + feature.graphic.attributes.MBTA_Location + " projects";
            $("#mbtaLine").html(line);
          } else {
            $(".line").append("<p>No " + feature.graphic.attributes.MBTA_Location + " projects currently match your search criteria</p>");
          }
          if (modeProjects.length > 0) {
            $(".mode").append("<button class='btn btn-info' id='mbtaMode'></button>")
            mode = "View " + feature.graphic.attributes.route_desc + " projects";
            $("#mbtaMode").html(mode);
          } else {
            $(".mode").append("<p>No " + feature.graphic.attributes.route_desc + " projects currently match your search criteria</p>");
          }
          if (systemProjects.length > 0) {
            $(".system").append("<button class='btn btn-info' id='mbtaSystem'></button>");
            mbta = "View MBTA Systemwide projects";
            $("#mbtaSystem").html(mbta);
          } else {
            $(".system").append("<p>No MBTA Systemwide projects currently match your search criteria</p>");
          }
          } else {
          return "<p id='popupFeatureSelected' class='tProjList' val=''>No projects currently match your search criteria</p>";
          }

      });
    }

    //This listens for the user to click a button from an MBTA system feature with the .tProjList class. It will then display all projects associated with that MBTA asset
    $(document).on("click", ".tProjList", function (e) {
      existingFeatures = view.popup.features;
      selectedIndex = view.popup.selectedFeatureIndex;
      switch ($(this).attr('modeType')) {
        case 'line':
          popupFeatures = lineProjects;
          break;
        case 'mode':
          popupFeatures = modeProjects;
          break;
        case 'system':
          popupFeatures = systemProjects;
      }
      view.popup.open({
        features: popupFeatures,
        featureMenuOpen: true,
        highlightEnabled: true
      });
    });

    queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/mapserver/6"
    });

    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0", //why not same source as mpoLayer?
    });
    mpoLayer = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/mapserver/4",
    });
    rtaLayer = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/mapserver/4",
      // url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/RTAs/MapServer/0",
    });
    distLayer = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/mapserver/4",
      // url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/HighwayDistricts/MapServer/0",
    });
    townQuery = townLayer.createQuery();
    mpoQuery = mpoLayer.createQuery();
    rtaQuery = rtaLayer.createQuery();
    distQuery = distLayer.createQuery();
    listQuery = projectList.createQuery();

    map = new Map({
      // basemap: "streets-night-vector",
      basemap: "dark-gray"
    });

    map.addMany([
      stateExtent,
      projectLocationsPolygonsMapImageLayer,
      projectLocationsMBTA,
      projectLocations, projectLocationsPoints]);

    view = new MapView({
      map: map,
      extent: stateExtent.fullExtent,
      center: [-72, 42],
      zoom: 8,
      container: "viewDiv",
      popup: {
        autoOpenEnabled: false, // false hides popup in map
        // featureNavigationEnabled: true, // allows pagination of multiple selected features
        // // dockEnabled: true,
        // dockOptions: {
        //   buttonEnabled: false,
        //   // breakpoint: false,
        //   // position: "bottom-center",
        // }
      },
      spatialReference: {
        wkid: 3857
      },
      highlightOptions: {
        color: [255,165,0], //orange
        fillOpacity: 0.4
      }
    });

    // view.when(function() {
    //   view.extent = stateExtent.fullExtent;
    //   extentForRegionOfInterest = stateExtent.fullExtent;
    //   view.goTo(extentForRegionOfInterest);
    //   // console.log(view);
    // });


    //------FUNCTIONS------//
    function updateSQL() {
      sqlQuery = divisionSQL
      + " AND " + programSQL
      + " AND " + "(Total>=" + numeral($("#minCost").val()).value()
      + " AND Total<=" + numeral($("#maxCost").val()).value()
      + ")";

      console.log("*************************\n",
      // '\nDiv: ', $("#division").val(),
      // '\nProgram(s): ', $("#programs").val(),
      // '\nMin Cost: ', $("#minCost").val(),
      // '\nMax Cost: ', $("#maxCost").val(),
      // '\nTown: ', townName,
      // '\nMPO: ', $("#mpoSelect").val(),
      // '\nRTA: ', $("#rtaSelect").val(),
      // '\nDistrict: ', $("#distSelect").val(),
      // '\n*************************\n',
      sqlQuery
      )
    };

    $("#division").change(function() {
      if ($("#division").val() !== "All") {
        divisionSQL = "Division='" + $("#division").val() + "'";
      } else {
        divisionSQL = "1=1";
      }
      divisionSQL = "(" + divisionSQL + ")"
    });

    $("#programs").change(function() {
      if ($("#programs").val()[0] == 'All' || $("#programs").val()[0] == '') {
        programSQL = "1=1";
      } else {
        $($("#programs").val()).each(function () {
          if (this == $("#programs").val()[0]) {
            programSQL = "Program='" + this + "'"
          } else {
            programSQL = programSQL + " OR Program = '" + this + "'"
          }
        });
      }
      programSQL = "(" + programSQL + ")"
    });

    $("#townSelect").change(function() {
      $("#mpoSelect").val("All");
      $("#rtaSelect").val("All");
      $("#distSelect").val("All");

      if($("#townSelect").val() == '0') {
        townName = "All";
        townSQL = "(1=1)";
        extentForRegionOfInterest = stateExtent.fullExtent;
      } else {
        townName = $("#townSelect").val()
        townQuery.where = "TOWN = '" + townName + "'";
        townQuery.returnGeometry = true;
        townQuery.outSpatialReference = view.spatialReference;
        townLayer.queryFeatures(townQuery).then(function(response) {
          townGeometry = response.features[0].geometry;
          extentForRegionOfInterest = townGeometry;
        })
        townSQL = "(Location='" + townName + "' OR Location_Source='" + townName + "' OR Location='Statewide' OR Location_Source='Statewide')"
        ;
      }

      spatialSQL = spatialSQL + " AND " + townSQL;

    })

    $("#mpoSelect").change(function() {
      $("#townSelect").val("0");
      $("#rtaSelect").val("All");
      $("#distSelect").val("All");

      if($("#mpoSelect").val() == 'All') {
        mpoName = "All";
        mpoSQL = "(1=1)";
        extentForRegionOfInterest = stateExtent.fullExtent;
      } else {
        mpoName = $("#mpoSelect").val()
        mpoQuery.where = "Location = '" + mpoName + "'";
        mpoQuery.returnGeometry = true;
        mpoQuery.outSpatialReference = view.spatialReference;
        mpoLayer.queryFeatures(mpoQuery).then(function(response) {
          mpoGeometry = response.features[0].geometry;
          extentForRegionOfInterest = mpoGeometry;
        })
        mpoSQL = "(Location='" + mpoName + "' OR Location_Source='" + mpoName + "' OR Location='Statewide' OR Location_Source='Statewide')"
        ;
      }

      spatialSQL = spatialSQL + " AND " + mpoSQL;
    })

    $("#rtaSelect").change(function() {
      $("#mpoSelect").val("All");
      $("#townSelect").val("0");
      $("#distSelect").val("All");

      if($("#rtaSelect").val() == 'All') {
        rtaName = "All";
        rtaSQL = "(1=1)";
        extentForRegionOfInterest = stateExtent.fullExtent;
      } else {
        rtaName = $("#rtaSelect").val()
        if(rtaName.includes("'")) {
          rtaQuery.where = "Location LIKE '%" + rtaName.substr(0, rtaName.indexOf("'")) + '%' + rtaName.substr(rtaName.indexOf("'")+1, rtaName.length) +  "'";
        } else {
          rtaQuery.where = "Location = '" + rtaName + "'";
        }
        console.log(rtaQuery.where);
        rtaQuery.returnGeometry = true;
        rtaQuery.outSpatialReference = view.spatialReference;
        rtaLayer.queryFeatures(rtaQuery).then(function(response) {
          rtaGeometry = response.features[0].geometry;
          extentForRegionOfInterest = rtaGeometry;
          console.log(extentForRegionOfInterest)
        })
        rtaSQL = "(Location='" + rtaName + "' OR Location_Source='" + rtaName
        + "' OR Location='Statewide' OR Location_Source='Statewide')"
        ;
      }

      spatialSQL = spatialSQL + " AND " + rtaSQL;
    })

    $("#distSelect").change(function() {
      $("#mpoSelect").val("All");
      $("#rtaSelect").val("All");
      $("#townSelect").val("0");

      if($("#distSelect").val() == 'All') {
        distName = "All";
        distSQL = "(1=1)";
        extentForRegionOfInterest = stateExtent.fullExtent;
      } else {
        distName = $("#distSelect").val()
        distQuery.where = "Location = '" + distName + "'";
        distQuery.returnGeometry = true;
        distQuery.outSpatialReference = view.spatialReference;
        distLayer.queryFeatures(distQuery).then(function(response) {
          distGeometry = response.features[0].geometry;
          extentForRegionOfInterest = distGeometry;
        })
        distSQL = "(Location='" + distName + "' OR Location_Source='" + distName + "' OR Location='Statewide' OR Location_Source='Statewide')"
        ;
      }

      spatialSQL = spatialSQL + " AND " + distSQL;
    })

    $("#searchBtn").on("click", function() {
      view.popup.close();
      view.graphics.removeAll();
      $("#projectModal").css("display", "none");
      $("#viewDiv").css("height", "95%");
      resultObject = {
        "Division":
        [
          {"Aeronautics":[]},
          {"Highway":[]},
          {"IT":[]},
          {"MBTA":[]},
          {"Planning":[]},
          {"Rail":[]},
          {"RMV":[]},
          {"Transit":[]},
        ],
        "Source":
        [
          {"CIP":[]},
          {"MapIT":[]},
          {"STIP":[]},
        ]
      };

      updateSQL();
      view.goTo(extentForRegionOfInterest)
      view.whenLayerView(projectLocations)
      .then(nowSearchProjects)
      spatialGraphic = new Graphic({
        geometry: extentForRegionOfInterest,
        symbol: {
          type: "simple-fill",
          color: [255, 255, 255, 0.2],
          outline: {
            width: 1.5,
            color: [100, 100, 100, 0.2]
          }
        }
      })
      if (spatialGraphic.geometry !== stateExtent.fullExtent) {
        view.graphics.add(spatialGraphic)
      }
    });

    $("#resetBtn").on("click", function() {
      console.log("RESET")
      view.popup.close()
      view.graphics.removeAll()
      extentForRegionOfInterest = stateExtent.fullExtent

      view.map = map
      view.whenLayerView(projectLocations)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        })
        layerView.filter = queryFilter;
      })
      view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        })
        layerView.filter = queryFilter
      })
      view.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        })
        layerView.filter = queryFilter;
      })

      view.goTo(extentForRegionOfInterest)
      $("#listContent").empty()
      $("#listModal").css("display", "none")
      $("#closeList-btn").css("display", "none")
      $("#reopenList-btn").css("display", "none")
      $("#projectModal").css("display", "none")
      $("#reopenPopup-btn").css("display", "none")
      $("#viewDiv").css("height", "95%")

      $("#division").val("All")
      $("#townSelect").val("0")
      townName = "All"
      $("#mpoSelect").val("All")
      $("#rtaSelect").val("All")
      $("#distSelect").val("All")

      $('input[type=checkbox]').prop('checked',true)

      $("#programs").val("")
      $("#programs option").filter(function () {
        $(this).toggle($(this).attr("division") == $('#division').val() || $(this).attr("division") == "All")
      });
      $("#minCost").val(numeral(0).format('0,0[.]00'));
      $("#maxCost").val(numeral(5000000000).format('0,0[.]00'))

      divisionSQL = "(1=1)"
      programSQL = "(1=1)"
      resultObject = {
        "Division":
        [
          {"Aeronautics":[]},
          {"Highway":[]},
          {"IT":[]},
          {"MBTA":[]},
          {"Planning":[]},
          {"Rail":[]},
          {"RMV":[]},
          {"Transit":[]},
        ],
        "Source":
        [
          {"CIP":[]},
          {"MapIT":[]},
          {"STIP":[]},
        ]
      }
      townSQL = "(1=1)"
      mpoSQL = "(1=1)"
      rtaSQL = "(1=1)"
      distSQL = "(1=1)"
      updateSQL()
    });

    function nowSearchProjects() {
      allProjectIDs = []
      checkedLayers = []
      view.whenLayerView(projectLocations)
      .then(function (layerView) {
        prjLocationLines = layerView
        var queryFilter = new FeatureFilter({
          where: sqlQuery,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        })
        prjLocationLines.filter = queryFilter

        linesQuery = projectLocations.createQuery()
        linesQuery.where = sqlQuery
        linesQuery.returnGeometry = true
        linesQuery.outFields = ["*"]
        linesQuery.outSpatialReference = view.spatialReference
        linesQuery.spatialRelationship = "intersects"
        linesQuery.geometry = extentForRegionOfInterest

        projectLocations.queryFeatures(linesQuery)
        .then(function(results) {
          console.log("Line Projects: ", results.features)
          createList(results.features)
          checkedLayers.push("lines")
          checkLayers()
        })
      })
      .catch(function (error) {})

      view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        prjLocationPoints = layerView
        var queryFilter = new FeatureFilter({
          where: sqlQuery,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        })
        prjLocationPoints.filter = queryFilter

        pointQuery = projectLocationsPoints.createQuery()
        pointQuery.where = sqlQuery
        pointQuery.returnGeometry = true
        pointQuery.outFields = ["*"]
        pointQuery.outSpatialReference = view.spatialReference
        pointQuery.spatialRelationship = "intersects"
        pointQuery.geometry = extentForRegionOfInterest

        projectLocationsPoints.queryFeatures(pointQuery)
        .then(function(results) {
          console.log("Point Projects: ", results.features)
          createList(results.features)
          checkedLayers.push("points")
          checkLayers()
        });
      })
      .catch(function (error) {})


        view.whenLayerView(projectLocationsMBTA)
        .then(function (layerView) {
          mbtaLayerView = layerView
          if($("#division").val() == 'MBTA' || $("#division").val() == 'All'){
            mbtaQuery = projectLocationsMBTA.createQuery()
            mbtaQuery.where = "(1=1)"
            // mbtaQuery.returnGeometry = true;
            mbtaQuery.outFields = ["*"]
            // mbtaQuery.outSpatialReference = view.spatialReference;
            mbtaQuery.spatialRelationship = "intersects"
            mbtaQuery.geometry = extentForRegionOfInterest

            projectLocationsMBTA.queryFeatures(mbtaQuery)
            .then(function(results) {
              mbtaProjectString = ""
              mbtaNames = []
              mbtaModes = []
              console.log("MBTA Lines: (", results.features.length, ") ", results.features)
              if (results.features.length == 0) {
                mbtaProjectString = "0"
                console.log("No MBTA Lines intersect location")
                createList(results.features)
                checkedLayers.push("mbta")
                checkLayers()
              } else {
                // mbtaLayerView.filter
                mbtaLayerView.visible = true

                $(results.features).each(function(index, feature) {
                  var mbtaLocation = feature.attributes.MBTA_Location
                  var route_desc = feature.attributes.route_desc
                  if (mbtaNames.includes(mbtaLocation)) {
                  } else {
                    mbtaNames.push(mbtaLocation)
                  }
                  if (mbtaModes.includes(route_desc)) {
                  } else {
                    mbtaModes.push(route_desc)
                  }
                })
                // console.log(mbtaNames, mbtaModes);
                mbtaNames.map(addToQuery)
                mbtaModes.map(addToQuery)
                function addToQuery(value) {
                  mbtaProjectString = mbtaProjectString + "MBTA_Location LIKE '%" + value + "%' OR "
                }
                mbtaProjectString = "(" + mbtaProjectString + "MBTA_Location = 'System') AND (" + sqlQuery + ")"
                // console.log(mbtaProjectString)

                listQuery.where = mbtaProjectString
                listQuery.outFields = ["*"]
                projectList.queryFeatures(listQuery).then(function(results){
                  console.log("MBTA Projects: ", results.features)
                  createList(results.features)
                  checkedLayers.push("mbta")
                  checkLayers()
                })
              }
            })
            queryFilter = new FeatureFilter({
              where: "(1=1)",
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects"
            });
            mbtaLayerView.filter = queryFilter

          } else {
            checkedLayers.push("mbta")
            checkLayers()
            mbtaLayerView.visible = false
            // map.remove(projectLocationsMBTA)
            // view.graphics.remove(mbtaLayerView)
            // // projectLocationsMBTA.visible = false
            // console.log(view.graphics)
            // queryFilter = new FeatureFilter({
            //   where: "",
            //   geometry: extentForRegionOfInterest,
            //   spatialRelationship: "intersects"
            // });
            // mbtaLayerView.filter = queryFilter
          }
        })
      .catch(function (error) {})

      listSQL = sqlQuery + " AND ((" + spatialSQL + " OR (Location='Statewide' OR Location_Source='Statewide')) AND (Location_Source<>'POINT' AND Location_Source<>'LINE' AND Location_Source<>'MBTA'))"
      listQuery.where = listSQL
      console.log(listSQL)
      projectList.queryFeatures(listQuery).then(function(results){
        console.log("Polygon Projects: ", results.features)
        createList(results.features)
        checkedLayers.push("list")
        checkLayers()
      })

      projectLocationsPolygonsMapImageLayer.when(function () {
        prjLocationPolygons = projectLocationsPolygonsMapImageLayer.findSublayerById(4)
      })
    };

    function checkLayers() {
      if(checkedLayers.length == 4) {
        console.log(checkedLayers)
        $("#listModal").css("display", "none")
        $("#listContent").empty()
        populateList(resultObject)
        $("#listModal").css("display", "block")
        $("#closeList-btn").css("display", "inline-block")
      }
    };

    function populateList(object) {
      // console.log(object);
      resultKeys = []
      resultVals = []
      var listTally = 0

      $(resultObject.Division).each(function () {
        resultKeys = Object.keys(this)
        resultVals = Object.values(this)
        // console.log(resultKeys, resultVals[0].length)
        if(resultVals[0].length > 0) {
          console.log(resultKeys, resultVals[0].length)
          listTally = listTally + resultVals[0].length
        }

        for(i=0; i<resultKeys.length; i++){
          if(resultVals[i].length>0){
            var listDivID = "div".concat(resultKeys[i])
            var selectDivID= "#".concat(listDivID)
            var divHeading = resultKeys[i].concat(" Projects (").concat(resultVals[i].length).concat(")")
            var divHeadingDataTarget = "#".concat(resultKeys[i]);
            var divHeadingID = resultKeys[i]
            $("#listContent").append($("<div class='listDivision'></div>").attr('id', listDivID))

            $(selectDivID).append(
              ($("<button type='button' class='btn collapsible' data-toggle='collapse'></button>").attr('data-target', divHeadingDataTarget).html(divHeading))
            )

            $(selectDivID).append(
              ($("<div class='collapse'></div>").attr('id', divHeadingID))
            )

            var arrFinal = []
            $(resultVals[i]).each(function() {
              var locResult = ''
              var locSource = ''
              var idResult = ''
              var arr1 = []
              if(this.Location_Source !== "MBTA") {
                locResult = this.Location
              } else {
                locResult = this.MBTA_Location
              }
              locSource = this.Location_Source
              idResult = this.Project_Description.concat("|").concat(this.ProjectID).concat("|").concat(locResult).concat("|").concat(locSource)

              arr1.push(idResult)
              arrFinal.push(arr1)
            })
            arrFinal.sort()
            // console.log(divHeading);
            // console.log(arrFinal.length);
            // console.log("sorted final array");
            for(j=0; j<arrFinal.length; j++) {
              // var test = arrFinal[j][0];
              var listItemDesc = (arrFinal[j][0].split("|")[0]).concat(" (").concat(arrFinal[j][0].split("|")[2]).concat(")")
              var listItemID = arrFinal[j][0].split("|")[1]
              var listItemLoc = arrFinal[j][0].split("|")[2]
              var listItemLocSource = arrFinal[j][0].split("|")[3]
              $(divHeadingDataTarget).append(
                $("<option class='listItem'></option>").html(listItemDesc).attr('id', listItemID).attr('location', listItemLoc).attr('location_source', listItemLocSource)
              )
            }
          }
        }
      })
      console.log("Total Projects: ", listTally)
      if(listTally == 0) {
        $("#listContent").append(
          $("<h4 class='divHeading'></h4>").html("There are no projects for filters selected.") //test with [town]
        )
      }

      $(".collapsible").click(function() {
        if($(this).attr("class").includes("active")) {
          $(this).removeClass("active")
        } else {
          $(this).addClass("active")
        }
      })

    };

    function createList(features){
      $(features).each(function () {
        // console.log(this)
        var projFeatures = {}
        if(this.geometry) {
          projFeatures["Extent"] = this.geometry
        }
        projFeatures["ProjectID"] = this.attributes.ProjectID
        projFeatures["Project_Description"] = this.attributes.Project_Description
        projFeatures["Location"] = this.attributes.Location
        projFeatures["MBTA_Location"] = this.attributes.MBTA_Location
        if(features[0].layer.title == "Linear Projects"){
          projFeatures["Location_Source"] = "LINE"
        } else if (features[0].layer.title == "Point Projects"){
          projFeatures["Location_Source"] = "POINT"
        } else if (features[0].layer.title.includes("Project List")){
          projFeatures["Location_Source"] = this.attributes.Location_Source
        }
        projFeatures["Division"]  = this.attributes.Division

        if (this.attributes.Division == "Aeronautics") {
          resultObject.Division[0].Aeronautics.push(projFeatures)
        } else if (this.attributes.Division == "Highway") {
          resultObject.Division[1].Highway.push(projFeatures)
        } else if (this.attributes.Division == "Information Technology") {
          resultObject.Division[2].IT.push(projFeatures)
        } else if (this.attributes.Division == "MBTA") {
          resultObject.Division[3].MBTA.push(projFeatures)
        } else if (this.attributes.Division.includes("Planning")) {
          resultObject.Division[4].Planning.push(projFeatures)
        } else if (this.attributes.Division == "Rail") {
          resultObject.Division[5].Rail.push(projFeatures)
        } else if (this.attributes.Division == "RMV") {
          resultObject.Division[6].RMV.push(projFeatures)
        } else if (this.attributes.Division == "Transit") {
          resultObject.Division[7].Transit.push(projFeatures)
        } else {
          // if (this.attributes.MBTA_Location) {
            //   resultObject.Division[3].MBTA.push(projFeatures);
            // } else if ($("#division").val() == "All") {
              // } else {
                // console.log("Division needs to be added to resultObject.")
                // }
        }
      })
    };

    //---------------------Hover in List--------------------//
    var pointHighlight = new Graphic();
    pointHighlight.symbol = {
      type: "simple-marker", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 8
    };

    var lineHighlight = new Graphic();
    lineHighlight.symbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 5
    };

    tGraphicsArray = [];

    var pointClick = new Graphic();
    pointClick.symbol = {
      type: "simple-marker", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 8
    };
    var lineClick = new Graphic();
    lineClick.symbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 5
    };

    $("#listModal").on("mouseover", ".listItem", function () {
      view.graphics.removeAll()
      view.graphics.add(spatialGraphic)
      var hoverItemID = this.id
      var hoverLocation = $(this).attr('location')
      // console.log(hoverItemID, hoverLocation, this)
      var hoverItemLocSource = $(this).attr('location_source')

      if (hoverItemLocSource === "POINT") {
        pointQuery.where = "ProjectID = '" + hoverItemID + "'"
        prjLocationPoints.queryFeatures(pointQuery).then(function (ids) {
          pointHighlight.geometry = ids.features[0].geometry
          view.graphics.add(pointHighlight)
        })
      } else if (hoverItemLocSource === "LINE") {
        linesQuery.where = "ProjectID = '" + hoverItemID + "'"
        prjLocationLines.queryFeatures(linesQuery).then(function (ids) {
          lineHighlight.geometry = ids.features[0].geometry
          view.graphics.add(lineHighlight)
        })
      } else if (hoverItemLocSource === "MBTA") {
        console.log(hoverLocation)
        if (hoverLocation == 'System') {
          mbtaQuery.where = "(1=1)"
        } else if (hoverLocation == 'Commuter Rail' || hoverLocation == 'Ferry' || hoverLocation == 'Rapid Transit' || hoverLocation == 'Silver') {
          mbtaQuery.where = "route_desc = '" + hoverLocation + "'"
        } else {
          if (hoverLocation.includes(",")) {
            var tLineArray = hoverLocation.split(", ")
            var tLineSQL = ""
            for(i=0; i<tLineArray.length; i++){
              if (i<tLineArray.length-1) {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%' OR "
              } else {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%'"
              }
            }
            mbtaQuery.where = tLineSQL
            console.log(mbtaQuery.where)
          } else {
            mbtaQuery.where = "MBTA_Location LIKE '%" + hoverLocation + "%'"
          }
        }
        mbtaLayerView.queryFeatures(mbtaQuery).then(function (response) {
          // console.log(response);
          tGraphicsArray = []
          $(response.features).each(function() {
            // console.log(this.attributes.MBTA_Location);
            var tHighlight = new Graphic()
            tHighlight.symbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [226, 119, 40],
              width: 5
            }
            tHighlight.geometry = this.geometry
            tGraphicsArray.push(tHighlight)
          })
          view.graphics.addMany(tGraphicsArray)
        })
      }
    });

    $("#listModal").on("mouseout", ".listItem", function () {
      if (pointHighlight) {
        view.graphics.remove(pointHighlight)
      }
      if (lineHighlight) {
        view.graphics.remove(lineHighlight)
      }
      if (tGraphicsArray) {
        view.graphics.removeMany(tGraphicsArray)
      }
    });

    //--------------------Click from List---------------------//
    $("#listModal").on("click", ".listItem", function () {
      if (pointHighlight) {
        view.graphics.remove(pointHighlight)
      }
      if (lineHighlight) {
        view.graphics.remove(lineHighlight)
      }
      if (tGraphicsArray) {
        view.graphics.remove(tGraphicsArray)
      }
      var clickItemID = this.id
      var clickLocation = $(this).attr('location')
      var clickItemLocSource = $(this).attr('location_source')
      console.log(clickItemID, clickLocation, clickItemLocSource)

      if (clickItemLocSource === "POINT"){
        pointQuery.where = "ProjectID = '" + clickItemID + "'"
        projectLocationsPoints.queryFeatures(pointQuery).then(function (ids) {
          pointClick.geometry = ids.features[0].geometry;
          view.graphics.add(pointClick)
          view.goTo(pointClick)
        })
      } else if (clickItemLocSource === "LINE") {
        linesQuery.where = "ProjectID = '" + clickItemID + "'"
        projectLocations.queryFeatures(linesQuery).then(function (ids) {
          lineClick.geometry = ids.features[0].geometry
          view.graphics.add(lineClick)
          view.goTo(lineClick)
        });
      } else if (clickItemLocSource === "MBTA") {
        console.log(clickLocation)
        if (clickLocation == 'System') {
          mbtaQuery.where = "(1=1)"
        } else if (clickLocation == 'Commuter Rail' || clickLocation == 'Ferry' || clickLocation == 'Rapid Transit' || clickLocation == 'Silver') {
          mbtaQuery.where = "route_desc = '" + clickLocation + "'"
        } else {
          if (clickLocation.includes(",")) {
            var tLineArray = clickLocation.split(", ")
            var tLineSQL = ""
            for(i=0; i<tLineArray.length; i++){
              if (i<tLineArray.length-1) {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%' OR "
              } else {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%'"
              }
            }
            mbtaQuery.where = tLineSQL
            console.log(mbtaQuery.where)
          } else {
            mbtaQuery.where = "MBTA_Location LIKE '%" + clickLocation + "%'"
          }
        }
        projectLocationsMBTA.queryFeatures(mbtaQuery).then(function (response) {
          // console.log(response);
          var tClickGraphicsArray = []
          $(response.features).each(function() {
            // console.log(this.attributes.MBTA_Location);
            var tClick = new Graphic()
            tClick.symbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [226, 119, 40],
              width: 5
            }
            tClick.geometry = this.geometry
            tClickGraphicsArray.push(tClick)
          })
          view.graphics.addMany(tClickGraphicsArray)
          view.goTo(tClickGraphicsArray)
        })
      }

      $("#closePopup-btn").css("display", "block")
      $("#viewDiv").css("height", "58%")
      $("#projectModal").css("display", "block")
    });

    view.popup.on("trigger-action", function(event) {
      if (event.action.id === 'zoomTo') {
        console.log(pointClick.geometry.latitude)
        pointClick.geometry.latitude = pointClick.geometry.latitude - 0.01
        console.log(pointClick.geometry.latitude)
        view.goTo({
          center: pointClick,
          zoom: view.zoom
        })
      }
    });

    var zoomTo = {
      title: "Zoom To",
      id: "zoomTo",
      label: "Zoom To",
      className: "esri-icon-zoom-in-magnifying-glass"
    };

    //---------------------Events on Map---------------------//

    view.when().then(function() {
      const graphic = {
        popupTemplate: {
          content: "Click a feature to show details..."
        }
      }
      let feature
      // Provide graphic to a new instance of a Feature widget
      feature = new Feature({
        container: "popupDock",
        graphic: graphic,
        map: view.map,
        spatialReference: view.spatialReference,
      })

      view.whenLayerView(projectLocations).then(function(layerView) {
        prjLocationLines = layerView
        let results = []
        var popupIndex = 0
        var popupIndexVal = 0

        view.on("pointer-move", function(event) {
          view.hitTest(event).then(getGraphics)
        })
        let highlightL, hoverProjectID
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocations
            })[0].graphic
            const attributes = graphic.attributes
            const attProjectID = attributes.ProjectID
            const attDivision = attributes.Division
            const attLocation = attributes.Location

            if (highlightL && hoverProjectID !== attProjectID) {
              highlightL.remove()
              highlightL = null
              return
            }
            if (highlightL) {
              return
            }

            const query = layerView.createQuery()
            query.where = "ProjectID = '" + attProjectID + "'"
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightL) {
                highlightL.remove()
              }
              highlightL = layerView.highlight(ids)
              hoverProjectID = attProjectID
            })
          } else {
            highlightL.remove()
            highlightL = null
          }
        }

        view.on("click", function(event) {
          if (highlightL) {
            highlightL.remove()
          }
          view.hitTest(event).then(function(event) {
            if(event.results.length>0){
              $("#reopenPopup-btn").css("display", "none")
              $("#closePopup-btn").css("display", "block")
              $("#projectModal").css("display", "block")
              $("#viewDiv").css("height", "58%")
              results = []
              popupIndex = 0
              popupIndexVal = 0
              popupIndexVal = popupIndex+1
              $("#popupIndex").html(popupIndexVal)
              results = event.results.filter(function(result) {
                return result.graphic.layer.popupTemplate
              })
              console.log(results)
              if (event.results.length > 1) {
                $("#navigationArrows").css("display", "inline-block")
                $("#popupTotal").html(event.results.length)
              } else {
                $("#navigationArrows").css("display", "none")
                // console.log(popupIndex,popupIndexVal)
              }
              replacePopupGraphic(popupIndex)
            }
          })
        })
        $("#rightArrow").on("click", function(){
          if (popupIndexVal<results.length) {
            popupIndex+=1
            popupIndexVal+=1
          } else {
            popupIndex=0
            popupIndexVal=1
          }
          // console.log(popupIndex,popupIndexVal)
          $("#popupIndex").html(popupIndexVal)
          replacePopupGraphic(popupIndex)
        })
        $("#leftArrow").on("click", function(){
          if (popupIndexVal>1) {
            popupIndex-=1
            popupIndexVal-=1
          } else {
            popupIndex=results.length-1
            popupIndexVal=results.length
          }
          // console.log(popupIndex, popupIndexVal);
          $("#popupIndex").html(popupIndexVal)
          replacePopupGraphic(popupIndex)
        })
        function replacePopupGraphic(index) {
          $("#popupDock").removeClass("mbtaPopup")
          $(".tProjList").remove()

          var result = results[index]
          console.log(result)
          projectPopup = result.graphic.geometry

          if (result.graphic.attributes.MBTA_Location) {
            $("#popupDock").addClass("mbtaPopup")
          }

          // highlight && highlight.remove();
          if (result) {
            // console.log(result.graphic.attributes.ProjectID)
            feature.graphic = result.graphic
            console.log(index, result.graphic.layer.title)
            // highlight = layerView.highlight(result.graphic)
            if (highlightClickP) {
              highlightClickP.remove()
              highlightClickP = null
            }
            highlightClickL = prjLocationLines.highlight(result.graphic)
          } else {
            console.log('else')
            feature.graphic = graphic
          }
        }

      });

      view.whenLayerView(projectLocationsPoints).then(function (layerView) {
        prjLocationPoints = layerView
        let results = []
        var popupIndex = 0
        var popupIndexVal = 0

        view.on("pointer-move", hoverEventHandler)
        function hoverEventHandler(event) {
          view.hitTest(event).then(getGraphics)
        };
        let highlightP, hoverProjectID
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocationsPoints
            })[0].graphic
            const attributes = graphic.attributes
            const attProjectID = attributes.ProjectID
            const attDivision = attributes.Division
            const attLocation = attributes.Location

            if (highlightP && hoverProjectID !== attProjectID) {
              highlightP.remove()
              highlightP = null
              return
            }
            if (highlightP) {
              return
            }

            const query = layerView.createQuery()
            query.where = "ProjectID = '" + attProjectID + "'"
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightP) {
                highlightP.remove()
              }
              highlightP = layerView.highlight(ids)
              hoverProjectID = attProjectID
            })
          } else {
            highlightP.remove()
            highlightP = null
          }
        }

        view.on("click", function(event) {
          if (highlightP) {
            highlightP.remove()
          }
          view.hitTest(event).then(function(event) {
            if(event.results.length>0){
              $("#reopenPopup-btn").css("display", "none")
              $("#closePopup-btn").css("display", "block")
              $("#projectModal").css("display", "block")
              $("#viewDiv").css("height", "58%")
              results = []
              popupIndex = 0
              popupIndexVal = 0
              popupIndexVal = popupIndex+1
              $("#popupIndex").html(popupIndexVal)
              results = event.results.filter(function(result) {
                return result.graphic.layer.popupTemplate
              })
              // console.log(results)
              if (event.results.length > 1) {
                $("#navigationArrows").css("display", "inline-block")
                $("#popupTotal").html(event.results.length)
              } else {
                $("#navigationArrows").css("display", "none")
              }
              replacePopupGraphic(popupIndex)
            }

          })
        })
        $("#rightArrow").on("click", function(){
          if (popupIndexVal<results.length) {
            popupIndex+=1
            popupIndexVal+=1
          } else {
            popupIndex=0
            popupIndexVal=1
          }
          // console.log(popupIndex,popupIndexVal)
          $("#popupIndex").html(popupIndexVal)
          replacePopupGraphic(popupIndex)
        });
        $("#leftArrow").on("click", function(){
          if (popupIndexVal>1) {
            popupIndex-=1
            popupIndexVal-=1
          } else {
            popupIndex=results.length-1
            popupIndexVal=results.length
          }
          // console.log(popupIndex, popupIndexVal)
          $("#popupIndex").html(popupIndexVal)
          replacePopupGraphic(popupIndex)
        })
        function replacePopupGraphic(index) {

          $("#popupDock").removeClass("mbtaPopup")
          $(".tProjList").remove()

          var result = results[index]
          projectPopup = result.graphic.geometry

          if (result.graphic.attributes.MBTA_Location) {
            $("#popupDock").addClass("mbtaPopup")
          }

          if (result) {
            feature.graphic = result.graphic
            // console.log(index, result.graphic.layer.title);
            if (highlightClickL) {
              highlightClickL.remove()
              highlightClickL = null
            }
            highlightClickP = prjLocationPoints.highlight(result.graphic)
          } else {
            console.log('else')
            feature.graphic = graphic
          }
        }
      });

      view.whenLayerView(projectLocationsMBTA).then(function (layerView) {
        view.on("pointer-move", hoverEventHandler)
        function hoverEventHandler(event) {
          view.hitTest(event).then(getGraphics)
        }
        let highlightT, hoverProjectID
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocationsMBTA
            })[0].graphic
            const attributes = graphic.attributes
            const attDivision = "MBTA"
            const attMBTAline = attributes.MBTA_Location
            // const attProjectID = attributes.ProjectID
            // const attLocation = attributes.Location

            if (highlightT && hoverMBTAline !== attMBTAline) {
              highlightT.remove()
              highlightT = null
              return
            }
            if (highlightT) {
              return
            }

            const query = layerView.createQuery()
            query.where = "MBTA_Location LIKE '%" + attMBTAline + "%'"
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightT) {
                highlightT.remove()
              }
              highlightT = layerView.highlight(ids)
              hoverMBTAline = attMBTAline
            })
          } else {
            highlightT.remove()
            highlightT = null
          }
        }
      });

    });









    homeBtn = new Home({
      view: view
    });
    $(document).on("click", ".esri-home", function(e){
      view.goTo(extentForRegionOfInterest)
    })
    view.ui.add([{
      component: homeBtn,
      position: "top-left",
      index: 1
    }]);




  });
});
