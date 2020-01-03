$(document).ready(function () {

  require([
    "esri/views/MapView",
    "esri/Map",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/tasks/Locator",
    "esri/widgets/Search",
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/views/layers/support/FeatureFilter",
    "esri/Graphic"
  ], function (MapView, Map, QueryTask, Query, FeatureLayer, GraphicsLayer, Locator, Search, Expand, Legend, Home, FeatureFilter, Graphic) {
    var reset;
    var extentForRegionOfInterest = false;
    var spatialFilter = false;
    MBTALine = false;

    // test = new FeatureLayer({
    //   url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/3",
    //   outFields: ["*"],
    //   visible: true,
    //   popupEnabled: true,
    //   popupTemplate: {
    //     title: "{Project_Description}",
    //     content: popupFunction
    //   }
    // });


    var map1 = new Map({
      basemap: "dark-gray",
    });

    // var map2 = new Map({
    //   basemap: "gray",
    //   layers: [test],
    // })

    var view1 = new MapView({
      map: map1,
      container: "viewDiv",
      zoom: 9,
      center: [-71.8, 42],
      highlightOptions: {
        color: [0, 255, 255],
        fillOpacity: 0.5
      },
    });

    // var view2 = new MapView({
    //   map: map2,
    //   container: "viewMini",
    //   zoom: 12, // 5 mile buffer from centroid of project
    //   center: [-71.2, 42.2], // centroid of project
    // });


    //The following feature layers represent the projects and their locations
    projectLocationsLines = new FeatureLayer({
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
        return "<p>Project ID: " + attributes.ProjectID + "</br> Location: " + attributes.Location + "</br> MassDOT Division: " + attributes.Division + "</br> Program: " + attributes.Program.split(' | ')[1] + "</br> Total Cost: " + numeral(attributes.Total).format('$0,0[.]00') + "</p>" +
        "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'><a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink'>see in Project Info</a></p>"
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
            // thisProject = "<p> <button class='btn info projList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";

            thisProject = "<p> <button class='btn info projList'></button></p>";

            table = table.concat(thisProject);

            var thisProject = new Graphic({
              geometry: view1.popup.selectedFeature.geometry,
              attributes: this.attributes,
              symbol: {
                type: "simple-line", // autocasts as SimpleLineSymbol()
                color: [226, 119, 40],
                width: 10
              },
              popupTemplate: {
                // title: "{Project_Description}",
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

    // map2.add(projectLocationsPoints);
    map1.addMany([projectLocationsMBTA, projectLocationsPoints, projectLocationsLines]);
    // map1.addMany([projectLocationsPoints]);
    //These are periphery layers used for added functionality, including spatial querying and commenting
    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });

    mpoLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0",
    });

    var legend = new Expand({
      content: new Legend({
        view: view1,
        style: "classic",
        layerInfos: [{
          layer: projectLocationsLines,
          title: "PROJECT LOCATIONS",
        }, {
          layer: projectLocationsPoints,
          title: "",
        }, {
          layer: projectLocationsMBTA,
          title: "MBTA"
        }],
      }),
      view: view1,
      // expanded: true
    });
    view1.ui.add(legend, "top-right");

    $(document).on("click", ".projList", function (e) {
      switch ($(this).attr('modeType')) {
        case 'line':
          popupFeatures = lineProjects;
          break;
        case 'mode':
          popupFeatures = modeProjects;
          break;
        default:
          popupFeatures = systemProjects;
      }
      view1.popup.open({
        features: popupFeatures, // array of graphics
        featureMenuOpen: true,
        highlightEnabled: true // selected features initially display in a list
      });
      MBTALine = true
    });

    var queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6"
    });

    var searchWidget = new Search({
      view: view1,
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

    view1.ui.add(searchWidget, {
      position: "top-left",
      index: 0
    });

    //The following event handlers listen for changes in the filter form inputs
    $("#townSelect").change(function () {
      $("#mpoSelect").val("");
      var query = townLayer.createQuery();
      if ($("#townSelect").val() > 0) {
        query.where = "TOWN_ID = " + $("#townSelect").val();
        query.returnGeometry = true;
        query.outFields = ["TOWN_ID", "TOWN"];
        query.outSpatialReference = view1.spatialReference;
        townLayer.queryFeatures(query)
          .then(function (response) {
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            view1.goTo({
              target: response.features[0].geometry,
            });
            view2.goTo({
              target: response.features[0].geometry,
            });
            applyFeatureViewFilters();
          });
      } else {
        view1.goTo({
          zoom: 9,
          center: [-71.8, 42]
        });
        // view2.goTo({
        //   zoom: 12,
        //   center: [-71.8, 42]
        // });
        spatialFilter = false;
        applyFeatureViewFilters();
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
        query.outSpatialReference = view1.spatialReference;
        mpoLayer.queryFeatures(query)
          .then(function (response) {
            spatialFilter = true;
            extentForRegionOfInterest = response.features[0].geometry
            view1.goTo({
              target: response.features[0].geometry,
            });
            view2.goTo({
              target: response.features[0].geometry,
            });
            applyFeatureViewFilters();
          });
      } else {
        view1.goTo({
          zoom: 9, // Sets zoom level based on level of detail (LOD)
          center: [-71.8, 42]
        });
        spatialFilter = false;
        applyFeatureViewFilters();
      }
    });

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

    $(".filter").change(function () {
      applyFeatureViewFilters();
    });

    //These are the feature layer views of the project locations
    view1.whenLayerView(projectLocationsLines)
      .then(function (layerView) {
        prjLocationLines = layerView
      })
      .catch(function (error) {});

    view1.whenLayerView(projectLocationsPoints)
      .then(function (layerView) {
        prjLocationPoints = layerView
      })
      .catch(function (error) {});

    view1.whenLayerView(projectLocationsMBTA)
      .then(function (layerView) {
        mbtaLines = layerView
      })
      .catch(function (error) {});



    //This function applies FeatureFilters to the layers in the map
    function applyFeatureViewFilters() {
      view1.popup.close();
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

      if ($("#division").val() == "All" || $("#division").val() == "MBTA") {
        mbtaLines.visible = true;
        mbtaSql = sql.replace("TotalCost", "Total").replace("TotalCost", "Total")
      } else {
        mbtaLines.visible = false;
      }

      if (spatialFilter === true) {
        queryFilter = new FeatureFilter({
          where: sql,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        });
      } else {
        queryFilter = new FeatureFilter({
          where: sql,
        });
      }

      prjLocationLines.filter = queryFilter
      prjLocationPoints.filter = queryFilter
      checkLayersUpdated()
    }

    function checkLayersUpdated() {
      prjLocationLines.visible = true;
      prjLocationPoints.visible = true;
    }




    $("select.filter").change(function(){ // begin filter from Side Panel
      listModal.style.display = "block";
      var splitProgramSelect = [];
      var mySelect_List = $('#projectList-content').empty();

      var str = $(this).children("option:selected").val(this.attributes.Program)[0].innerText;

      // var str = $(this).children("option:selected").val(this.attributes.Division)[0].attributes.division.value;
      // console.log(str);





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
        mySelect_List = $('#projectList-content');

        if(splitProgramSelect.length>1){
          // $('#projectList-header').html(splitProgramSelect[0].toUpperCase());
          $('#projectList-header').html('test'.toUpperCase());
          $('#projectList-subheader').html(splitProgramSelect[1].toUpperCase() + ' PROJECTS');
        } else {
          $('#projectList-header').html(splitProgramSelect[0].toUpperCase() + ' PROJECTS');
          $('#projectList-subheader').empty();
        }

        $(programs.features).each(function () {
          var projDesc = this.attributes.Project_Description;
          var projID = this.attributes.ProjectID;
          var location = this.attributes.Location;
          var textResult = projDesc.concat(" (").concat(location).concat(")");
          // console.log(textResult);
          // mySelect_List.attr('id', $(projDesc).text());
          // mySelect_List.
          mySelect_List.append(
            $('<div class="listItem"></div>').val(textResult).html(textResult).attr('id', projID)
          );
        });
      });
    }); // end filter from Side Panel


    var highlightSelect, highlightHover;
    // initialize AbortController
    const controller = new AbortController();
    const signal = controller.signal;
    //Function for hovering over project ID in list and highlighting project on map
    view1.when(function() {
      var projectLayer = map1.layers.getItemAt(1);
      // console.log(projectLayer);
      // var projectLayer2 = map1.layers.getItemAt(1);
      // console.log(projectLayer2);

      view1.whenLayerView(projectLayer).then(function(layerView) {
        var queryProjects = projectLayer.createQuery();

        $(document).on("click", ".listItem", function(e){
          $('.listItem').removeClass('selected');
          $(this).addClass('selected');
          var projectName = this.innerText;
          // var projDesc = this.innerText.split(" (")[0];
          var projectID = this.id;
          // console.log(projectID);
          queryProjects.where = "ProjectID='" + projectID + "'";

          projectLayer.queryFeatures(queryProjects).then(function(result) {
            if (highlightSelect) {
              highlightSelect.remove();
            }
            var feature = result.features[0];
            highlightSelect = layerView.highlight(
              feature.attributes["OBJECTID"]
            );

            view1.goTo(
              {
                target: feature.geometry,
                tilt: 70
              },
              {
                duration: 2000,
                easing: "in-out-expo"
              }
            );

            projectModal.style.display = "block";
            var projectDesc = result.features[0].attributes["Project_Description"];
            $('#projTitle').html(projectDesc);
            var projectDiv = result.features[0].attributes["Division"];
            var projectProg = result.features[0].attributes["Program"].split(' | ')[1];
            var projectLoc = result.features[0].attributes["Location"];
            var projectPrior = result.features[0].attributes["Priority"];
            var projectCost = numeral(result.features[0].attributes["TotalCost"]).format('$0,0[.]00');

            var mySelect_Project = $('#projDesc').empty();
            // mySelect_Project = $('#projDesc');
            mySelect_Project.append(
              '<p><b>Project ID: </b>' + projectID + '</p>' +
              '<p><b>Location: </b>' + projectLoc + '</p>' +
              '<p><b>MassDOT Division: </b>' + projectDiv + '</p>' +
              '<p><b>Program: </b>' + projectProg + '</p>' +
              '<p><b>Priority: </b>' + projectPrior + '</p>' +
              '<p><b>Total Cost: </b>' + projectCost + '</p>'
              );
          });
        });

        $(document).on("mouseover", ".listItem", function(e){
          // var projectID = this.innerText.split(" (")[0];
          // // console.log(projectID);
          // queryProjects.where = "ProjectID='" + projectID + "'";
          projectLayer
            .queryFeatures(queryProjects, { signal })
            .then(function(result) {
              if (highlightHover) {
                highlightHover.remove();
              }
              var feature = result.features[0];
              highlightHover = layerView.highlight(
                feature.attributes["OBJECTID"]
              );
            });
        });

        $(document).on("mouseout", ".listItem", function(e){
          controller.abort();
          if (highlightHover) {
            highlightHover.remove();
          }
        });


      });
    });





    var homeBtn1 = new Home({
      view: view1,
    });
    view1.ui.add(homeBtn1, "top-left");

    var homeBtn2 = new Home({
      view: view2,
    });
    view2.ui.add(homeBtn2, "top-left");

  }); // end required function
}); // end document ready
