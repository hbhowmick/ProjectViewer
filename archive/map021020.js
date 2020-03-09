$(document).ready(function () {
  require([
    "esri/views/MapView",
    "esri/Map",
    "esri/WebMap",
    "esri/layers/MapImageLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/core/watchUtils",
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
    // "esri/symbols/Symbol",
  ], function (MapView, Map, WebMap, MapImageLayer, QueryTask, Query, watchUtils, FeatureLayer, GraphicsLayer, Extent, Polygon, Locator, Search, Popup, Home, Legend, FeatureFilter, Graphic, SketchViewModel) {

	/*
	These are global variables used throughout the rest of this page.
	Their values change depending on user actions and some of them are
	then used to validate certain functions/steps within the workflow.
	*/
    searchedProject = false;
    theCurrentProject = false;
    liked = false;
    townsSql = "Town";
    rtaSql = "RTA";
    distSql = "Highway District";
    polySql = "1=1";
    spatialFilter = false;
    sql = "1=1";
    projectSearchID = false;
    extentForRegionOfInterest = false;
    highlight = true;
    hideLoad = false;
    polySymbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    }
    filterStart = false;
    townName = "";
    mpoName = "";
    townSQL = "(1=1)";
    mpoSQL = "(1=1)";
    lastProjArr = [];
    listContent = $("#projectList-content");
    linesCounted = false;
    pointsCounted = false;
    mbtaProjectString = "";
    mbtaCounted = false;
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
      ]
    };
    resultKeys = [];
    resultVals = [];
    // let listHighlight;
    currentProjectID = null;
    clickGraphic = null;
    mbtaHighlight = null;

	/*
	These are some ArcGIS JS objects useful for doing things within the map
	*/
    popupSelected = new Graphic({
      symbol: polySymbol
    });

    statewideSelected = new Graphic({
      symbol: polySymbol,
    });

    stateExtent = new Polygon({
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


    /*
    The following are feature layers and one map image layer
    that are used in the web map and view. They represent the
    the projects and their locations
    */
    projectList = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6",
      outFields: ["*"],
      visible: true,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction
      }
    });

    projectLocations = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1",
      outFields: ["*"],
      visible: true,
      title: "Linear Projects",
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction
      }
    });

    projectLocationsPoints = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/3",
      outFields: ["*"],
      visible: true,
      title: "Point Projects",
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction
      }
    });

    projectLocationsPolygonsMapImageLayer = new MapImageLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer",
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

    projectLocationsPolygons = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/4",
      outFields: ["*"],
      visible: true,
      opacity: 0.3,
      title: "CIP Project Areas",
      popupEnabled: true,
      popupTemplate: {
        title: "{Location_Type} - {Location}",
        content: "<p id='popupFeatureSelected' class='polyList' modeType='{Location}' val='{Location}'><button class='btn btn-info'>View projects in this {Location_Type}</button><br>"
          + "<p id='popupFeatureSelectedStatewide' class='polyList' modeType='Statewide' val='{Location}'><button class='btn btn-info'>View statewide projects</button>"
      }
    });

    projectLocationsMBTA = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter", ],
      popupTemplate: {
        title: "MBTA Route: {MBTA_Location}",
        content: popupFunctionMbtaAsset
      }
    });


    queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6"
    });
    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });
    mpoLayer = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/4",
    });
    var townQuery = townLayer.createQuery();
    var mpoQuery = mpoLayer.createQuery();

    /*
    The following functions and listners are related to popups and
    buttons clicked from within popups
    */
    //This function creates the content for the popups for the projects
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

    //This listens for the user to click a button from a polygon feature with the .polyList class. It will then display all projects associated with that polygon
    $(document).on("click", ".polyList", function (e) {
      existingFeatures = view.popup.features;
      selectedIndex = view.popup.selectedFeatureIndex;
      displayPolygonProjects($(this).attr('modeType'), $(this));
    });

    //This function displays projects which are associated with a polygon. It gets called when user clicks the .polyList button
    function displayPolygonProjects(value, id) {
      polyProjects = [];
      var query = new Query({
        outFields: ["*"],
        where: "(Location_Source = '" + value + "') AND " + sql
      });
      queryProjectTask.execute(query).then(function (result) {
        if (result.features.length > 0) {
          var table = ""
          $(result.features).each(function () {
            thisProject = "<p> <button class='btn info tProjList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
            table = table.concat(thisProject);
            var thisProject = new Graphic({
              geometry: view.popup.selectedFeature.geometry,
              attributes: this.attributes,
              symbol: polySymbol,
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
            polyProjects.push(thisProject);
          });
          view.popup.open({
            features: polyProjects, // array of graphics
            featureMenuOpen: true,
            highlightEnabled: true // selected features initially display in a list
          });
        } else {
          $(id).html("No " + value + " projects currently match your search criteria.");
        }
      });

    }

    //This function creates the content for the popups for MBTA lines
    function popupFunctionMbtaAsset(target) {
      thisFeatureTarget = target;
      lineProjects = [];
      modeProjects = [];
      systemProjects = [];
      var query = new Query({
        outFields: ["*"],
        where: "(MBTA_Location like '%" + target.graphic.attributes.MBTA_Location + "%' or MBTA_Location = '" + target.graphic.attributes.route_desc + "' or MBTA_Location = 'System') AND " + sql
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


	/*
    The following are map and view related. it creates the map
	adds the layers, and defines the layerviews. The layerviews
	are used subsequently in the code for filtering. It also adds
	the out of the box widgets to the map.
    */
    map = new Map({
      basemap: "gray-vector",
    });
    map.addMany([projectLocationsPolygonsMapImageLayer, projectLocations, projectLocationsPoints, projectLocationsMBTA]);
    view = new MapView({
      map: map,
      scale: 1155581.108577,
      container: "viewDiv",
      spatialReference: {
        wkid: 3857
      },
      highlightOptions: {
        color: [255,165,0], //orange
        fillOpacity: 0.4
      }
    });
    view.goTo(stateExtent);

    view.watch("updating", function (event) {
      if (event == true) {} else if (event == false) {
        $('#loading').modal('hide') //Hide the loading wheel once all layers have finished updating
      }
    });

    $('#loading').on('shown.bs.modal', function (e) {
      if (hideLoad == true) {
        $('#loading').modal('hide')
      }
    })

    view.whenLayerView(projectLocations)
      .then(function (layerView) {
        prjLocationLines = layerView
        prjLocationLines.watch("updating", function (val) {
          if (val==false && linesCounted==false && filterStart==true) {
            hideLoad = true;
            $('#loading').modal('hide')
            prjLocationLines.queryFeatures(
              {
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects",
              returnGeometry: true,
              outFields: ["*"],
              where: sql,
              }
            )
            prjLocationLines.queryFeatures()
            .then(function(results) {
              // console.log(results)
              if (results.features.length == 0) {
                linesCounted=true;
                console.log("Lines: (0)");
                // console.log("Lines: ", linesCounted, "\nPoints: ", pointsCounted, "\nMBTA: ", mbtaCounted, "\nFilter: ", filterStart)
                openListModal()
              } else {
                console.log(results.features);
                createList(results.features);
              }
            });
          }
        });
      })
      .catch(function (error) {});

    view.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        prjLocationPoints = layerView
        prjLocationPoints.watch("updating", function (val) {
          if (val==false && pointsCounted==false && filterStart==true) {
            hideLoad = true;
            $('#loading').modal('hide')
            // prjLocationPoints.queryFeatures(
            //   {
            //   // geometry: extentForRegionOfInterest,
            //   // spatialRelationship: "intersects",
            //   // returnGeometry: true,
            //   outFields: ["*"],
            //   orderByFields: 'Project_Description',
            //   where: sql,
            //   }
            // )
            prjLocationPoints.queryFeatures()
            .then(function(results) {
              if (results.features.length == 0) {
                pointsCounted=true;
                console.log("Points: (0)");
                // console.log("Lines: ", linesCounted, "\nPoints: ", pointsCounted, "\nMBTA: ", mbtaCounted, "\nFilter: ", filterStart)
                openListModal()
              } else {
                console.log(sql);
                // console.log(results.features);
                createList(results.features);
              }
            })
          }
        })
      })
      .catch(function (error) {});

    view.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        mbtaLines = layerView
        mbtaLines.watch("updating", function (val) {
          if(val==false && mbtaCounted==false && filterStart==true) {
            hideLoad = true;
            $('#loading').modal('hide')
            projectLocationsMBTA.queryFeatures(
              {
                geometry: extentForRegionOfInterest,
                outFields: ["*"],
                where: "1=1",
                spatialRelationship: "intersects",
              }
            )
            // projectLocationsMBTA.queryFeatures()
            .then(function(results) {
              if (results.features.length == 0) {
                mbtaCounted=true;
                // mbtaLines.visible = false;
                console.log("MBTA: (0)")
                // console.log("Lines: ", linesCounted, "\nPoints: ", pointsCounted, "\nMBTA: ", mbtaCounted, "\nFilter: ", filterStart)
                openListModal()
              } else {
                mbtaLines.visible = true;
                mbtaProjectString = "";
                // console.log(results.features)
                $(results.features).each(function(index, feature) {
                  // console.log("Index: ", index, "Feature: ", feature)
                  if (index==0) {
                    mbtaProjectString = "MBTA_Location = '" + feature.attributes.MBTA_Location + "' OR MBTA_Location = 'System' ";
                  } else {
                    mbtaProjectString = mbtaProjectString + "OR MBTA_Location = '" + feature.attributes.MBTA_Location + "'";
                  }
                })
                // console.log(mbtaProjectString);
                if ($("#townSelect").val() !== "0" && $("#townSelect").val() !== "All") {
                  townSQL = "(Location = '" + townName + "' OR Location_Source = '" + townName + "')";
                } else if ($("#mpoSelect").val() !== "" && $("#mpoSelect").val() !== "All") {
                  mpoSQL = "(Location like '%" + selectedMPO + "%' and Location_Type = 'MPO')"
                }

                var spatialSQL = townSQL + " AND " + mpoSQL;
                // sql =
                // // sql + " AND " +
                // "(Location_Source = 'MBTA' AND "
                // + spatialSQL
                // + ") OR (" + mbtaProjectString + ")";
                // console.log(sql)

                projectList.queryFeatures(
                  {
                    where: mbtaProjectString,
                    outFields: ["Division", "Location", "ProjectID", "Project_Description", "MBTA_Location", "Location_Source"],
                  }
                )
                .then(function(results){
                  // console.log(results.features)
                  createList(results.features);
                })
              }
            })
          }
        })
      })
      .catch(function (error) {});

    projectLocationsPolygonsMapImageLayer.when(function () {
      prjLocationPolygons = projectLocationsPolygonsMapImageLayer.findSublayerById(4);
    })

    searchWidget = new Search({
      view: view
    });

    homeBtn = new Home({
      view: view
    });

    view.when()
    .then(function(){
      // console.log(view.extent)
      extentForRegionOfInterest = stateExtent;
    })

    $(document).on("click", ".esri-home", function(e){
      // console.log("clicked homeBtn");
      view.goTo(extentForRegionOfInterest)
    })

    legend = new Legend({
      view: view,
      layerInfos: [{
        layer: projectLocations,
        title: "Linear Projects"
      }, {
        layer: projectLocationsPoints,
        title: "Point Projects"
      }, {
        layer: projectLocationsPolygons,
        title: "Project Areas"
      }]
    });

    view.ui.add([{
      component: homeBtn,
      position: "top-left",
      index: 1
    }, {
      component: searchWidget,
      position: "top-left",
      index: 0
    // }, {
    //   component: legend,
    //   position: "bottom-left",
    //   index: 1
    }]);

    view.popup.on("trigger-action", function (event) {
      if (event.action.id === "back") {
        view.popup.open({
          features: existingFeatures,
        });
        view.popup.selectedFeatureIndex = selectedIndex;
      }
    });

	//This listens for anytime a new feature is selected and displayed in the popup, or someone clicks the map and there is no feature there
    watchUtils.watch(view.popup, "selectedFeature", function (feature) {
      $('#helpContents').show();
      $('#interactive').hide();
      if (feature) {
        theCurrentProject = feature.attributes;
        console.log(highlight)
        if (highlight && feature.attributes.HighlightRemove !== "false") {
          // highlight.remove();
          highlight = false;
        }
        $("#projectSearch").val("");
        if (feature.attributes.ProjectID) {
          projId = feature.attributes.ProjectID;
        }
        if (feature.attributes.Location_Type == "Town" || feature.attributes.Location_Type == "RTA" || feature.attributes.Location_Type == "Highway District" || feature.attributes.Location_Type == "Statewide") {
          popupSelected.geometry = feature.geometry;
          view.graphics.add(popupSelected);
        } else {
          popupSelected.geometry = null;
          view.graphics.remove(popupSelected);
        }
      } else if (highlight) {
        // highlight.remove();
        highlight = false;
        popupSelected.geometry = null;
        view.graphics.remove(popupSelected);
      } else {
        popupSelected.geometry = null;
        view.graphics.remove(popupSelected);
      }
    });

	/*
    The following controls are used to filter projects within the map, based
	on the user actions in the left hand side of the webpage.
    */
    // $("#townSelect").click(function(){
    //   $("#mpoSelect").val("All");
    //   console.log("\n\nTOWN CLICK... MPO value: ", $("#mpoSelect").val())
    // })
    //
    // $("#mpoSelect").click(function(){
    //   $("#townSelect").val(0);
    //   console.log("\n\nMPO CLICK... town value: ", $("#townSelect").val())
    // })

    $(".filter").change(function(e){
      view.graphics.removeAll();
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
        ]
      };
      filterStart = true;
      console.log("*************************");
      linesCounted = false;
      pointsCounted = false;
      mbtaCounted = false;
      // console.log(e.target.id)
      if(e.target.id === "townSelect") {
        $("#mpoSelect").val("All");
      } else if (e.target.id === "mpoSelect") {
        $("#townSelect").val(0);
      }
      listModal.style.display = "none";
      projectModal.style.display = "none";

      lastProjArr = [];
      listContent.empty();
      mbtaProjectString = "";
      console.log("Division: ", $("#division").val())
      console.log("Town: ", $("#townSelect").val())
      console.log("MPO: ", $("#mpoSelect").val())
      console.log("\n")

      if (e.target.id === "townPrjs") {
        console.log("Do Not Apply feature view filter") //The reason for only checking the town checkbox and not RTA/Distrct, is that only towns show up in the map. RTA/District projects get displayed via the town popup.
      } else if ($("#townSelect").val() == "0" || $("#mpoSelect").val() == "All") {
        // console.log("town and/or mpo was changed to all");
      } else {
        console.log("filter changed: else scenario")
        $('#loading').modal('show')
        applyFeatureViewFilters();
      }
      console.log(resultObject)
    });
























    $.when(
      $(".listModal").on("mouseenter", ".listItem", function(e){
      var listProjectID = this.id;
      // console.log(listProjectID);
      // listHighlight = null;
      return listProjectID;



      //
      // // console.log(listHighlight)
      // if (currentProjectID) {
      //   console.log("Previous highlight")
      //   listHighlight.remove();
      //   currentProjectID = null;
      //
      // // if (listHighlight && currentProjectID !== listProjectID) {
      // //   console.log("Previous highlight & new hover...")
      // //   listHighlight.remove();
      // //   listHighlight = null;
      // // } else if (listHighlight) {
      // //   console.log("Previous highlight (same hover?)...")
      // //   listHighlight.remove();
      // //   listHighlight = null;
      // }
      //
      // var hoverQuery = projectList.createQuery();
      // hoverQuery.where =  "ProjectID = '" + listProjectID.split("|")[0] + "'";
      // // console.log(hoverQuery)
      //
      // projectList.queryFeatures(hoverQuery).then(function(response) {
      //   return response
      // }).then(function(response){
      //   let layerView;
      //   var hoverLocSource = response.features[0].attributes.Location_Source;
      //   // console.log("Location_Source: ", hoverLocSource)
      //   var hoverMBTA_Loc = response.features[0].attributes.MBTA_Location;
      //   // console.log("MBTA_Location: ", hoverMBTA_Loc)
      //   if (hoverLocSource == "LINE") {
      //     layerView = prjLocationLines;
      //   } else if (hoverLocSource == "POINT") {
      //     layerView = prjLocationPoints;
      //       // hoverLocSource will be MBTA for MBTA...don't need System from MBTA_Location
      //   } else if (hoverMBTA_Loc !== null) {
      //     layerView = mbtaLines;
      //   }
      //   // console.log("LayerView: ", layerView.layer.title)
      //
      //   var layerViewQuery = layerView.createQuery();
      //   if(layerView !== mbtaLines){
      //     layerViewQuery.where = "ProjectID = '" + listProjectID.split("|")[0] + "'";
      //     // console.log(listProjectID);
      //   } else {
      //     if(hoverMBTA_Loc !== "System") {
      //       layerViewQuery.where = "MBTA_Location = '" + hoverMBTA_Loc + "'";
      //     } else {
      //       layerViewQuery.where = "(1=1)"
      //     }
      //   }
      //   console.log(layerViewQuery)
      //   layerView.queryObjectIds(layerViewQuery).then(function(ids) {
      //     // console.log(ids)
      //     listHighlight = layerView.highlight(ids);
      //     // console.log(listHighlight)
      //     currentProjectID = listProjectID.split("|")[0];
      //     // console.log(currentProjectID)
      //   });
      // })




    }))
    .then(function(id){
      console.log("ID: ", id)
    })

    //
    // $(".listModal").on("mouseleave", ".listItem", function(e){
    //   if (currentProjectID) {
    //     listHighlight.remove();
    //     // listHighlight = null;
    //     currentProjectID = null;
    //     console.log("remove highlight")
    //   }
    // })




    // $(".listModal").on("mouseenter", ".listItem", function(e){
    //   var listProjectID = this.id;
    //
    //   const highlightLayer = new GraphicsLayer();
    //
    //   map.add(highlightLayer);
    //
    //   view.when(function() {
    //
    //   })
    //
    //   var sketchVM = new SketchViewModel({
    //     layer: highlightLayer,
    //     view: view,
    //     polylineSymbol: {
    //       type: "simple-line",  // autocasts as new SimpleMarkerSymbol()
    //       color: "#8A2BE2",
    //       width: "4",
    //       style: "dash"
    //     },
    //   });
    //
    //   sketchVM.on("create", function(event) {
    //     console.log(event.state)
    //     if(event.state === "complete") {
    //       polygonGraphicsLayer.remove(event.graphic);
    //       selectFeatures(event.graphic.geometry);
    //     }
    //   })
    //
    // })



















































    $("#townSelect").change(function () {
      // view.graphics.removeAll();
      // console.log("CHANGED TOWN")
      // $("#mpoSelect").val("All");
      // $("#mpoSelect").val("");
      $("#programs").val("All");
      if ($("#townSelect").val() > 0) {
        $('#loading').modal('show')
        hideLoad = false;
        townQuery.where = "TOWN_ID = " + $("#townSelect").val();
        townQuery.returnGeometry = true;
        townQuery.outFields = ["TOWN_ID", "TOWN"];
        townQuery.outSpatialReference = view.spatialReference;
        townLayer.geometryPrecision = 0;
        townLayer.queryFeatures(townQuery)
          .then(function (response) {
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            // console.log("sql", sql),
            queryFilter = new FeatureFilter({
              where: sql,
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects"
            });
            prjLocationLines.filter = queryFilter
            prjLocationPoints.filter = queryFilter
            view.goTo(extentForRegionOfInterest);
            townGraphic = new Graphic({
              geometry: extentForRegionOfInterest,
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: {
                  width: 1.5,
                  color: [100, 100, 100, 0.2]
                },
                // style: "none"
              }
            });
            view.graphics.add(townGraphic);
            // console.log(response.features[0]);
            townName = response.features[0].attributes.TOWN;
            // console.log("Town selected: ", townName);
            // return response.features[0];
          })
          // applyFeatureViewFilters();
      } else {
        // console.log("hit here too & shouldn't")
        spatialFilter = false;
        applyFeatureViewFilters();
        view.goTo(statewidePolygon);
      }
    })


    $("#mpoSelect").change(function () {
      // view.graphics.removeAll();
      // console.log("CHANGED MPO")
      // $("#townSelect").val(0);
      // $("#townSelect").val("");
      $("#programs").val("All");
      var selectedMPO = $(this).children("option:selected").val();
      if (selectedMPO != "All") {
        $('#loading').modal('show')
        hideLoad = false;
        mpoQuery.where = "Location = '" + selectedMPO + "'";
        mpoQuery.returnGeometry = true;
        mpoQuery.outFields = ["Location"];
        mpoQuery.outSpatialReference = view.spatialReference;
        mpoQuery.returnExtentOnly = true;
        mpoQuery.geometryPrecision = 0;
        mpoLayer.queryFeatures(mpoQuery)
          .then(function (response) {
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            queryFilter = new FeatureFilter({
              where: sql,
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects"
            });
            prjLocationLines.filter = queryFilter
            prjLocationPoints.filter = queryFilter
            view.goTo(extentForRegionOfInterest);
            mpoGraphic = new Graphic({
              geometry: extentForRegionOfInterest,
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0.1],
                outline: {
                  width: 1.5,
                  color: [100, 100, 100, 0.2]
                },
                // style: "none"
              }
            });
            view.graphics.add(mpoGraphic);

          });
          // applyFeatureViewFilters();
      } else {
        // console.log("hit here too & shouldn't")
        spatialFilter = false;
        applyFeatureViewFilters();
        view.goTo(statewidePolygon);
      }
    });

	//The following is the cost slider. It is used to configure the input and do something when the value is changed
    $("#cost-range").slider({
      range: true,
      min: 0,
      max: 5000000000,
      values: [0, 5000000000],
      slide: function (event, ui) {
        $("#minCost").val(numeral(ui.values[0]).format('0,0[.]00'));
        $("#maxCost").val(numeral(ui.values[1]).format('0,0[.]00'));
        applyFeatureViewFilters();
      }
    });

    $(".costInput").change(function () {
      minValue = numeral($("#minCost").val()).value();
      maxValue = numeral($("#maxCost").val()).value();
      if (minValue > maxValue) {
        maxValue = minValue
      };
      $("#minCost").val(numeral(minValue).format('0,0[.]00'));
      $("#maxCost").val(numeral(maxValue).format('0,0[.]00'));
      $("#cost-range").slider("values", [minValue, maxValue]);
      applyFeatureViewFilters();
    });


  	//----------update map layers-----------//
    function applyFeatureViewFilters() {
      console.log("called applyFeatureViewFilters()");
	  //Remove any existing graphics, close any existing popups, and reset the SQL statement
      view.popup.close();
      view.graphics.removeAll();
      // console.log("Town selected: ", $("#townSelect").val());
      // console.log("MPO selected: ", $("#mpoSelect").val());

      sql = "1=1"
      divisionsSQL = "(1=1)";
      programsSQL = "(1=1)";
      if ($("#division").val() !== "All") {
		//Get the selected division
        divisionsSQL = "Division = '" + $("#division").val() + "'";
      }
      if ($("#programs").val()[0] !== 'All') {
        $($("#programs").val()).each(function () {
			//Get the selected programs
          if (this == $("#programs").val()[0]) {
            programsSQL = "Program = '" + this + "'"
          } else {
            programsSQL = programsSQL + " OR Program = '" + this + "'"
          }
        });
      }
		//Create the SQL statement for the projects
      sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( Total  >= " + parseFloat($("#minCost").val().replace(/,/g, '')) + " AND Total <= " + parseFloat($("#maxCost").val().replace(/,/g, '')) + ")"
	  //Make sure the correct polygons are showing, based on the controls. It uses the polySql statement which gets towns/mpos/districts if needed
	   prjLocationPolygons.definitionExpression = polySql;
	  //Show/hide MBTA lines and other polygons, based on division selections.
      if ($("#division").val() == "All") {
		//Can show MBTA lines and polygons, since All divisions are selected
        mbtaLines.visible = true;
        prjLocationPolygons.visible = true;
      } else if ($("#division").val() == "MBTA") {
		//Only show the MBTA lines, because only MBTA division is selected
        mbtaLines.visible = true;
        prjLocationPolygons.visible = false;
      } else if ($("#division").val() == "Transit") {
		//Hide MBTA lines, and only show RTA polygons, because only Transit is selected
        mbtaLines.visible = true;
        prjLocationPolygons.visible = true;
        prjLocationPolygons.definitionExpression = "Location_Type = 'RTA'";
      } else {
		//Can hide MBTA lines, because MBTA division is not selected
        mbtaLines.visible = false;
        prjLocationPolygons.visible = true;
      }
      // console.log("Division selected: ", $("#division").val());
      if (spatialFilter === true && projectSearchID == false) {
		//If a spatial filter is required and no project has been selected via the project search bar
        hideLoad = false;
        queryFilter = new FeatureFilter({
          where: sql,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        });
      } else if (projectSearchID !== false) {
		//If a project has been selected via the project search bar
        queryFilter = new FeatureFilter({
          where: "ProjectID = '" + projectSearchID + "'",
        });
      } else {
        queryFilter = new FeatureFilter({
          where: sql,
        });
      }

      // console.log("Line Projects filter from applyFeatureViewFilters function: ", queryFilter)
      prjLocationLines.filter = queryFilter
      prjLocationPoints.filter = queryFilter
    }; // end applyFeatureViewFilters function


    //----------populate List Modal-----------//
    function createList(features){
      // console.log(sql);
      // console.log(filterStart)
      if (filterStart==true) {
        // console.log(features[0].layer.title, "(", features.length, ")"
        //   // , features
        // );
        // currentProject = [];
        $(features).each(function () {
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
          // currentProject.push(projFeatures);
          // console.log("feature: ", projFeatures)


          if (this.attributes.Division == "Aeronautics") {
            resultObject.Division[0].Aeronautics.push(projFeatures);
          } else if (this.attributes.Division == "Highway") {
            resultObject.Division[1].Highway.push(projFeatures);
          } else if (this.attributes.Division == "Information Technology") {
            resultObject.Division[2].IT.push(projFeatures);
          } else if (this.attributes.Division == "MBTA") {
            resultObject.Division[3].MBTA.push(projFeatures);
          } else if (this.attributes.Division == "Planning") {
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
            console.log("Division needs to be added to resultObject.")
            // }
          }

        });

        if(features[0].layer.title == 'Linear Projects'){
          linesCounted=true;
          // console.log('lines: ', currentProject);
        } else if (features[0].layer.title == 'Point Projects'){
          pointsCounted=true;
          // console.log('points: ', currentProject);
        } else if (features[0].layer.title.includes('Project List')){
          mbtaCounted=true;
          // console.log('mbta:', currentProject);
        }
        openListModal();
      }
    }; // end createList function


    function openListModal() {
      // console.log(resultObject)
      // console.log("Lines: ", linesCounted, "\nPoints: ", pointsCounted, "\nMBTA: ", mbtaCounted, "\nFilter: ", filterStart)
      if (linesCounted==true && pointsCounted==true && mbtaCounted==true && filterStart==true) {
        resultKeys = [];
        resultVals = [];
        $(resultObject.Division).each(function () {
          resultKeys = Object.keys(this)
          resultVals = Object.values(this)
          for(i=0; i<resultKeys.length; i++){
            if(resultVals[i].length>0){
              var divHeading = resultKeys[i].concat(" Projects (").concat(resultVals[i].length).concat(")")
              listContent.append(
                $("<h4 class='divHeading'></h4>").html(divHeading)
              )
              var arrFinal = [];
              // console.log(resultVals[i]) //show resultObject values
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
                // console.log(arr1);
                arrFinal.push(arr1)
              })
                arrFinal.sort();
                // console.log(arrFinal);
                // console.log(arrFinal[0][0]);

                for(j=0; j<arrFinal.length; j++) {
                  var itemDesc = (arrFinal[j][0].split("|")[0]).concat(" (").concat(arrFinal[j][0].split("|")[2]).concat(")");
                  var itemID =  arrFinal[j][0].split("|")[1].concat("|").concat(arrFinal[j][0].split("|")[3]);
                  listContent.append(
                    $("<option class='listItem'></option>").html(itemDesc).attr('id', itemID));
                }

            }
          }
        })

        // document.getElementById("countProj").innerHTML = projDescArr.length;
        listModal.style.display = "block";
        filterStart = false;
      }
    } // end openListModal function








      //----------------------------Project Specific----------------------------//

      // //----------Hover-----------//


      // view.when().then(function() {
      //   return projectLocationsLines.when();
      // })
      // .then(function(layer) {
      //   return view.whenLayerView(layer);
      // })
      // .then(function(layerView) {
      //   view.on("pointer-move", eventHandler);
      //
      //   function eventHandler(event) {
      //     view.hitTest(event).then(getGraphics);
      //   };
      //
      //   let highlight, hoverProjectID;
      //
      //   function getGraphics(response) {
      //     if (response.results.length) {
      //       const graphic = response.results.filter(function(result) {
      //         return result.graphic.layer === projectLocationsLines;
      //       })[0].graphic;
      //       console.log(graphic)
      //
      //       const attributes = graphic.attributes;
      //       const attProjectID = attributes.ProjectID;
      //       const attDivision = attributes.Division;
      //       const attLocation = attributes.Location;
      //
      //       // if (highlight && hoverProjectID !== attProjectID) {
      //       //   highlight.remove();
      //       //   highlight = null;
      //       //   return;
      //       // }
      //
      //       if (highlight) {
      //         return;
      //       }
      //
      //       const query = layerView.createQuery();
      //       query.where = "ProjectID = '" + attProjectID + "'";
      //       layerView.queryObjectIds(query).then(function(ids) {
      //         if (highlight) {
      //           // highlight.remove();
      //         }
      //         highlight = layerView.highlight(ids);
      //         hoverProjectID = attProjectID;
      //       });
      //     } else {
      //       // highlight.remove();
      //       highlight = null;
      //     }
      //   }
      //
      // });

      //----------Click-----------//
      view.when(function() {
        view.whenLayerView(projectLocations).then(function(layerView) {

          $(document).on("click", ".listItem", function(e){
            $('.listItem').removeClass('selected');
            $(this).addClass('selected');

            if(clickGraphic) {
              view.goTo(extentForRegionOfInterest);
              view.graphics.remove(clickGraphic);
            }

            var listProjectLocation = this.innerText.split("(")[1].split(")")[0];
            console.log(listProjectLocation);
            var listProjectID = this.id.split("|")[0];
            var listProjectLocSource = this.id.split("|")[1];
            console.log(listProjectID);
            console.log(listProjectLocSource);


            if (listProjectLocSource == "POINT") {
              if(mbtaHighlight !== null) {
                mbtaHighlight.remove();
              }
              var sourceLayer = projectLocationsPoints;
              var projQuery = sourceLayer.createQuery();
              projQuery.returnGeometry = true;
              console.log(sourceLayer)
              sourceLayer.renderer.uniqueValueInfos
              var symbol = {
                type: "simple-marker",
                color: "orange",
                size: "10px",
                outline: {
                  width: 0,
                  color: "orange"
                }
              }
            } else if (listProjectLocSource == "LINE") {
              if(mbtaHighlight !== null) {
                mbtaHighlight.remove();
              }
              var sourceLayer = projectLocations;
              var projQuery = sourceLayer.createQuery();
              projQuery.returnGeometry = true;
              var symbol = {
                type: "simple-line",
                color: "orange",
                width: 4
              }


            } else if (listProjectLocSource == "MBTA") {
              var sourceLayer = projectList;
              var projQuery = sourceLayer.createQuery();
              // console.log(listProjectLocation);

              var layerViewQuery = mbtaLines.createQuery();
              if (listProjectLocation == "System"){
                layerViewQuery.where = "(1=1)";
              } else {
                console.log("need MBTA line")
              }
              mbtaLines.queryObjectIds(layerViewQuery).then(function(ids) {
                // console.log(ids)
                mbtaHighlight = mbtaLines.highlight(ids);
                // currentProjectID = listProjectID;
              })
            }


            projQuery.where = "ProjectID='" + listProjectID + "'";
            // projQuery.returnGeometry = true;
            sourceLayer.queryFeatures(projQuery)
            .then(function(response) {
              return response;
            })
            .then(zoomToProj)
            .then(openProjectModal)

          function zoomToProj(response) {
            if(listProjectLocSource !== "MBTA") {
              view.goTo(response.features[0].geometry,
                {
                  duration: 1000,
                  easing: "in-out-expo"
                })
              clickGraphic = new Graphic({
                geometry: response.features[0].geometry,
                symbol: symbol,
              });
              view.graphics.add(clickGraphic);
            } else {
              view.goTo(extentForRegionOfInterest)
            }
            return response;
          }  // end zoomToProj function



          function openProjectModal(response) {
            projectModal.style.display = "block";
            var listItemAtts= response.features[0].attributes;
            console.log(listItemAtts);
            var listItemDesc = listItemAtts["Project_Description"];
            $('#projTitle').html(listItemDesc);
            var listItemArray = [];
            var listItemID = listItemAtts["ProjectID"];
            var listItemDiv = listItemAtts["Division"];
            var listItemProg = listItemAtts["Program"].split(' | ')[1];
            var listItemLoc = listItemAtts["Location"];
            var listItemPrior = listItemAtts["Priority"];
            var listItemCost = numeral(listItemAtts["Total"]).format('$0,0[.]00');
            listItemArray = [listItemDiv, listItemProg, listItemLoc, listItemPrior, listItemCost];
            $('#projDesc').empty();
            $('#projDesc').append(
              '<p><b>Project ID: </b>' + listItemID + '</p>' +
              '<p><b>Location: </b>' + listItemLoc + '</p>' +
              '<p><b>MassDOT Division: </b>' + listItemDiv + '</p>' +
              '<p><b>Program: </b>' + listItemProg + '</p>' +
              '<p><b>Priority: </b>' + listItemPrior + '</p>' +
              '<p><b>Total Cost: </b>' + listItemCost + '</p>'
            );
          }  // end openListModal function




              // //-------APIs--------//
              // $.get("https://a.mapillary.com/v3/images", {
              //   client_id: 'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
              //   closeto: [featureLong,featureLat],
              //   per_page: 100,
              //   radius: 10000,
              // })
              // .done(function (data) {
              //   var featuresMapAPI = [];
              //   featuresMapAPI = data.features;
              //   var latMapAPI = featuresMapAPI[0].geometry.coordinates[1];
              //   var longMapAPI = featuresMapAPI[0].geometry.coordinates[0];
              //   // console.log(longMapAPI, latMapAPI);
              //   var keyMapAPI = String(featuresMapAPI[0].properties.key);
              //   // console.log(keyMapAPI);
              //   var mlyCombined;
              //   mlyCombined = {};
              //   mlyCombined = new Mapillary.Viewer(
              //     'mly',
              //     'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
              //     keyMapAPI,
              //   )
              // });


          });

        })
      });




  	/*
      The following controls the project search bar. It defines it as an autopopulate
  	input search. It also tells it what to search for when a user inputs some text.
  	The second function is called when a project has been selected.
    */
    $("#projectSearch").autocomplete({
      source: function (request, response) {
        $.ajax({
          type: "POST",
          dataType: "json",
          url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/Projects/FeatureServer/6/query",

          data: {
            where: "(Project_Description like '%" + request.term + "%' OR ProjectID like '%" + request.term + "%' OR Location like '%" + request.term + "%') AND " + sql,
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
            view.popup.close();
            $(".ui-autocomplete").css({
              'width': ($("#projectSearch").width() + 'px')
            });
          }
        });
      },
      minLength: 2,
      select: function (event, ui) {
        searchedProject = ui.item.id;
      }
    });

    $("#projectSearch").autocomplete("option", "select", function (event, ui) {
      view.popup.clear();
      view.popup.close();
      view.graphics.removeAll();
      popupSelected.attributes = null;
      popupSelected.geometry = null;
      projectSearchID = ui.item.id
      $('#helpContents').show();
      $('#interactive').hide();
      geom = [];
      var query = prjLocationLines.createQuery();
      query.where = "ProjectID = '" + ui.item.id + "'";
      switch (ui.item.loc_source) {
        case 'POINT':
          prjLocationPoints.queryFeatures(query).then(function (pts) {
            geom = geom.concat(pts.features);
            openPopups();
          })
          break;
        case 'LINE':
          prjLocationLines.queryFeatures(query).then(function (result) {
            geom = geom.concat(result.features);
            openPopups();
          })
          break;
        case 'MBTA':
          var tQuery = mbtaLines.createQuery();
          tQuery.where = "Location_Filter like '%" + ui.item.mbta_loc + "%'";
          mbtaLines.queryFeatures(tQuery).then(function (result) {
            if (highlight) {
              highlight.remove();
            }
            highlight = mbtaLines.highlight(result.features);
            tAsset = new Graphic({
              geometry: result.features[0].geometry,
              attributes: {
                Project_Description: ui.item.value,
                ProjectID: ui.item.id,
                HighlightRemove: "false"
              },
              popupTemplate: {
                title: "{Project_Description} - ({ProjectID})",
                content: popupFunction
              }
            });
            view.popup.open({
              location: tAsset.geometry.extent.center,
              features: [tAsset],
              highlightEnabled: true
            });
            projectSearchID = false
          })
          break;
        case 'Statewide':
          if (highlight) {
            highlight.remove();
          }
          statewideSelected.popupTemplate = {
            title: "{Project_Description} - ({ProjectID})",
            content: popupFunction
          };
          statewideSelected.attributes = {
            Project_Description: ui.item.value,
            ProjectID: ui.item.id,
            HighlightRemove: "false"
          }
          view.popup.open({
            location: stateExtent.extent.center,
            features: [statewideSelected],
            highlightEnabled: true
          });
          projectSearchID = false
          break;
        default:
          var pQuery = prjLocationPolygons.createQuery();
          pQuery.where = "Location like '%" + ui.item.loc_source + "%'";
          prjLocationPolygons.queryFeatures(pQuery).then(function (result) {
            if (highlight) {
              highlight.remove();
            }
            popupSelected.geometry = result.features[0].geometry;
            popupSelected.popupTemplate = {
              title: "{Project_Description} - ({ProjectID})",
              content: popupFunction
            };
            popupSelected.attributes = {
              Project_Description: ui.item.value,
              ProjectID: ui.item.id,
              HighlightRemove: "false"
            }
            openPolyPopup(popupSelected)
            projectSearchID = false
          })
      }

      function openPolyPopup(popupSelected) {
        view.graphics.add(popupSelected);
        view.popup.open({
          location: popupSelected.geometry.extent.center,
          features: [popupSelected],
          highlightEnabled: true
        });
      }

      function openPopups() {
        if (geom[0].geometry.type == 'point') {
          center = geom[0].geometry
        } else {
          center = geom[0].geometry.extent.center
        }
        view.popup.open({
          location: center,
          features: geom,
          highlightEnabled: true
        });
        view.goTo(center);
        projectSearchID = false
      }
    });


	/*
	This waits for a checkbox with the .geomCheck class to change. It will then filter
	the polygon layer to hide/remove features based on the options (towns, RTAs, districts)
	from the map.
    */
    $(".geomCheck").change(function (e) {
      view.graphics.removeAll();
      if (e.target.checked == false && e.target.id === "townPrjs") {
        townsSql = "0"
      } else if (e.target.checked == true && e.target.id === "townPrjs") {
        townsSql = "Town"
      }
      if (e.target.checked == false && e.target.id === "rtaPrjs") {
        rtaSql = "0"
      } else if (e.target.checked == true && e.target.id === "rtaPrjs") {
        rtaSql = "RTA"
      }
      if (e.target.checked == false && e.target.id === "districtPrjs") {
        distSql = "0"
      } else if (e.target.checked == true && e.target.id === "districtPrjs") {
        distSql = "Highway District"
      }
      polySql = "(Location_Type = '" + townsSql + "') OR (Location_Type = '" + rtaSql + "') OR (Location_Type = '" + distSql + "')"
      polySqlFilter = new FeatureFilter({
        where: polySql,
      });
      prjLocationPolygons.definitionExpression = polySql
    });


  });
});
