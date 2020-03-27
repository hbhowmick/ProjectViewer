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

    loadExtent = new Polygon({
      rings: [
        [
          [-73, 41],
          [-73, 43],
          [-70.5, 43],
          [-70.5, 41]
        ]
      ],
      spatialReference: {
        wkid: 4326
      }
    });
    stateExtent = new Polygon({
      rings: [
        [
          [-73.6, 41.2],
          [-73.6, 42.9],
          [-69.8, 42.9],
          [-69.8, 41.2]
        ]
      ],
      spatialReference: {
        wkid: 4326
      }
    });

    spatialSQL = "(1=1)";
    extentForRegionOfInterest = stateExtent.extent;
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
    // divHeadings = [];

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

    listContent = $("#projectList-content");
    projectSearchID = false;

    //-------LAYERS--------//
    polySymbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    }

    popupSelected = new Graphic({
      symbol: polySymbol
    });
    statewideSelected = new Graphic({
      symbol: polySymbol,
    });

    projectList = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6",
      outFields: ["*"],
      visible: true,
    });
    projectLocations = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1",
      outFields: ["*"],
      visible: true,
      title: "Linear Projects",
    });
    projectLocationsPoints = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/3",
      outFields: ["*"],
      visible: true,
      title: "Point Projects",
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
        definitionExpression: "Location_Type <> 'MPO'",
      }]
    }); // do i need this?
    projectLocationsPolygons = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/4",
      outFields: ["*"],
      visible: true,
      opacity: 0.3,
      title: "CIP Project Areas",
    }); //do i need this?
    projectLocationsMBTA = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter"],
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
      basemap: "streets-night-vector",
    });

    map.addMany([
      projectLocationsPolygonsMapImageLayer,
      projectLocationsMBTA,
      projectLocations, projectLocationsPoints]);
    view = new MapView({
      map: map,
      scale: 1155581.108577,
      // center: [-71.4, 42.5], // for testing, TODO: delete when using loadExtent
      // zoom: 10, // delete when using loadExtent
      extent: stateExtent.extent,
      container: "viewDiv",
      popup: {
        // autoOpenEnabled: false, // false hides popup in map
        featureNavigationEnabled: true, // allows pagination of multiple selected features
        // dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          // breakpoint: false,
          // position: "bottom-center",
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
        extentForRegionOfInterest = stateExtent.extent;
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
        extentForRegionOfInterest = stateExtent.extent;
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
        extentForRegionOfInterest = stateExtent.extent;
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
        extentForRegionOfInterest = stateExtent.extent;
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
      // $("#listModal").css("display", "none");
      // listContent.empty();
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
      view.goTo(extentForRegionOfInterest);
      view.whenLayerView(projectLocations)
      .then(nowSearchProjects)
      spatialGraphic = new Graphic({
        geometry: extentForRegionOfInterest,
        symbol: {
          type: "simple-fill",
          color: [0, 0, 0, 0.1],
          outline: {
            width: 1.5,
            color: [100, 100, 100, 0.2]
          }
        }
      });
      if (spatialGraphic.geometry !== stateExtent.extent) {
        view.graphics.add(spatialGraphic);
      }
    })

    $("#resetBtn").on("click", function() {
      console.log("RESET");
      view.popup.close();
      view.graphics.removeAll();
      extentForRegionOfInterest = stateExtent.extent;
      view.goTo(extentForRegionOfInterest);
      // view.goTo(stateExtent.extent);
      listContent.empty();
      $("#listModal").css("display", "none");

      $("#division").val("All");
      $("#townSelect").val("0");
      townName = "All";
      $("#mpoSelect").val("All");
      $("#rtaSelect").val("All");
      $("#distSelect").val("All");

      $('input[type=checkbox]').prop('checked',true);

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
            // map.remove(projectLocationsMBTA);
            // view.graphics.remove(mbtaLayerView)
            // // projectLocationsMBTA.visible = false;
            // console.log(view.graphics);
            // queryFilter = new FeatureFilter({
            //   where: "",
            //   geometry: extentForRegionOfInterest,
            //   spatialRelationship: "intersects"
            // });
            // mbtaLayerView.filter = queryFilter;
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
        listContent.empty();
        populateList(resultObject);
        $("#listModal").css("display", "block");
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
            var divHeading = resultKeys[i].concat(" Projects (").concat(resultVals[i].length).concat(")")
            listContent.append(
              $("<h4 class='divHeading'></h4>").html(divHeading)
            )
            var arrFinal = [];
            // console.log(resultVals[i])
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
              listContent.append(
                $("<option class='listItem'></option>").html(listItemDesc).attr('id', listItemID).attr('location', listItemLoc).attr('location_source', listItemLocSource)
              )
            }
          }
        }
      })
      console.log("Total Projects: ", listTally);
      if(listTally == 0) {
        listContent.append(
          $("<h4 class='divHeading'></h4>").html("There are no projects for filters selected.")
        )
      }
    }


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

    //--------------------Hover Highlight---------------------//
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

    $("#listModal").on("mouseenter", ".listItem", function (e) {
      view.graphics.removeAll();
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
        console.log(hoverLocation)
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
          var tGraphicsArray = [];
          $(response.features).each(function() {
            // console.log(this.attributes.MBTA_Location);
            var tHighlight = new Graphic();
            tHighlight.symbol = {
              type: "simple-line", // autocasts as SimpleLineSymbol()
              color: [226, 119, 40],
              width: 5
            };
            tHighlight.geometry = this.geometry;
            tGraphicsArray.push(tHighlight)
          })
          view.graphics.addMany(tGraphicsArray)
        });
      }
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
