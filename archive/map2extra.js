$(document).ready(function () {

  require(["esri/views/MapView",
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
    "esri/widgets/Home",
    "esri/views/layers/support/FeatureFilter",
    "esri/Graphic"
  ], function (MapView, Map, WebMap, MapImageLayer, QueryTask, Query, watchUtils, FeatureLayer, GraphicsLayer, Locator, Search, Expand, Legend, Home, FeatureFilter, Graphic, comments) {
    var reset;
    var extentForRegionOfInterest = false;
    var spatialFilter = false;
    MBTALine = false;

    function googleTranslateElementInit() {
      new google.translate.TranslateElement({
          pageLanguage: 'en'
        },
        'google_translate_element'
      );
    }

    var map = new Map({
      basemap: "dark-gray",
    });

    //The following feature layers represent the projects and their locations
    projectList = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/3",
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
      outFields: ["Project_Description", "ProjectID", "OBJECTID"],
      visible: true,
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
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction
      }
    });

    projectLocationsPolygons = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/4",
      outFields: ["Project_Description"],
      visible: false,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction
      }
    });

    projectLocationsMBTA = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name"],
      popupTemplate: {
        title: "MBTA Line: {MBTA_Location} - {route_desc}",
        content: popupFunctionMbta
      }
    });
    //This function creates the content for the popups for the project location layers
    function popupFunction(feature) {
      var query = new Query({
        outFields: ["*"],
        where: "ProjectID = '" + feature.graphic.attributes.ProjectID + "'"
      });
      return queryProjectTask.execute(query).then(function (result) {
        var attributes = result.features[0].attributes;
        return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'></br><a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink'>Project Info Link</a></br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + attributes.Total + "</p> This is a " + attributes.Division + " project programmed as " + attributes.Program + ". It is located in " + attributes.Location + " and has a total cost of " + numeral(attributes.Total).format('$0,0[.]00') + ".</br></br> It also lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
      });
    }

    //This function creates the content for the popups for the MBTA lines
    function popupFunctionMbta(target) {
      lineProjects = [];
      modeProjects = [];
      systemProjects = [];
      var query = new Query({
        outFields: ["*"],
        where: "MBTA_Location = '" + target.graphic.attributes.MBTA_Location + "' or MBTA_Location = '" + target.graphic.attributes.route_desc + "' or MBTA_Location = 'System'"
      });
      return queryProjectTask.execute(query).then(function (result) {
        if (result.features.length > 0) {
          var attributes = result.features[0].attributes;
          firstFeature = result.features[0];
          var table = ""
          $(result.features).each(function () {
            thisProject = "<p> <button class='btn info projList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
            table = table.concat(thisProject);
            var thisProject = new Graphic({
              geometry: view.popup.selectedFeature.geometry,
              attributes: this.attributes,
              symbol: {
                type: "simple-line", // autocasts as SimpleLineSymbol()
                color: [226, 119, 40],
                width: 10
              },
              popupTemplate: {
                title: "{Project_Description}",
                content: popupFunction
              }
            });
            switch (this.attributes.MBTA_Location) {
              case target.graphic.attributes.MBTA_Location:
                lineProjects.push(thisProject);
                break;
              case target.graphic.attributes.route_desc:
                modeProjects.push(thisProject);
                break;
              default:
                systemProjects.push(thisProject);
            }
          });
          return "<p id='popupFeatureSelected' class='projList line' modeType='line' val='" + target.graphic.attributes.MBTA_Location + "'><button class='btn btn-info'>View all " + target.graphic.attributes.MBTA_Location + " projects</button>"
            + "<p id='popupFeatureSelected' class='projList mode' modeType='mode' val='System'><button class='btn btn-info'>View all " + target.graphic.attributes.route_desc + " projects</button>"
            + "<p id='popupFeatureSelected' class='projList system' modeType='system' val='System'><button class='btn btn-info'>View MBTA Systemwide projects</button>";
        } else {
          return "<p id='popupFeatureSelected' class='projList' val=''><button class='btn btn-info'>View NO PROJECTS HERE projects</button>";
        }

      });
    }

    // map.addMany([projectLocationsMBTA, projectLocationsPoints, projectLocations]);
    map.addMany([projectLocationsPoints]);
    //These are periphery layers used for added functionality, including spatial querying and commenting
    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });

    mpoLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0",
    });

    var view = new MapView({
      map: map,
      container: "viewDiv",
      zoom: 9,
      center: [-71.8, 42],
      highlightOptions: {
        color: [255, 241, 58],
        fillOpacity: 0.4
      },
    });

    var legend = new Expand({
      content: new Legend({
        view: view,
        style: "classic",
        layerInfos: [{
          layer: projectLocations,
          title: "PROJECT LOCATIONS",
        }, {
          layer: projectLocationsPoints,
          title: "",
        }, {
          layer: projectLocationsMBTA,
          title: "MBTA"
        }],
      }),
      view: view,
      // expanded: true
    });
    view.ui.add(legend, "top-right");


    var queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6"
    });

    var searchWidget = new Search({
      view: view,
      allPlaceholder: "Search location or project (ex. Red-Blue Connector)",
      locationEnabled: false,
      popupEnabled: true,
      container: "searchPlace",
      includeDefaultSources: false,
      sources: [{
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


    // view.on('click', function (event) {
    //   $('#projectList').hide();
    // })


    watchUtils.watch(view.popup, "selectedFeature", function () {
    });

    //The following event handlers listen for changes in the filter form inputs
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
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            view.goTo({
              target: response.features[0].geometry,
            });
            applyAttributeFilter();
          });
      } else {
        view.goTo({
          zoom: 9, // Sets zoom level based on level of detail (LOD)
          center: [-71.8, 42]
        });
        spatialFilter = false;
        applyAttributeFilter();
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
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            view.goTo({
              target: response.features[0].geometry,
            });
            applyAttributeFilter();
          });
      } else {
        view.goTo({
          zoom: 9, // Sets zoom level based on level of detail (LOD)
          center: [-71.8, 42]
        });
        spatialFilter = false;
        applyAttributeFilter();
      }
    });


        //These functions are used to filter features on the map. The first filters features by attributes alone. applySpatialFilter() applies a spatial filter. applyMBTAFilter() filters MBTA lines
        function applyAttributeFilter() {
          sql = "1=1"

          divisionsSQL = "(1=1)";
          programsSQL = "(1=1)";
          if ($("#division").val() !== "All") {
            divisionsSQL = "Division = '" + $("#division").val() + "'";
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
          sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( TotalCost  >= " + parseFloat($("#minCost").val().replace(/,/g, '')) + " AND TotalCost  <= " + parseFloat($("#maxCost").val().replace(/,/g, '')) + ")"
          projectLocations.definitionExpression = sql;
          projectLocationsPoints.definitionExpression = sql;

          if (spatialFilter === true) {
            applySpatialFilter(sql)
          }
          if ($("#division").val() == "All" || $("#division").val() == "MBTA") {
            applyMBTAAttributeFilter(sql)
          } else {
            projectLocationsMBTA.definitionExpression = '1=2';
          }
        }

        function applySpatialFilter() {
          if (extentForRegionOfInterest != false) {
            var query = {
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects",
              outFields: ["*"],
              returnGeometry: true,
            };
            console.log("APPLYING SPATIAL FILTER: ", query);

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
                      } else {
                        projectLocationsPoints.definitionExpression = "1=2";
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
                  } else {
                    projectLocationsPoints.definitionExpression = "1=2";
                  }
                });
              }
            });
          }
        }


        function applyMBTAAttributeFilter(sql) {
          mbtaSql = sql.replace("TotalCost", "Total").replace("TotalCost", "Total")
          $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6/query", {
              where: mbtaSql,
              outFields: "MBTA_Location",
              returnGeometry: false,
              orderByFields: 'MBTA_Location',
              returnDistinctValues: true,
              f: 'pjson'
            })
            .done(function (data) {
              var projLocations = $.parseJSON(data);
              mbtaLocationList = [];
              $(projLocations.features).each(function () {
                if (this.attributes.MBTA_Location != null) {
                  mbtaLocationList.push("'" + this.attributes.MBTA_Location + "'");
                }
              });
              if (projLocations.features.length > 0) {
                mbtaLocationList = "MBTA_Location in (" + mbtaLocationList.join() + ")";
                projectLocationsMBTA.definitionExpression = mbtaLocationList;
                if (spatialFilter === true) {
                  applyMBTASpatialFilter(mbtaLocationList)
                }
              } else {
                projectLocationsMBTA.definitionExpression = '1=2';
              }
            });
        }

        function applyMBTASpatialFilter(mbtaLocationList) {
            var query = {
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects",
              outFields: ["*"],
              returnGeometry: true,
            };
          console.log("MBTA spatial query: ", mbtaLocationList)
          view.whenLayerView(projectLocationsMBTA).then(function (featureLayerView) {
            if (featureLayerView.updating) {
              var handle = featureLayerView.watch("updating", function (isUpdating) {
                if (!isUpdating) {
                  featureLayerView.queryObjectIds(query).then(function (result) {
                    theOids = "OBJECTID in (" + result + ")";
                    if (result.length > 0) {
                      projectLocationsMBTA.definitionExpression = theOids;
                    } else {
                      projectLocationsMBTA.definitionExpression = '1=2';
                    }
                  });
                  handle.remove();
                }
              });
            } else {
              featureLayerView.queryObjectIds(query).then(function (result) {
                theOids = "OBJECTID in (" + result + ")";
                if (result.length > 0) {
                  projectLocationsMBTA.definitionExpression = theOids;
                } else {
                  projectLocationsMBTA.definitionExpression = '1=2';
                }
              });
            }
          });
        }


      $("#cost-range").slider({
        range: true,
        min: 0,
        max: 5000000000,
        values: [0, 5000000000],
        slide: function (event, ui) {
          $("#minCost").val(numeral(ui.values[0]).format('0,0[.]00'));
          $("#maxCost").val(numeral(ui.values[1]).format('0,0[.]00'));
          applyAttributeFilter();
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
        applyAttributeFilter();
      });

      $(".filter").change(function () {
        applyAttributeFilter();
      });
    $("#projectSearch").autocomplete("option", "select", function (event, ui) {
      selectProject(ui.item.id);
    });

    function selectProject(id) {
      projId = id;
    }

    $("select.filter").change(function(){ // begin filter from Side Panel
      listModal.style.display = "block";
      var splitProgramSelect = [];
      var mySelect = $('#projectList-content').empty();

      var str = $(this).children("option:selected").val(this.attributes.Program)[0].innerText;
      var programSelect = str.replace(/ /g, "+");
      programSelect = str.replace(/&/g, "%26");
      // console.log(programSelect);
      if (programSelect=="All") {
        splitProgramSelect.push(programSelect);
      } else {
        splitProgramSelect = programSelect.split(" | ");
      }
      var getLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query?where=Program%3D%27" +
      programSelect +
      "%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=pjson";


      $.get(getLink, function (data) {
        var programs = JSON.parse(data);
        mySelect = $('#projectList-content');

        if(splitProgramSelect.length>1){
          $('#projectList-header').html(splitProgramSelect[0].toUpperCase());
          $('#projectList-subheader').html(splitProgramSelect[1].toUpperCase() + ' PROJECTS');
        } else {
          $('#projectList-header').html(splitProgramSelect[0].toUpperCase() + ' PROJECTS');
          $('#projectList-subheader').empty();
        }

        $(programs.features).each(function () {
          var projDesc = this.attributes.ProjectID;
          var location = this.attributes.Location;
          if(location=="Multiple - See Project Name") {
            location = "Multiple Towns";
          }
          var textResult = projDesc.concat(" (").concat(location).concat(")");
          // console.log(textResult);
          mySelect.append(
            // $('<div class="listItem"><a href=""></a></div>').val(textResult).html(textResult)
            $('<div class="listItem"></div>').val(textResult).html(textResult)
          );
        });
      });
    }); // end filter from Side Panel








    // $(document).on("mouseover", ".listItem", function(e){
    //   var projectID = e.target.innerText.split(" (")[0];
    //   console.log(projectID);
      // var testID = this.innerText.split(" (")[0];
      // console.log(testID);

      //Function for hovering over project ID in list and highlighting project on map
      // const controller = new AbortController();
      view.when(function() {
        var projectLayer = map.layers.getItemAt(0); //TODO: dynamic item #

        view.whenLayerView(projectLayer).then(function(layerView) {
          var highlightSelect, highlightHover;

          var queryProjects = projectLayer.createQuery();

          // var buttons = document.querySelectorAll("button");
          // for (var i = 0, button = null; (button = buttons[i]); i++) {
          //   console.log(button);
          //   // button.addEventListener("click", onClick);
          //   button.addEventListener("mouseover", onMouseOver);
          //   button.addEventListener("mouseout", onMouseOut);
          // };

          $(document).on("mouseover", ".listItem", function(e){
            var projectID = this.innerText.split(" (")[0];
            console.log(projectID);
            // var projectItems = document.querySelectorAll(".listItem");
            // // console.log(projectItems);
            // for (var i = 0, listItem = null; (listItem = projectItems[i]); i++) {
            //   // console.log(listItem);
            //   // listItem.addEventListener("click", onClick);
            //   // listItem.addEventListener("mouseover", onMouseOver);
            //   // listItem.addEventListener("mouseout", onMouseOut);
            // }
          });


        });
      });
    // });











    function zoomToExtent(extent) {
      return extent.queryExtent().then(function (response) {
        view.goTo(response.extent);
        long = response.extent.center.longitude;
        lat = response.extent.center.latitude;
        view.center = [long, lat];
        height = response.extent.height;
        width = response.extent.width;
        max = Math.max(height, width);
        if (max < 5000) {
          view.zoom = 14;
        } else if (max < 10000) {
          view.zoom = 13;
        } else if (max < 21000) {
          view.zoom = 12;
        } else {
          view.zoom = 11;
        };
        // var homeBtn = new Home({
        //   view: view,
        // });
        // view.ui.add(homeBtn, "top-left");
      });
    };

    var homeBtn = new Home({
      view: view,
    });
    view.ui.add(homeBtn, "top-left");


  }); // end required function
}); // end document ready
