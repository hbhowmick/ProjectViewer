$(document).ready(function () {
  searchedProject = false;
  theCurrentProject = false;
  townsSql = "Town";
  rtaSql = "RTA";
  distSql = "Highway District";
  polySql = "1=1";
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/MapImageLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/core/watchUtils",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/geometry/Polygon",
    "esri/tasks/Locator",
    "esri/widgets/Search",
    "esri/widgets/Expand",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/views/layers/support/FeatureFilter",
    "esri/Graphic",
    "https://unpkg.com/mapillary-js@1.7.1/dist/mapillary-js.min.js",
    // "https://unpkg.com/mapillary-js@2.20.0/dist/mapillary.min.js",
    // "dojo/domReady!"
  ], function (Map, MapView, MapImageLayer, QueryTask, Query, watchUtils, FeatureLayer, GraphicsLayer, Polygon, Locator, Search, Expand, Legend, Home, FeatureFilter, Graphic, Mapillary) {
    var spatialFilter = false;
    var sql = "1=1"
    var projectSearchID = false;
    var projID = "";
    var extentForRegionOfInterest = false;
    var highlight;
    var polySymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      style: "none",
      outline: { // autocasts as new SimpleLineSymbol()
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    };

    var map = new Map({
      basemap: "gray-vector",
    });

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


    //The following feature layers represent the projects and their locations
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

    projectLocationsLines = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1",
      outFields: ["Project_Description", "ProjectID", "OBJECTID"],
      visible: true,
      title: "Linear Projects",
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction
      }
    });

    projectLocationsMBTA = new FeatureLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter"],
      popupTemplate: {
        title: "MBTA Route: {MBTA_Location}",
        content: popupFunctionMbtaAsset
      }
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

    projectLocationsPolygons2 = new MapImageLayer({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer",
      sublayers: [{
        id: 4,
        opacity: 0.3,
        popupEnabled: true,
        popupTemplate: {
          title: "{Location_Type} - {Location}",
          content: "<p id='popupFeatureSelected' class='polyList' modeType='{Location}' val='{Location}'><button class='btn btn-info'>View projects in this {Location_Type}</button><br>"
          + "<p id='popupFeatureSelectedStatewide' class='polyList' modeType='Statewide' val='{Location}'><button class='btn btn-info'>View statewide projects</button>"
        }
      }]
    });

    $(document).on("click", ".polyList", function (e) {
        existingFeatures = view.popup.features;
        selectedIndex = view.popup.selectedFeatureIndex;
        addPolyPopups($(this).attr('modeType'), $(this));
      });

    $(document).on("click", ".projList", function (e) {
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
        features: popupFeatures, // array of graphics
        featureMenuOpen: true,
        highlightEnabled: true // selected features initially display in a list
      });
    });

    function addPolyPopups(value, id) {
      polyProjects = [];
      var query = new Query({
        outFields: ["*"],
        where: "(Location_Source = '" + value + "') AND " + sql
      });
      queryProjectTask.execute(query).then(function (result) {
        if (result.features.length > 0) {
          var table = ""
          $(result.features).each(function () {
            thisProject = "<p> <button class='btn info projList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
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
          $(id).html("No " + value + "projects currently match your search criteria.");
        }
      });
    };

    //This function creates the content for the popups for the project location layers
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
    };

    //This function creates the content for the popups for the MBTA lines
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
            thisProject = "<p> <button class='btn info projList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
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
          return "<p id='popupFeatureSelected' class='projList line' modeType='line' val='" + target.graphic.attributes.MBTA_Location + "'>" + line
          + "<p id='popupFeatureSelected' class='projList mode' modeType='mode' val='System'>" + mode
          + "<p id='popupFeatureSelected' class='projList system' modeType='system' val='System'>" + mbta;
        } else {
          return "<p id='popupFeatureSelected' class='projList' val=''>No projects currently match your search criteria";
        }

      });
    };

    map.addMany([projectLocationsPolygons2, projectLocationsLines, projectLocationsPoints, projectLocationsMBTA]);


    statewidePolygon = new Polygon({
      rings: [
        [ // first ring
          [-73, 41],
          [-73, 43],
          [-70.5, 43],
          [-70.5, 41] // same as first vertex
        ]
      ],
      spatialReference: {
        wkid: 4326
      }
    });

    var view = new MapView({
      map: map,
      // scale: 1155581.108577,
      zoom: 9,
      center: [-71.8, 42],
      container: "viewDiv",
      spatialReference: {
        wkid: 3857
      },
      highlightOptions: {
        color: [0, 255, 255],
        fillOpacity: 0.5
      }
    });
    view.goTo(statewidePolygon);

    // Example: Listen to the click event on the view
    view.watch("updating", function (event) {
      if (event == false && scaleChanged == true) {}
    });

    var scaleChanged;
    // Divides the view.scale three times
    view.watch("scale", function (newValue, oldValue) {});

    view.whenLayerView(projectLocationsLines)
    .then(function (layerView) {
      prjLocationLines = layerView
      prjLocationLines.watch("updating", function (val) {
        if (val == false) {
          hideLoad = true;
          $('#loading').modal('hide')
        }
      });
    })
    .catch(function (error) {});

    view.whenLayerView(projectLocationsPoints)
    .then(function (layerView) {
      prjLocationPoints = layerView
    })
    .catch(function (error) {});

    view.whenLayerView(projectLocationsMBTA)
    .then(function (layerView) {
      mbtaLines = layerView
    })
    .catch(function (error) {});

    projectLocationsPolygons2.when(function () {
      prjLocationPolygons = projectLocationsPolygons2.findSublayerById(4);
    })


    var searchWidget = new Search({
      view: view,
      // allPlaceholder: "Search location or project (ex. Red-Blue Connector)",
      // locationEnabled: false,
      // popupEnabled: true,
      // container: "searchPlace",
      // includeDefaultSources: false,
      // sources: [{
      //   locator: new Locator({
      //     url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
      //   }),
      //   singleLineFieldName: "SingleLine",
      //   outFields: ["Addr_type"],
      //   name: "Address Search"
      // }]
    });

    var homeBtn = new Home({
      view: view,
    });

    var legend = new Expand({
      content: new Legend({
        view: view,
        style: "classic",
        layerInfos: [{
          layer: projectLocationsLines,
          title: "Linear Projects",
        }, {
          layer: projectLocationsPoints,
          title: "Point Projects",
        }, {
          layer: projectLocationsPolygons,
          title: "Project Areas"
        }],
      }),
      view: view,
      // expanded: true
    });

    view.ui.add([{
      component: homeBtn,
      position: "top-left",
      index: 1
    }, {
      component: searchWidget,
      position: "top-left",
      index: 0
    }, {
      component: legend,
      position: "top-right",
      index: 1
    }]);

    popupSelected = new Graphic({
      symbol: polySymbol
    });

    statewideSelected = new Graphic({
      symbol: polySymbol,
      //geometry: statewidePolygon
    });

    watchUtils.watch(view.popup, "selectedFeature", function (feature) {
      $('.project_comment_success').hide()
      $('.project_comment_failure').hide()
      $('#helpContents').show();
      $('#interactive').hide();
      if (feature) {
        theCurrentProject = feature.attributes;
        if (highlight && feature.attributes.HighlightRemove !== "false") {
          highlight.remove();
        }
        $("#projectSearch").val("");
        if (feature.attributes.ProjectID) {
          projID = feature.attributes.ProjectID;
        }

        if (feature.attributes.Location_Type == "Town" || feature.attributes.Location_Type == "RTA" || feature.attributes.Location_Type == "Highway District" || feature.attributes.Location_Type == "Statewide") {
          popupSelected.geometry = feature.geometry;
          view.graphics.add(popupSelected);
        } else {
          popupSelected.geometry = null;
          view.graphics.remove(popupSelected);
        }
      } else if (highlight) {
        highlight.remove();
        popupSelected.geometry = null;
        view.graphics.remove(popupSelected);
      } else {
        popupSelected.geometry = null;
        view.graphics.remove(popupSelected);
      }
    });

    view.popup.on("trigger-action", function (event) {
      if (event.action.id === "back") {
        view.popup.open({
          features: existingFeatures,
        });
        view.popup.selectedFeatureIndex = selectedIndex;
      }
    });

    queryProjectTask = new QueryTask({
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6"
    });

    //These are periphery layers used for added functionality, including spatial querying and commenting
    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });
    mpoLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0",
    });
    var townQuery = townLayer.createQuery();
    var mpoQuery = mpoLayer.createQuery();

    //The following event handlers listen for changes in the filter form inputs
    $("#townSelect").change(function () {
      $("#mpoSelect").val("");
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
            queryFilter = new FeatureFilter({
              where: sql,
              geometry: extentForRegionOfInterest,
              spatialRelationship: "intersects"
            });
            prjLocationLines.filter = queryFilter
            prjLocationPoints.filter = queryFilter
            view.goTo(extentForRegionOfInterest);
          });
      } else {
        spatialFilter = false;
        applyFeatureViewFilters();
        view.goTo(statewidePolygon);
      }
    });

    $("#mpoSelect").change(function () {
      $("#townSelect").val("");
      $("#programs").val("All");
      var selectedMPO = $(this).children("option:selected").val();
      if (selectedMPO != "All") {
        $('#loading').modal('show')
        hideLoad = false;
        mpoQuery.where = "MPO like '%" + selectedMPO + "%'";
        mpoQuery.returnGeometry = true;
        mpoQuery.outFields = ["MPO"];
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
          });
      } else {
        spatialFilter = false;
        applyFeatureViewFilters();
        view.goTo(statewidePolygon);
      }
    });

    $("#programs").change(function () {
      $("#townSelect").val("0");
      $("#mpoSelect").val("All");
      view.goTo(statewidePolygon);
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

    $(".filter").change(function (e) {
      if (e.target.id === "townPrjs") {
        console.log("DO NOT APPLY FEATURE VIEW FILTER")
      } else {
        applyFeatureViewFilters();
      }
    });

    $(".town-filter").change(function (e) {
      // if (e.target.id === "townPrjs") {
      //   console.log("DO NOT APPLY FEATURE VIEW FILTER")
      // } else {
        applyFeatureViewFilters();
      // }
    });

    $(".geomCheck").change(function (e) {
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

    var hideLoad = false;
    $('#loading').on('shown.bs.modal', function (e) {
      if (hideLoad == true) {
        $('#loading').modal('hide')
      }
    })


    //This function applies FeatureFilters to the layers in the map
    function applyFeatureViewFilters() {
      //--------------------------Refresh & Empty-----------------------------//
      // listModal.style.display = "none";
      //listSubheader.style.display = "none";
      // $('#projectList-header').empty();
      $('#projectList-subheader').empty();
      // $('#projectList-content').empty();
      view.popup.close();
      view.graphics.removeAll();
      var headerName = 'All';
      var subHeaderName = '';
      var divisionFilter = $("#division").val();
      var townFilter = $("#townSelect").val();
      var mpoFilter = $("#mpoSelect").val();
      var programFilter = String($("#programs").val());

      //---------------------------Clear SQL Statement------------------------//
      sql = "1=1"
      divisionsSQL = "(1=1)";
      programsSQL = "(1=1)";

      //--------------------------Create Headers------------------------------//
      if (divisionFilter !== "All") {
        divisionsSQL = "Division = '" + divisionFilter + "'";
        headerName = divisionFilter;
      };
      if (programFilter == 'All') {
      } else if (programFilter !== '') {
        programsSQL = "Program = '" + programFilter + "'";
        var splitProgramName = programFilter.split(" | ");
        headerName = splitProgramName[0].toUpperCase();
        subHeaderName = splitProgramName[1].toUpperCase()
        listSubheader.style.display = "block";
        $('#projectList-subheader').html(subHeaderName.toUpperCase());
      };
      // $(programFilter).each(function () {
      //   // console.log(this);
      //   if (this == programFilter) {
      //     programsSQL = "Program = '" + this + "'";
      //   } else {
      //     programsSQL = programsSQL + " OR Program = " + this;
      //   }
      // });
      if (townFilter !== '0' && townFilter !== null) {
        townFilter = dict_townID[townFilter]["town"];
        headerName = townFilter + " " + headerName;
      };
      if (mpoFilter !== 'All' && mpoFilter !== null) {
        headerName = mpoFilter + " " +  headerName;
      };
      $('#projectList-header').html(headerName.toUpperCase() + ' PROJECTS');
      //----------------------------Create & Display Content----------------------------//
      sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( Total  >= " + parseFloat($("#minCost").val().replace(/,/g, '')) + " AND Total <= " + parseFloat($("#maxCost").val().replace(/,/g, '')) + ")"

      var sqlURL = sql.replace(/ /g, "+");
      sqlURL = sqlURL.replace(/'/g, '%27');
      sqlURL = sqlURL.replace(/"/g, '%27');
      sqlURL = sqlURL.replace(/</g, '%3C');
      sqlURL = sqlURL.replace(/=/g, '%3D');
      sqlURL = sqlURL.replace(/>/g, '%3E');
      // console.log(sqlURL);

      var getLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query?where=" +
      sqlURL +
      "&outFields=*&f=pjson";
      // console.log(getLink);

      $.get(getLink, function (data) {
        var listContent = $("#projectList-content");
        listContent.empty();
        projects = JSON.parse(data);
        // console.log(projects2);
        $(projects.features).each(function () {
          var projDesc = this.attributes.Project_Description;
          var projDiv = this.attributes.Division;
          projID = this.attributes.ProjectID;
          var location = this.attributes.Location;
          var textResult = projDesc.concat(" (").concat(location).concat(")");
          // console.log(textResult);
          listContent.append(
            $("<option class='listItem'></option>").val(this.attributes.Division).html(textResult).attr('id', projID)
          );
        });
      })
      .done(function (data) {
        //console.log(listContent);
        // $('#projectList-header').html(headerName.toUpperCase() + ' PROJECTS');
        // $('#projectList-subheader').html(subHeaderName.toUpperCase());
        listModal.style.display = "block";
      });

      //
      // console.log("\nDivision: \t\t" + divisionFilter);
      // console.log("Town: \t\t\t" + townFilter);
      // console.log("MPO: \t\t\t" + mpoFilter);
      // console.log("CIP Program: \t" + programFilter);
      // // console.log("Header: \t" + headerName + " Projects");
      // // console.log("Subheader: \t" + subHeaderName);
      // console.log(sql);
    };
























    // prjLocationPolygons.definitionExpression = polySql;
    // if ($("#division").val() == "All") {
    //   mbtaLines.visible = true;
    //   prjLocationPolygons.visible = true;
    // } else if ($("#division").val() == "MBTA") {
    //   mbtaLines.visible = true;
    //   prjLocationPolygons.visible = false;
    // } else if ($("#division").val() == "Transit") {
    //   mbtaLines.visible = true;
    //   prjLocationPolygons.visible = true;
    //   prjLocationPolygons.definitionExpression = "Location_Type = 'RTA'";
    // } else {
    //   mbtaLines.visible = false;
    //   prjLocationPolygons.visible = true;
    // }
    // if (spatialFilter === true && projectSearchID == false) {
    //   $('#loading').modal('show')
    //   hideLoad = false;
    //   queryFilter = new FeatureFilter({
    //     where: sql,
    //     geometry: extentForRegionOfInterest,
    //     spatialRelationship: "intersects"
    //   });
    // } else if (projectSearchID !== false) {
    //   queryFilter = new FeatureFilter({
    //     where: "ProjectID = '" + projectSearchID + "'",
    //   });
    // } else {
    //   queryFilter = new FeatureFilter({
    //     where: sql,
    //   });
    // }
    // prjLocationLines.filter = queryFilter
    // prjLocationPoints.filter = queryFilter































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
            location: statewidePolygon.extent.center,
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
        console.log(popupSelected, view.popup);
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



    //Function for hovering over project ID in list and highlighting project on map
    view.when(function() {
      console.log(map.layers)
      var projectLayer = map.layers.getItemAt(1);
      console.log(projectLayer)

      view.whenLayerView(projectLayer).then(function(layerView) {
        var queryProjects = projectLayer.createQuery();

        $(document).on("click", ".listItem", function(e){
          $('.listItem').removeClass('selected');
          $(this).addClass('selected');
          var projectName = this.innerText;
          var projectID = this.id;
          console.log(projectID);
          queryProjects.where = "ProjectID='" + projectID + "'";

          projectLayer.queryFeatures(queryProjects).then(function(result) {
            var feature = result.features[0];
            console.log(result.features);
            featureLat = Number(feature.geometry["latitude"].toFixed(6));
            featureLong = Number(feature.geometry["longitude"].toFixed(6));
            console.log(featureLong, featureLat);

            view.goTo(
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
            mySelect_Project.append(
              '<p><b>Project ID: </b>' + projectID + '</p>' +
              '<p><b>Location: </b>' + projectLoc + '</p>' +
              '<p><b>MassDOT Division: </b>' + projectDiv + '</p>' +
              '<p><b>Program: </b>' + projectProg + '</p>' +
              '<p><b>Priority: </b>' + projectPrior + '</p>' +
              '<p><b>Total Cost: </b>' + projectCost + '</p>'
              );



              $.get("https://a.mapillary.com/v3/images", {
                  client_id: 'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
                  closeto: [featureLong,featureLat],
                  per_page: 100,
                  radius: 10000,
                })
                .done(function (data) {

                var features = [];
                features = data.features;
                var lat = features[0].geometry.coordinates[1];
                var long = features[0].geometry.coordinates[0];
                var mKey = String(features[0].properties.key);
                var mlyCombined;
                mlyCombined = {};
                mlyCombined = new Mapillary.Viewer(
                  'mly',
                  'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
                  mKey,
                  // {cover: false},
                  // {
                  //   component: {
                  //     cover: false,
                  //     sequence: {
                  //       visible: false
                  //     },
                  //   }
                  // }
                );
              });


          });
        });








      });
    });




  }); // end required function
}); // end document ready
