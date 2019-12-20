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
    "esri/tasks/Locator",
    "esri/widgets/Search",
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    "esri/views/layers/support/FeatureFilter",
    "esri/Graphic"
  ], function (MapView, Map, WebMap, MapImageLayer, QueryTask, Query, watchUtils, FeatureLayer, GraphicsLayer, Locator, Search, Expand, Legend, FeatureFilter, Graphic, comments) {
    var reset;
    var extentForRegionOfInterest = false;

    function googleTranslateElementInit() {
      new google.translate.TranslateElement({
          pageLanguage: 'en'
        },
        'google_translate_element'
      );
    };

    var projectMapService = new MapImageLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer",
      sublayers: [{
        id: 1,
        title: "MassDOT Lines",
        outFields: ["*"],
        visible: true,
        // renderer: {
        //   type: "unique-value",
        //   field: "Division",
        //   uniqueValueInfos: [{
        //     value: "Highway",
        //     label: "Highway",
        //     symbol: {
        //       type: "simple-line",
        //       width: "2px",
        //       color: "red",
        //     }
        //   }, {
        //     value: "Rail",
        //     label: "Rail",
        //     symbol: {
        //       type: "simple-line",
        //       width: "2px",
        //       color: "blue",
        //     }
        //   }]
        // },
        popupTemplate: {
          title: "{Project_Description}",
          content: "{Division}",
        }
      }, {
        id: 3,
        title: "MassDOT Points",
        outFields: ["*"],
        visible: true,
      }, {
        id: 7,
        title: "MassDOT MBTA",
        outFields: ["*"],
        visible: true,
      }],
    });

    var map = new Map({
      basemap: "dark-gray",
    });

    var view = new MapView({
      map: map,
      container: "viewDiv",
      zoom: 9,
      center: [-71.8, 42]
    });

    map.add(projectMapService);

    var queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/0"
    });

    // map.addMany([projectLocations, projectLocationsPoints, projectLocationsMBTA]);

    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });

    mpoLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0",
    });

    commentLayer = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/2",
      outFields: ["*"],
    });


    var g = document.createElement('input');
    g.setAttribute("id", "projectSearch2");
    g.className = 'form-control mr-sm-2 input w-100';


    function popupFunction(target) {
      var query = new Query({
        outFields: ["*"],
        where: "ProjectID = '" + target.graphic.attributes.ProjectID + "'"
      });
      return queryProjectTask.execute(query).then(function (result) {
        var attributes = result.features[0].attributes;
        if (view.popup.selectedFeature.attributes.Project_Description == attributes.Project_Description) {
          projId = attributes.ProjectID;
          showComments(projId);
        }
        return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'>" + attributes.ProjectID + "</br><a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink'>Project Info Link</a></br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + attributes.Total__M + "</p> This is a " + attributes.Division + " project programmed as " + attributes.Program + ". It is located in " + attributes.Location + " and has a total cost of " + numeral(attributes.TotalCost).format('$0,0[.]00') + ".</br></br> It also lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
      });
    }

    var queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/Projects/FeatureServer/6"
    });

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

    view.ui.add(searchWidget, {
      position: "top-left",
      index: 0
    });

    view.on('click', function (event) {
      $('#helpContents').hide();
      $('#commentForm').hide()
      $('#projectList').hide();
    })

    watchUtils.watch(view.popup, "visible", function () {
      $(".esri-popup__navigation").on("click", function (e) {
        projId = false;
        showComments(projId);
      });
    });

    watchUtils.watch(view.popup, "selectedFeature", function () {
      projId = false;
    });

    $("#townSelect").change(function () {
      $("#mpoSelect").val("");
      var query = townLayer.createQuery();
      if ($("#townSelect").val() > 0) {
        query.where = "TOWN_ID = " + $("#townSelect").val();
        query.returnGeometry = true;
        query.outFields = ["TOWN_ID", "TOWN"];
        query.outSpatialReference = view.spatialReference;
        townLayer.queryFeatures(query)
          .then(function (response) {
            extentForRegionOfInterest = response.features[0].geometry
            view.goTo({
              target: response.features[0].geometry,
            });
            filterMap();
          });
      } else {
        view.goTo({
          zoom: 9, // Sets zoom level based on level of detail (LOD)
          center: [-71.8, 42]
        });
        extentForRegionOfInterest = false;
        filterMap();
      }
    });

    $("#mpoSelect").change(function () {
      $("#townSelect").val("");
      var selectedMPO = $(this).children("option:selected").val();
      var query = mpoLayer.createQuery();
      if (selectedMPO != "All") {
        query.where = "MPO = '" + selectedMPO + "'";
        query.returnGeometry = true;
        query.outFields = ["MPO"];
        query.outSpatialReference = view.spatialReference;
        mpoLayer.queryFeatures(query)
          .then(function (response) {
            extentForRegionOfInterest = response.features[0].geometry
            view.goTo({
              target: response.features[0].geometry,
            });
            filterMap();
          });
      } else {
        view.goTo({
          zoom: 9,
          center: [-71.8, 42]
        });
        extentForRegionOfInterest = false;
        filterMap();
      }
    });

    function filterMap() {
      filterMBTA = false;
      var sql = "1=1"
      divisionsSQL = "(1=1)";
      programsSQL = "(1=1)";
      if ($("#division").val() !== "All") {
        divisionsSQL = "Division = '" + $("#division").val() + "'";
      }
      if ($("#division").val() == "All" || $("#division").val() == "MBTA") {
        filterMBTA = true;
      }
      if ($("#programs").val()[0] !== 'All') {
        $($("#programs").val()).each(function () {
          if (this == $("#programs").val()[0]) {
            programsSQL = "Program = '" + this + "'"
          } else {
            programsSQL = programsSQL + " OR Program = '" + this + "'"
          }
        });
      }
      minCost = $("#cost-range").slider("values", 0)
      maxCost = $("#cost-range").slider("values", 1)
      sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( TotalCost  >= " + minCost + " AND TotalCost  <= " + maxCost + ")"
      queryFeatureLayerView(sql)
    };


    function queryFeatureLayerView(sqlExpression) {
      projectLocations.definitionExpression = sqlExpression;
      projectLocationsPoints.definitionExpression = sqlExpression;

      if (extentForRegionOfInterest != false) {
        var query = {
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects",
          outFields: ["*"],
          returnGeometry: true,
          //where: sqlExpression
        };

      // Wait for the layerview to be ready and then query features
      // view.whenLayerView(projectLocations).then(function (featureLayerView) {
      //   featureLayerView.queryObjectIds(query).then(function (result) {
      //     theOids = "OBJECTID in (" + result + ")";
		  // console.log(projectLocations);
      //     	//projectLocations.definitionExpression = theOids;
      //   });
      // });

        view.whenLayerView(projectLocations).then(function (featureLayerView) {
          if (featureLayerView.updating) {
            var handle = featureLayerView.watch("updating", function (isUpdating) {
              if (!isUpdating) {
                featureLayerView.queryObjectIds(query).then(function (result) {
                  theOids = "OBJECTID in (" + result + ")";
                  if (result.length > 0) {
                    projectLocations.definitionExpression = theOids;
                  }
                });
                handle.remove();
              }
            });
          } else {
            featureLayerView.queryObjectIds(query).then(function (result) {
              theOids = "OBJECTID in (" + result + ")";
              if (result.length > 0) {
                projectLocations.definitionExpression = theOids;
              }
            });
          }
        });

        view.whenLayerView(projectLocationsPoints).then(function (featureLayerView) {
          if (featureLayerView.updating) {
            var handle = featureLayerView.watch("updating", function (isUpdating) {
              if (!isUpdating) {
                featureLayerView.queryObjectIds(query).then(function (result) {
                  theOids = "OBJECTID in (" + result + ")";
                  if (result.length > 0) {
                    projectLocationsPoints.definitionExpression = theOids;
                  }
                });
                handle.remove();
              }
            });
          } else {
            featureLayerView.queryObjectIds(query).then(function (result) {
              theOids = "OBJECTID in (" + result + ")";
              if (result.length > 0) {
                projectLocationsPoints.definitionExpression = theOids;
              }
            });
          }
        });

      }

      if (filterMBTA = true) {
        getMBTA(sqlExpression)
        //projectMapService.sublayers.items[2].definitionExpression = sqlExpression;
      }
    };


    function getMBTA(sql) {
      var newSql = sql.replace("TotalCost", "Total");
      var newNewSql = newSql.replace("TotalCost", "Total");
      $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6/query", {
          where: newNewSql,
          outFields: "MBTA_Location",
          returnGeometry: false,
          orderByFields: 'MBTA_Location',
          returnDistinctValues: true,
          f: 'pjson'
        })
        .done(function (data) {
          var projLocations = $.parseJSON(data);
          locationList = [];
          $(projLocations.features).each(function () {
            if (this.attributes.MBTA_Location != null) {
              locationList.push("'" + this.attributes.MBTA_Location + "'");
            }

          });
          theLocations = "MBTA_Location in (" + locationList.join() + ")";
		  console.log(theLocations);
		  projectLocationsMBTA.definitionExpression = theLocations;
       mbtaLocations = mbtaLocations + ")";
       var mbtaLocationsNew = mbtaLocations.replace(") OR )", ") )");
       console.log(mbtaLocationsNew);
       var queryProjectsMBTA = projectLocationsMBTA.createQuery();
       if (extentForRegionOfInterest != false) {
         queryProjectsMBTA.geometry = extentForRegionOfInterest;
         queryProjectsMBTA.spatialRelationship = "intersects";
       }
       queryProjectsMBTA.where = mbtaLocationsNew;
       queryProjectsMBTA.returnGeometry = true;
       queryProjectsMBTA.outFields = ["OBJECTID"];
       queryProjectsMBTA.outSpatialReference = view.spatialReference;
       projectMapService.sublayers.items[2].definitionExpression = mbtaLocationsNew;
      });
    }



    function filterMapRequests() {
      view.map.removeAll();
      filterMBTA = false;
      var sql = "1=1"
      divisionsSQL = "(1=1)";
      programsSQL = "(1=1)";
      if ($("#division").val() !== "All") {
        divisionsSQL = "Division = '" + $("#division").val() + "'";
      }
      if ($("#division").val() == "All" || $("#division").val() == "MBTA") {
        console.log("GET MBTA DATA");
        filterMBTA = true;
      }
      if ($("#programs").val()[0] !== 'All') {
        $($("#programs").val()).each(function () {
          if (this == $("#programs").val()[0]) {
            programsSQL = "Program = '" + this + "'"
          } else {
            programsSQL = programsSQL + " OR Program = '" + this + "'"
          }
        });
      }
      minCost = $("#cost-range").slider("values", 0)
      maxCost = $("#cost-range").slider("values", 1)
      sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( TotalCost  >= " + minCost + " AND TotalCost  <= " + maxCost + ")"
      console.log("Filtering: ", sql);
      var pointLayerResults = new FeatureLayer({
        popupTemplate: {
          title: "{Project_Description}",
          content: popupFunction
        },
        title: "Point Projects",
        geometryType: "point",
        spatialReference: {
          wkid: 3857
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            color: "blue",
            size: 8,
            outline: {
              width: 0.5,
              color: "darkblue"
            }
          }
        }
      });

      var lineLayerResults = new FeatureLayer({
        popupTemplate: {
          title: "{Project_Description}",
          content: popupFunction
        },
        title: "Line Projects",
        geometryType: "polyline",
        spatialReference: {
          wkid: 3857
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-line",
            color: [226, 119, 40],
            width: 4
          }
        }
      });

      var queryProjects = projectLocationsPoints.createQuery();
      if (extentForRegionOfInterest != false) {
        queryProjects.geometry = extentForRegionOfInterest;
        queryProjects.spatialRelationship = "intersects";
      }
      queryProjects.where = sql;
      queryProjects.returnGeometry = true;
      queryProjects.outFields = ["OBJECTID, Project_Description, ProjectID"];
      queryProjects.outSpatialReference = view.spatialReference;

      projectLocationsPoints.queryFeatures(queryProjects).then(function (response) {
        pointLayerResults.source = response.features;
        pointLayerResults.fields = response.fields;
        view.map.add(pointLayerResults);
      });

      projectLocations.queryFeatures(queryProjects).then(function (response) {
        lineLayerResults.source = response.features;
        lineLayerResults.fields = response.fields;
        view.map.add(lineLayerResults);
      });
      if (filterMBTA = true) {
        getMBTA(sql);
      }
    };
    //
    //
    // var mbtaLineResults = new FeatureLayer({
    //   title: "Line Projects",
    //   geometryType: "polyline",
    //   spatialReference: {
    //     wkid: 3857
    //   },
    //   renderer: {
    //     type: "simple",
    //     symbol: {
    //       type: "simple-line",
    //       color: [126, 119, 40],
    //       width: 8
    //     }
    //   }
    // });
    //
    //
  //   function getMBTA(sql) {
  //     var newSql = sql.replace("TotalCost", "Total");
  //     var newNewSql = newSql.replace("TotalCost", "Total");
  //     $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6/query", {
  //         where: newNewSql,
  //         outFields: "MBTA_Location",
  //         returnGeometry: false,
  //         orderByFields: 'MBTA_Location',
  //         returnDistinctValues: true,
  //         f: 'pjson'
  //       })
  //       .done(function (data) {
  //         var projects = $.parseJSON(data);
  //         mbtaLocations = '1=1 AND ('
  //         $(projects.features).each(function () {
  //           mbtaLocations = mbtaLocations + "(MBTA_Location = '" + this.attributes.MBTA_Location + "') OR "
  //         });
  //         mbtaLocations = mbtaLocations + ")";
  //         var mbtaLocationsNew = mbtaLocations.replace(") OR )", ") )");
  //
  //         console.log(mbtaLocationsNew);
  //         var queryProjectsMBTA = projectLocationsMBTA.createQuery();
  //         if (extentForRegionOfInterest != false) {
  //           queryProjectsMBTA.geometry = extentForRegionOfInterest;
  //           queryProjectsMBTA.spatialRelationship = "intersects";
  //         }
  //         queryProjectsMBTA.where = mbtaLocationsNew;
  //         queryProjectsMBTA.returnGeometry = true;
  //         queryProjectsMBTA.outFields = ["OBJECTID"];
  //         queryProjectsMBTA.outSpatialReference = view.spatialReference;
  //
  //
  //         projectLocationsMBTA.queryFeatures(queryProjectsMBTA).then(function (response) {
  //           mbtaLineResults.source = response.features;
  //           mbtaLineResults.fields = response.fields;
  //           view.map.add(mbtaLineResults);
  //         });
  //       });
  //
  //
  //
  //   $(".costInput").change(function () {
  //     minValue = numeral($("#minCost").val()).value();
  //     maxValue = numeral($("#maxCost").val()).value();
  //     if (minValue > maxValue) {
  //       maxValue = minValue
  //     };
  //     $("#minCost").val(numeral(minValue).format('0,0[.]00'));
  //     $("#maxCost").val(numeral(maxValue).format('0,0[.]00'));
  //     $("#cost-range").slider("values", [minValue, maxValue]);
  //     filterMap();
  //   });
  //
  //   $(".filter").change(function () {
  //     filterMap();
  //   });
  //   $("#projectSearch").autocomplete("option", "select", function (event, ui) {
  //     selectProject(ui.item.id);
  //   });
  //
  //   function selectProject(id) {
  //     projId = id;
  //     showComments(projId);
  //   }
  //   //
  //   // function showComments(projId) {
  //   //   $('#helpContents').hide();
  //   //   if (projId == false) {
  //   //     html = $.parseHTML(view.popup.content.viewModel.content)
  //   //     projId = $(html).attr('val');
  //   //   }
  //   //   $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/2/query", {
  //   //       where: "Division_ID = '" + projId + "'",
  //   //       outFields: "*",
  //   //       f: "json",
  //   //       returnGeometry: "false",
  //   //       returnIdsOnly: "false"
  //   //     })
  //   //     .done(function (data) {
  //   //       var results = $('#results');
  //   //       results.hide();
  //   //       results.empty();
  //   //       if ($(data.features).length > 0) {
  //   //         $(data.features).each(function () {
  //   //           results.append("<div class='row w-100 container-fluid'><div class='col'><div class='card col'> <div class='card-body> <h6 class='card-subtitle mb-2 text-muted'>Name: " + this.attributes.Name + "</h6> <p class='card-text text-truncate' style='max-width: 190px'>Comment: " + this.attributes.Comments + "</p></div></div></div></div>");
  //   //         });
  //   //         results.show();
  //   //       } else {
  //   //         results.append("This project currently has no comments. PROJ ID: " + projId);
  //   //       }
  //   //       results.show();
  //   //       $('#commentForm').show();
  //   //       $('#projectList').show();
  //   //     });
  //   //
  //   // }
  //   //
  // });
});
}); //sometimes extra
