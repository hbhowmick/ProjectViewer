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

    spatialGraphic = new Graphic({
      symbol: {
        type: "simple-fill",
        color: [255, 255, 255, 0.2],
        outline: {
          width: 1.5,
          color: [100, 100, 100, 0.2]
        }
      }
    });

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

    currentClick = '';

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
        // actions: [zoomTo]
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
        // actions: [zoomTo]
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
        // actions: [zoomTo]
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
          // actions: [zoomTo]
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
        // actions: [zoomTo]
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
        // actions: [zoomTo]
      }
    });

    function popupFunction(feature) {
      console.log(feature)
      $(".esri-popup__main-container").append("<div class='imageryDiv'></div>")
      $(".imageryDiv").html(feature.graphic.attributes.ProjectID)

      if(feature.graphic) {
        console.log("from Map Click")
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
      } else {
        console.log("from List")
        if (feature.Division == "Highway") {
          link = "<a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + feature.ProjectID + "' target=blank id='pinfoLink' class='popup-link' style='color: blue'>Additional Project Information.</a>"
        } else if (feature.Division == "MBTA") {
          link = "<a href='https://www.mbta.com/projects' target=blank id='pinfoLink' class='popup-link'>Learn more about MBTA capital projects and programs.</a>"
        } else {
          link = ""
        }
        return "<p id='popupFeatureSelected' val='" + feature.ProjectID + "'>" + link + "</br>MassDOT Division: " + feature.Division + "</br> Location: " + feature.Location + "</br> Program: " + feature.Program + "</br> Total Cost: " + numeral(feature.Total).format('$0,0[.]00') + "</p> This project was programmed by the <b>" + feature.Division + "</b> within the <b>" + feature.Program + "</b> CIP Program. It is located in <b>" + feature.Location + "</b> and has a total cost of <b>" + numeral(feature.Total).format('$0,0[.]00') + "</b>.";
      }
    }


    // function popupFunction(feature) {
    //   console.log(feature)
    //   var query = new Query({
    //     outFields: ["*"],
    //     where: "ProjectID = '" + feature.graphic.attributes.ProjectID + "'"
    //   });
    //   return queryProjectTask.execute(query).then(function (result) {
    //     var attributes = result.features[0].attributes;
    //     if (attributes.Division == "Highway") {
    //       link = "<a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink' class='popup-link' style='color: blue'>Additional Project Information.</a>"
    //     } else if (attributes.Division == "MBTA") {
    //       link = "<a href='https://www.mbta.com/projects' target=blank id='pinfoLink' class='popup-link'>Learn more about MBTA capital projects and programs.</a>"
    //     } else {
    //       link = ""
    //     }
    //
    //     return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "' votes='" + attributes.Votes + "'>" + link + "</br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + numeral(attributes.Total).format('$0,0[.]00') + "</p> This project was programmed by the <b>" + attributes.Division + "</b> within the <b>" + attributes.Program + "</b> CIP Program. It is located in <b>" + attributes.Location + "</b> and has a total cost of <b>" + numeral(attributes.Total).format('$0,0[.]00') + "</b>."
    //   });
    // }

    //This function creates the content for the popups for MBTA lines
    function popupFunctionMbtaAsset(target) {
      thisFeatureTarget = target;
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
        where: "(MBTA_Location like '%" + target.graphic.attributes.MBTA_Location + "%' or MBTA_Location = '" + target.graphic.attributes.route_desc + "' or MBTA_Location = 'System') AND " + sqlQuery
      });
      return queryProjectTask.execute(query).then(function (result) {
        if (result.features.length > 0) {
          var table = ""
          $(result.features).each(function () {
            thisProject = "<p> <button class='btn info tProjList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
            table = table.concat(thisProject);
            var thisProject = new Graphic({
              geometry: view.popup.selectedFeature.geometry,
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
            if (this.attributes.MBTA_Location.includes(target.graphic.attributes.MBTA_Location)) {
              lineProjects.push(thisProject);
            } else if (this.attributes.MBTA_Location === target.graphic.attributes.route_desc) {
              modeProjects.push(thisProject);
            } else {
              systemProjects.push(thisProject);
            }
          });
          if (lineProjects.length > 0) {
            line = "<button class='btn btn-info'>View " + target.graphic.attributes.MBTA_Location + " projects</button>";
          } else {
            line = "No " + target.graphic.attributes.MBTA_Location + " projects currently match your search criteria";
          }
          if (modeProjects.length > 0) {
            mode = "<button class='btn btn-info'>View  " + target.graphic.attributes.route_desc + " projects</button>";
          } else {
            mode = "No " + target.graphic.attributes.route_desc + " projects currently match your search criteria";
          }
          if (systemProjects.length > 0) {
            mbta = "<button class='btn btn-info'>View MBTA Systemwide projects</button>";
          } else {
            mbta = "No MBTA Systemwide projects currently match your search criteria"
          }
          return "<p id='popupFeatureSelected' class='tProjList line' modeType='line' val='" + target.graphic.attributes.MBTA_Location + "'>" + line
            + "<p id='popupFeatureSelected' class='tProjList mode' modeType='mode' val='System'>" + mode
            + "<p id='popupFeatureSelected' class='tProjList system' modeType='system' val='System'>" + mbta;
        } else {
          return "<p id='popupFeatureSelected' class='tProjList' val=''>No projects currently match your search criteria";
        }

      });
    }



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
        collapseEnabled: false,
        collapsed: false,
        featureNavigationEnabled: true,
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false,
          position: "bottom-center",
        }
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
      view.goTo(extentForRegionOfInterest);
      view.whenLayerView(projectLocations)
      .then(nowSearchProjects)
      spatialGraphic.geometry = extentForRegionOfInterest;
      // spatialGraphic = new Graphic({
      //   geometry: extentForRegionOfInterest,
      //   symbol: {
      //     type: "simple-fill",
      //     color: [255, 255, 255, 0.2],
      //     outline: {
      //       width: 1.5,
      //       color: [100, 100, 100, 0.2]
      //     }
      //   }
      // });
      if (spatialGraphic.geometry !== stateExtent.fullExtent) {
        view.graphics.add(spatialGraphic);
      }
    })

    $("#resetBtn").on("click", function() {
      console.log("RESET");
      view.popup.close();
      view.graphics.removeAll();
      extentForRegionOfInterest = stateExtent.fullExtent;

      view.map = map;
      view.whenLayerView(projectLocations)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        });
        layerView.filter = queryFilter;
      });
      view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        });
        layerView.filter = queryFilter;
      });
      view.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        var queryFilter = new FeatureFilter({
          where: "1=1",
        });
        layerView.filter = queryFilter;
      });

      view.goTo(extentForRegionOfInterest);
      $("#listContent").empty();
      $("#listModal").css("display", "none");
      $("#closeList-btn").css("display", "none");
      $("#reopenList-btn").css("display", "none");
      $("#viewDiv").css("height", "95%");

      $("#division").val("All");
      $("#townSelect").val("0");
      townName = "All";
      $("#mpoSelect").val("All");
      $("#rtaSelect").val("All");
      $("#distSelect").val("All");

      // $('input[type=checkbox]').prop('checked',true);

      $("#programs").val("");
      $("#programs option").filter(function () {
        $(this).toggle($(this).attr("division") == $('#division').val() || $(this).attr("division") == "All");
      });
      $("#minCost").val(numeral(0).format('0,0[.]00'));
      $("#maxCost").val(numeral(5000000000).format('0,0[.]00'));

      divisionSQL = "(1=1)";
      programSQL = "(1=1)";
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
      townSQL = "(1=1)";
      mpoSQL = "(1=1)";
      rtaSQL = "(1=1)";
      distSQL = "(1=1)";
      updateSQL();
    })

    function nowSearchProjects() {
      allProjectIDs = [];
      checkedLayers = [];
      view.whenLayerView(projectLocations)
      .then(function (layerView) {
        prjLocationLines = layerView
        var queryFilter = new FeatureFilter({
          where: sqlQuery,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        });
        prjLocationLines.filter = queryFilter;

        linesQuery = projectLocations.createQuery();
        linesQuery.where = sqlQuery;
        linesQuery.returnGeometry = true;
        linesQuery.outFields = ["*"];
        linesQuery.outSpatialReference = view.spatialReference;
        linesQuery.spatialRelationship = "intersects";
        linesQuery.geometry = extentForRegionOfInterest;

        projectLocations.queryFeatures(linesQuery)
        .then(function(results) {
          console.log("Line Projects: ", results.features);
          createList(results.features);
          checkedLayers.push("lines");
          checkLayers();
        });
      })
      .catch(function (error) {});

      view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        prjLocationPoints = layerView
        var queryFilter = new FeatureFilter({
          where: sqlQuery,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        });
        prjLocationPoints.filter = queryFilter;

        pointQuery = projectLocationsPoints.createQuery();
        pointQuery.where = sqlQuery;
        pointQuery.returnGeometry = true;
        pointQuery.outFields = ["*"];
        pointQuery.outSpatialReference = view.spatialReference;
        pointQuery.spatialRelationship = "intersects";
        pointQuery.geometry = extentForRegionOfInterest;

        projectLocationsPoints.queryFeatures(pointQuery)
        .then(function(results) {
          console.log("Point Projects: ", results.features);
          createList(results.features);
          checkedLayers.push("points");
          checkLayers();
        });
      })
      .catch(function (error) {});


      view.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        mbtaLayerView = layerView
        if($("#division").val() == 'MBTA' || $("#division").val() == 'All'){
          mbtaQuery = projectLocationsMBTA.createQuery();
          mbtaQuery.where = "(1=1)";
          // mbtaQuery.returnGeometry = true;
          mbtaQuery.outFields = ["*"];
          // mbtaQuery.outSpatialReference = view.spatialReference;
          mbtaQuery.spatialRelationship = "intersects";
          mbtaQuery.geometry = extentForRegionOfInterest;

          projectLocationsMBTA.queryFeatures(mbtaQuery)
          .then(function(results) {
            mbtaProjectString = "";
            mbtaNames = [];
            mbtaModes = [];
            console.log("MBTA Lines: (", results.features.length, ") ", results.features);
            if (results.features.length == 0) {
              mbtaProjectString = "0";
              console.log("No MBTA Lines intersect location")
              createList(results.features);
              checkedLayers.push("mbta");
              checkLayers();
            } else {
              // mbtaLayerView.filter
              mbtaLayerView.visible = true;

              $(results.features).each(function(index, feature) {
                var mbtaLocation = feature.attributes.MBTA_Location;
                var route_desc = feature.attributes.route_desc;
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
              mbtaNames.map(addToQuery);
              mbtaModes.map(addToQuery);
              function addToQuery(value) {
                mbtaProjectString = mbtaProjectString + "MBTA_Location LIKE '%" + value + "%' OR ";
              }
              mbtaProjectString = "(" + mbtaProjectString + "MBTA_Location = 'System') AND (" + sqlQuery + ")";
              // console.log(mbtaProjectString);

              listQuery.where = mbtaProjectString;
              listQuery.outFields = ["*"];
              projectList.queryFeatures(listQuery).then(function(results){
                console.log("MBTA Projects: ", results.features)
                createList(results.features);
                checkedLayers.push("mbta");
                checkLayers();
              })
            }
          })
          queryFilter = new FeatureFilter({
            where: "(1=1)",
            geometry: extentForRegionOfInterest,
            spatialRelationship: "intersects"
          });
          mbtaLayerView.filter = queryFilter;
        } else {
          checkedLayers.push("mbta");
          checkLayers();
          mbtaLayerView.visible = false;
        }
      })
      .catch(function (error) {});

      listSQL = sqlQuery + " AND ((" + spatialSQL + " OR (Location='Statewide' OR Location_Source='Statewide')) AND (Location_Source<>'POINT' AND Location_Source<>'LINE' AND Location_Source<>'MBTA'))"
      listQuery.where = listSQL;
      console.log(listSQL)
      projectList.queryFeatures(listQuery).then(function(results){
        console.log("Polygon Projects: ", results.features)
        createList(results.features);
        checkedLayers.push("list");
        checkLayers();
      })

      projectLocationsPolygonsMapImageLayer.when(function () {
        prjLocationPolygons = projectLocationsPolygonsMapImageLayer.findSublayerById(4);
      })
    }

    function checkLayers() {
      if(checkedLayers.length == 4) {
        console.log(checkedLayers);
        $("#listModal").css("display", "none");
        $("#listContent").empty();
        populateList(resultObject);
        $("#listModal").css("display", "block");
        $("#closeList-btn").css("display", "inline-block");
      }
    };

    function populateList(object) {
      // console.log(object);
      resultKeys = [];
      resultVals = [];
      var listTally = 0;

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
            var listDivID = "div".concat(resultKeys[i]);
            var selectDivID= "#".concat(listDivID);
            var divHeading = resultKeys[i].concat(" Projects (").concat(resultVals[i].length).concat(")")
            var divHeadingDataTarget = "#".concat(resultKeys[i]);
            var divHeadingID = resultKeys[i];
            $("#listContent").append($("<div class='listDivision'></div>").attr('id', listDivID));

            $(selectDivID).append(
              ($("<button type='button' class='btn collapsible' data-toggle='collapse'></button>").attr('data-target', divHeadingDataTarget).html(divHeading))
            );

            $(selectDivID).append(
              ($("<div class='collapse'></div>").attr('id', divHeadingID))
            );

            var arrFinal = [];
            $(resultVals[i]).each(function() {
              var locResult = '';
              var locSource = '';
              var idResult = '';
              var arr1 = [];
              if(this.Location_Source !== "MBTA") {
                locResult = this.Location;
              } else {
                locResult = this.MBTA_Location;
              }
              locSource = this.Location_Source;
              idResult = this.Project_Description.concat("|").concat(this.ProjectID).concat("|").concat(locResult).concat("|").concat(locSource);

              arr1.push(idResult)
              arrFinal.push(arr1)
            })
            arrFinal.sort();
            // console.log(divHeading);
            // console.log(arrFinal.length);
            // console.log("sorted final array");
            for(j=0; j<arrFinal.length; j++) {
              // var test = arrFinal[j][0];
              var listItemDesc = (arrFinal[j][0].split("|")[0]).concat(" (").concat(arrFinal[j][0].split("|")[2]).concat(")");
              var listItemID = arrFinal[j][0].split("|")[1];
              var listItemLoc = arrFinal[j][0].split("|")[2];
              var listItemLocSource = arrFinal[j][0].split("|")[3];
              $(divHeadingDataTarget).append(
                $("<option class='listItem'></option>").html(listItemDesc).attr('id', listItemID).attr('location', listItemLoc).attr('location_source', listItemLocSource)
              )
            }
          }
        }
      })
      console.log("Total Projects: ", listTally);
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
        var projFeatures = {};
        if(this.geometry) {
          projFeatures["Extent"] = this.geometry;
        }
        projFeatures["ProjectID"] = this.attributes.ProjectID;
        projFeatures["Project_Description"] = this.attributes.Project_Description;
        projFeatures["Location"] = this.attributes.Location;
        projFeatures["MBTA_Location"] = this.attributes.MBTA_Location;
        if(features[0].layer.title == "Linear Projects"){
          projFeatures["Location_Source"] = "LINE"
        } else if (features[0].layer.title == "Point Projects"){
          projFeatures["Location_Source"] = "POINT"
        } else if (features[0].layer.title.includes("Project List")){
          projFeatures["Location_Source"] = this.attributes.Location_Source;
        }
        projFeatures["Division"]  = this.attributes.Division;

        if (this.attributes.Division == "Aeronautics") {
          resultObject.Division[0].Aeronautics.push(projFeatures);
        } else if (this.attributes.Division == "Highway") {
          resultObject.Division[1].Highway.push(projFeatures);
        } else if (this.attributes.Division == "Information Technology") {
          resultObject.Division[2].IT.push(projFeatures);
        } else if (this.attributes.Division == "MBTA") {
          resultObject.Division[3].MBTA.push(projFeatures);
        } else if (this.attributes.Division.includes("Planning")) {
          resultObject.Division[4].Planning.push(projFeatures);
        } else if (this.attributes.Division == "Rail") {
          resultObject.Division[5].Rail.push(projFeatures);
        } else if (this.attributes.Division == "RMV") {
          resultObject.Division[6].RMV.push(projFeatures);
        } else if (this.attributes.Division == "Transit") {
          resultObject.Division[7].Transit.push(projFeatures);
        } else {
          // if (this.attributes.MBTA_Location) {
            //   resultObject.Division[3].MBTA.push(projFeatures);
            // } else if ($("#division").val() == "All") {
              // } else {
                // console.log("Division needs to be added to resultObject.")
                // }
        }
      });
    };

    //---------------------Hover in List--------------------//
    pointHighlight = new Graphic();
    pointHighlight.symbol = {
      type: "simple-marker", // autocasts as SimpleLineSymbol()
      color: [252, 186, 3],
      width: 8
    };
    lineHighlight = new Graphic();
    lineHighlight.symbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [252, 186, 3],
      width: 5
    };
    tGraphicsArray = [];

    pointClick = new Graphic();
    pointClick.symbol = {
      type: "simple-marker", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 8
    };
    lineClick = new Graphic();
    lineClick.symbol = {
      type: "simple-line", // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 5
    };
    tClickGraphicsArray = [];


    $("#listModal").on("mouseover", ".listItem", function () {
      // console.log(currentClick);
      view.graphics.removeAll();
      if(currentClick === 'POINT'){view.graphics.add(pointClick)}
      if(currentClick === 'LINE'){view.graphics.add(lineClick)}
      if(currentClick === 'MBTA'){view.graphics.addMany(tClickGraphicsArray)}
      view.graphics.add(spatialGraphic);

      var hoverItemID = this.id;
      var hoverLocation = $(this).attr('location');
      // console.log(hoverItemID, hoverLocation, this)
      var hoverItemLocSource = $(this).attr('location_source');

      if (hoverItemLocSource === "POINT") {
        pointQuery.where = "ProjectID = '" + hoverItemID + "'";
        prjLocationPoints.queryFeatures(pointQuery).then(function (ids) {
          pointHighlight.geometry = ids.features[0].geometry;
          view.graphics.add(pointHighlight)
        });
      } else if (hoverItemLocSource === "LINE") {
        linesQuery.where = "ProjectID = '" + hoverItemID + "'";
        prjLocationLines.queryFeatures(linesQuery).then(function (ids) {
          lineHighlight.geometry = ids.features[0].geometry;
          view.graphics.add(lineHighlight)
        });
      } else if (hoverItemLocSource === "MBTA") {
        // console.log(hoverLocation)
        if (hoverLocation == 'System') {
          mbtaQuery.where = "(1=1)";
        } else if (hoverLocation == 'Commuter Rail' || hoverLocation == 'Ferry' || hoverLocation == 'Rapid Transit' || hoverLocation == 'Silver') {
          mbtaQuery.where = "route_desc = '" + hoverLocation + "'";
        } else {
          if (hoverLocation.includes(",")) {
            var tLineArray = hoverLocation.split(", ")
            var tLineSQL = "";
            for(i=0; i<tLineArray.length; i++){
              if (i<tLineArray.length-1) {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%' OR ";
              } else {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%'";
              }
            }
            mbtaQuery.where = tLineSQL;
            console.log(mbtaQuery.where);
          } else {
            mbtaQuery.where = "MBTA_Location LIKE '%" + hoverLocation + "%'";
          }
        }
        mbtaLayerView.queryFeatures(mbtaQuery).then(function (response) {
          // console.log(response);
          tGraphicsArray = [];
          $(response.features).each(function() {
            // console.log(this.attributes.MBTA_Location);
            var tHighlight = new Graphic();
            tHighlight.symbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [252, 186, 3],
              width: 5
            };
            tHighlight.geometry = this.geometry;
            tGraphicsArray.push(tHighlight)
          })
          view.graphics.addMany(tGraphicsArray)
        });
      }
    });

    $("#listModal").on("mouseout", ".listItem", function () {
      view.graphics.removeAll();
      if(currentClick === 'POINT'){view.graphics.add(pointClick)}
      if(currentClick === 'LINE'){view.graphics.add(lineClick)}
      if(currentClick === 'MBTA'){view.graphics.addMany(tClickGraphicsArray)}
      view.graphics.add(spatialGraphic);
    });

    // $("#viewDiv").on("mouseleave", function() {
    //   // console.log("left map")
    //   view.graphics.removeAll();
    //   if(currentClick === 'POINT'){view.graphics.add(pointClick)}
    //   if(currentClick === 'LINE'){view.graphics.add(lineClick)}
    //   if(currentClick === 'MBTA'){view.graphics.addMany(tClickGraphicsArray)}
    //   view.graphics.add(spatialGraphic);
    // });

    //--------------------Click from List---------------------//
    $("#listModal").on("click", ".listItem", function () {
      view.graphics.removeAll();
      view.graphics.add(spatialGraphic);
      // console.log(spatialGraphic);
      var clickItemID = this.id;
      var clickLocation = $(this).attr('location');
      var clickItemLocSource = $(this).attr('location_source');
      console.log("ID: ", clickItemID, "Loc: ", clickLocation, "LocSource: ",  clickItemLocSource);

      if (clickItemLocSource === "POINT"){
        currentClick = 'POINT';
        pointQuery.where = "ProjectID = '" + clickItemID + "'";
        projectLocationsPoints.queryFeatures(pointQuery).then(function (ids) {
          console.log(ids.features[0])
          pointClick.geometry = ids.features[0].geometry;
          view.graphics.add(pointClick)
          view.goTo(pointClick);
          var title = ids.features[0].attributes.Project_Description.concat(" - ").concat(ids.features[0].attributes.ProjectID);
          var attributes = ids.features[0].attributes;
          console.log(view.popup.collapseEnabled);
          view.popup.collapseEnabled = false;
          view.popup.open({
            title: title,
            content: popupFunction(attributes),
            // actions: [],
            // actions: [zoomTo]
          })
          view.popup.actions = [zoomTo]
        });

      } else if (clickItemLocSource === "LINE") {
        currentClick = 'LINE';
        linesQuery.where = "ProjectID = '" + clickItemID + "'";
        projectLocations.queryFeatures(linesQuery).then(function (ids) {
          lineClick.geometry = ids.features[0].geometry;
          view.graphics.add(lineClick)
          view.goTo(lineClick)
          view.popup.open({
            title: "{Project_Description} - ({ProjectID})",
            content: popupFunctionList(),
            // content: clickItemID
          })
        });

      } else if (clickItemLocSource === "MBTA") {
        currentClick = 'MBTA';
        console.log(clickLocation)
        if (clickLocation == 'System') {
          mbtaQuery.where = "(1=1)";
        } else if (clickLocation == 'Commuter Rail' || clickLocation == 'Ferry' || clickLocation == 'Rapid Transit' || clickLocation == 'Silver') {
          mbtaQuery.where = "route_desc = '" + clickLocation + "'";
        } else {
          if (clickLocation.includes(",")) {
            var tLineArray = clickLocation.split(", ")
            var tLineSQL = "";
            for(i=0; i<tLineArray.length; i++){
              if (i<tLineArray.length-1) {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%' OR ";
              } else {
                tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%'";
              }
            }
            mbtaQuery.where = tLineSQL;
            console.log(mbtaQuery.where);
          } else {
            mbtaQuery.where = "MBTA_Location LIKE '%" + clickLocation + "%'";
          }
        }
        projectLocationsMBTA.queryFeatures(mbtaQuery).then(function (response) {
          tClickGraphicsArray = [];
          // console.log(response);
          $(response.features).each(function() {
            // console.log(this.attributes.MBTA_Location);
            var tClick = new Graphic();
            tClick.symbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [226, 119, 40],
              width: 5
            };
            tClick.geometry = this.geometry;
            tClickGraphicsArray.push(tClick)
          })
          view.graphics.addMany(tClickGraphicsArray)
          view.goTo(tClickGraphicsArray)
          view.popup.open({
            // location: tClickGraphicsArray,
            // content: popupFunctionMbtaAsset,
            content: clickItemID
          })
        });
      }

      return currentClick;
    });

    view.popup.on("trigger-action", function(event) {
      if (event.action.id === 'zoomTo') {
        console.log(pointClick.geometry.latitude)
        pointClick.geometry.latitude = pointClick.geometry.latitude - 0.01;
        console.log(pointClick.geometry.latitude)
        view.goTo({
          center: pointClick,
          zoom: view.zoom
        });
      }
    })

    var zoomTo = {
      title: "Zoom To",
      id: "zoomTo",
      label: "Zoom To",
      className: "esri-icon-zoom-in-magnifying-glass"
    }
    //-------------------Highlight Hover on Map--------------------//
    view.when().then(function() {
      view.whenLayerView(projectLocations)
      .then(function (layerView) {
        view.on("pointer-move", hoverEventHandler);
        function hoverEventHandler(event) {
          view.hitTest(event).then(getGraphics);
        };
        let highlightL, hoverProjectID;
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocations;
            })[0].graphic;
            const attributes = graphic.attributes;
            const attProjectID = attributes.ProjectID;
            const attDivision = attributes.Division;
            const attLocation = attributes.Location;

            if (highlightL && hoverProjectID !== attProjectID) {
              highlightL.remove();
              highlightL = null;
              return;
            }
            if (highlightL) {
              return;
            }

            const query = layerView.createQuery();
            query.where = "ProjectID = '" + attProjectID + "'";
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightL) {
                highlightL.remove();
              }
              highlightL = layerView.highlight(ids);
              hoverProjectID = attProjectID;
            });
          } else {
            highlightL.remove();
            highlightL = null;
          };
        };
      });

      view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        view.on("pointer-move", hoverEventHandler);
        function hoverEventHandler(event) {
          view.hitTest(event).then(getGraphics);
        };
        let highlightP, hoverProjectID;
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocationsPoints;
            })[0].graphic;
            const attributes = graphic.attributes;
            const attProjectID = attributes.ProjectID;
            const attDivision = attributes.Division;
            const attLocation = attributes.Location;

            if (highlightP && hoverProjectID !== attProjectID) {
              highlightP.remove();
              highlightP = null;
              return;
            }
            if (highlightP) {
              return;
            }

            const query = layerView.createQuery();
            query.where = "ProjectID = '" + attProjectID + "'";
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightP) {
                highlightP.remove();
              }
              highlightP = layerView.highlight(ids);
              hoverProjectID = attProjectID;
            });
          } else {
            highlightP.remove();
            highlightP = null;
          };
        };
      });

      view.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        view.on("pointer-move", hoverEventHandler);
        function hoverEventHandler(event) {
          view.hitTest(event).then(getGraphics);
        };
        let highlightT, hoverProjectID;
        function getGraphics(response) {
          if (response.results.length) {
            const graphic = response.results.filter(function(result) {
              return result.graphic.layer === projectLocationsMBTA;
            })[0].graphic;
            const attributes = graphic.attributes;
            const attDivision = "MBTA";
            const attMBTAline = attributes.MBTA_Location;
            // const attProjectID = attributes.ProjectID;
            // const attLocation = attributes.Location;

            if (highlightT && hoverMBTAline !== attMBTAline) {
              highlightT.remove();
              highlightT = null;
              return;
            }
            if (highlightT) {
              return;
            }

            const query = layerView.createQuery();
            query.where = "MBTA_Location LIKE '%" + attMBTAline + "%'";
            layerView.queryObjectIds(query).then(function(ids) {
              if (highlightT) {
                highlightT.remove();
              }
              highlightT = layerView.highlight(ids);
              hoverMBTAline = attMBTAline;
            });
          } else {
            highlightT.remove();
            highlightT = null;
          };
        };
      });
    });

//________________________





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
