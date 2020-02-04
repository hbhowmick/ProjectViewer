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

    //-------------------------------Variables--------------------------------//
    var spatialFilter = false;
    var sql = "1=1";
    var projectSearchID = false;
    var projID = "";
    var extentForRegionOfInterest = false;
    var highlight;
    var hideLoad = false;
    var scaleChanged;
    var polySymbol = {
      type: "simple-fill",
      style: "none",
      outline: {
        color: [255, 255, 0, 1],
        width: "2.5px"
      }
    };
    var divSelect = document.getElementById("division");
    var townSelect = document.getElementById("townSelect");
    var mpoSelect = document.getElementById("mpoSelect");
    var progSelect = document.getElementById("programs");

    var map = new Map({
      basemap: "gray-vector",
    });
    projectList = new FeatureLayer({//table
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6",
      outFields: ["*"],
      visible: true,
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description}",
        content: popupFunction
      }
    });
    projectLocationsPoints = new FeatureLayer({//Points
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
    projectLocationsLines = new FeatureLayer({//Lines
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1",
      // outFields: ["Project_Description", "ProjectID", "OBJECTID"],
      outFields: ["*"],
      visible: true,
      title: "Linear Projects",
      popupEnabled: true,
      popupTemplate: {
        title: "{Project_Description} - ({ProjectID})",
        content: popupFunction
      }
    });
    projectLocationsMBTA = new FeatureLayer({//Lines
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/7",
      outFields: ["MBTA_Location", "route_desc", "route_long_name", "Location_Filter"],
      popupTemplate: {
        title: "MBTA Route: {MBTA_Location}",
        content: popupFunctionMbtaAsset
      }
    });
    projectLocationsPolygons = new FeatureLayer({//Polygons
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
    projectLocationsPolygons2 = new MapImageLayer({//Polygons
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
    townLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0",
    });
    mpoLayer = new FeatureLayer({
      url: "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0",
    });
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

    var resultsLayer = new GraphicsLayer();

    popupSelected = new Graphic({
      symbol: polySymbol
    });
    statewideSelected = new Graphic({
      symbol: polySymbol,
      geometry: statewidePolygon
    });

    queryProjectTask = new QueryTask({//query the table
      url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/FeatureServer/6"
    });

    var townQuery = townLayer.createQuery();
    var mpoQuery = mpoLayer.createQuery();

    map.addMany([
      projectLocationsPolygons2,
      projectLocationsLines,
      projectLocationsPoints,
      projectLocationsMBTA,
      resultsLayer
    ]);

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
        // color: [0, 255, 255],
        // fillOpacity: 0.5,
        color: "orange"
      }
    });
    view.goTo(statewidePolygon);

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
    });


    //--------------------------------Widgets---------------------------------//
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


    //------------------------------Filtering---------------------------------//

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

      function openPolyPopup(popupSelected) {
        // console.log(popupSelected, view.popup);
        view.graphics.add(popupSelected);
        view.popup.open({
          location: popupSelected.geometry.extent.center,
          features: [popupSelected],
          highlightEnabled: true
        });
      }
    });

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
            console.log("sql", sql),
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

            //filter listing of projects
            // console.log(response.features[0]);
            return response.features[0];
            applyFeatureViewFilters();


          })
          // .then(setDefinitionExpression)
          // .then(createGraphic)
          // .then(queryProjects)
          // .then(displayResults)
      } else {
        spatialFilter = false;
        applyFeatureViewFilters();
        view.goTo(statewidePolygon);
      }
    });







    function applyFeatureViewFilters() {
      view.popup.close();
      view.graphics.removeAll();

      var programFilter = String($("#programs").val());

      sql = "1=1"
      divisionsSQL = "(1=1)";
      programsSQL = "(1=1)";

      if ($("#division").val() !== "All") {
        divisionsSQL = "Division = '" + $("#division").val() + "'";
      };
      if (programFilter == 'All') {
      } else if (programFilter !== '') {
        // console.log(programFilter);
        programsSQL = "Program = '" + programFilter + "'";
      };

      sql = sql + " AND (" + divisionsSQL + ") AND (" + programsSQL + ") AND ( Total  >= " + parseFloat($("#minCost").val().replace(/,/g, '')) + " AND Total <= " + parseFloat($("#maxCost").val().replace(/,/g, '')) + ")"

      prjLocationPolygons.definitionExpression = polySql;
      if ($("#division").val() == "All") {
        mbtaLines.visible = true;
        prjLocationPolygons.visible = true;
      } else if ($("#division").val() == "MBTA") {
        mbtaLines.visible = true;
        prjLocationPolygons.visible = false;
      } else if ($("#division").val() == "Transit") {
        mbtaLines.visible = true;
        prjLocationPolygons.visible = true;
        prjLocationPolygons.definitionExpression = "Location_Type = 'RTA'";
      } else {
        mbtaLines.visible = false;
        prjLocationPolygons.visible = true;
      }
      if (spatialFilter === true && projectSearchID == false) {
        $('#loading').modal('show')
        hideLoad = false;
        queryFilter = new FeatureFilter({
          where: sql,
          geometry: extentForRegionOfInterest,
          spatialRelationship: "intersects"
        });
      } else if (projectSearchID !== false) {
        queryFilter = new FeatureFilter({
          where: "ProjectID = '" + projectSearchID + "'",
        });
      } else {
        queryFilter = new FeatureFilter({
          where: sql,
        });
      }
      prjLocationLines.filter = queryFilter
      prjLocationPoints.filter = queryFilter
      applyListFilters(sql);
    };

    function applyListFilters(sql) {
      var sqlURL = sql.replace(/ /g, "+");
      sqlURL = sqlURL.replace(/'/g, '%27');
      sqlURL = sqlURL.replace(/"/g, '%27');
      sqlURL = sqlURL.replace(/</g, '%3C');
      sqlURL = sqlURL.replace(/=/g, '%3D');
      sqlURL = sqlURL.replace(/>/g, '%3E');
      // console.log(sqlURL);

      if ($("#townSelect").val() > 0) {
        townQuery.where = "TOWN_ID = " + $("#townSelect").val();
        townQuery.returnGeometry = true;
        townQuery.outFields = ["TOWN_ID", "TOWN"];
        townQuery.outSpatialReference = view.spatialReference;
        townLayer.geometryPrecision = 0;
        townLayer.queryFeatures(townQuery)
        .then(function (response) {
          spatialFilter = true;
          extentForRegionOfInterest = response.features[0].geometry;
          queryFilter = new FeatureFilter({
            where: sql,
            geometry: extentForRegionOfInterest,
            spatialRelationship: "intersects"
          });
        })

      // } else if ($("#mpoSelect").val() !== "All" && $("#mpoSelect").val() !== "") {

      }










      var getLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query?where=" +
      sqlURL +
      "&outFields=*&f=pjson";
      // console.log(getLink);
      $.get(getLink, function (data) {
        count = 0;
        var listContent = $("#projectList-content");
        listContent.empty();
        projects = JSON.parse(data);
        $(projects.features).each(function () {
          // count += 1;
          var projDesc = this.attributes.Project_Description;
          var projDiv = this.attributes.Division;
          projID = this.attributes.ProjectID;
          var location = this.attributes.Location;
          var textResult = projDesc.concat(" (").concat(location).concat(")");

          listContent.append(
            $("<option class='listItem'></option>").val(this.attributes.Division).html(textResult).attr('id', projID)
          );
        });


      })
      .done(function (data) {
        listModal.style.display = "block";
      });
    };







    function setDefinitionExpression(newValue) {
      var townName = newValue.attributes.TOWN;
      townLayer.definitionExpression = "TOWN = '" + townName + "'";
      // console.log("townLayer DefExp: ", townLayer.definitionExpression);
      if (!townLayer.visible) {
        townLayer.visible = true;
      }
      return queryForGeometries();
    }

    function queryForGeometries() {
      var townsQuery = townLayer.createQuery();
      // console.log("query for Town Geometries: ", townsQuery);
      return townLayer.queryFeatures(townsQuery).then(function(response) {
        townsGeometries = response.features.map(function(feature) {
          console.log("town geometry: ", feature, feature.geometry);
          return feature.geometry;
        });
        console.log("townsGeometries: ", townsGeometries);
        return townsGeometries;
      });
    }


    var townGraphic = null;
    var mpoGraphic = null;

    function createGraphic(){
      if (townGraphic) {
        townGraphic.geometry = townsGeometries[0]
      } else {
        townGraphic = new Graphic({
          geometry: townsGeometries[0],
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
      }
    }




    function queryProjects() {
      var query = projectLocationsLines.createQuery();
      // query.where = "Division = '" + projectSelect.value + "'";

      console.log("here")
      query.geometry = townsGeometries[0];
      query.spatialRelationship = "intersects";

      return projectLocationsLines.queryFeatures(query);
    }



    function displayResults(results) {
      resultsLayer.removeAll();
      var features = results.features.map(function(graphic) {
        graphic.symbol = {
          type: "simple-line",
          color: [226, 119, 40],
          width: 4
        };
        return graphic;
      });
      var numProjects = features.length;
      document.getElementById("numItems").innerHTML = numProjects;
      resultsLayer.addMany(features);
    }


























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

    $('#loading').on('shown.bs.modal', function (e) {
      if (hideLoad == true) {
        $('#loading').modal('hide')
      }
    })



    //-------------------------------Popups-----------------------------------//
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
        };

        return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'>" + link + "</br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + numeral(attributes.Total).format('$0,0[.]00') + "</p> This project was programmed by the <b>" + attributes.Division + "</b> within the <b>" + attributes.Program + "</b> CIP Program. It is located in <b>" + attributes.Location + "</b> and has a total cost of <b>" + numeral(attributes.Total).format('$0,0[.]00') + "</b>."
      });
    };

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

    watchUtils.watch(view.popup, "selectedFeature", function (feature) { //when user is clicking through multiple popups, or if new feature is clicked, or click off features.....
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

    view.popup.on("trigger-action", function (event) { // listening for buttons to be clicked within popup
      if (event.action.id === "back") { //kind of saves featureList from original click (i.e. driving 1 of 4...)
        view.popup.open({
          features: existingFeatures,
        });
        view.popup.selectedFeatureIndex = selectedIndex;
      }
    });


    //----------------------------Project Specific----------------------------//

    //----------Hover-----------//
    view.when().then(function() {
      return projectLocationsLines.when();
    })
    .then(function(layer) {
      return view.whenLayerView(layer);
    })
    .then(function(layerView) {
      view.on("pointer-move", eventHandler);

      function eventHandler(event) {
        view.hitTest(event).then(getGraphics);
      };

      let highlight, hoverProjectID;

      function getGraphics(response) {
        if (response.results.length) {
          const graphic = response.results.filter(function(result) {
            return result.graphic.layer === projectLocationsLines;
          })[0].graphic;

          const attributes = graphic.attributes;
          const attProjectID = attributes.ProjectID;
          const attDivision = attributes.Division;
          const attLocation = attributes.Location;

          if (highlight && hoverProjectID !== attProjectID) {
            highlight.remove();
            highlight = null;
            return;
          }

          if (highlight) {
            return;
          }

          const query = layerView.createQuery();
          query.where = "ProjectID = '" + attProjectID + "'";
          layerView.queryObjectIds(query).then(function(ids) {
            if (highlight) {
              highlight.remove();
            }
            highlight = layerView.highlight(ids);
            hoverProjectID = attProjectID;
          });
        } else {
          highlight.remove();
          highlight = null;
        }
      };

    });

    //----------Click-----------//
    view.when(function() {
      var projectLayer = map.layers.getItemAt(1);
      // console.log(map.layers.getItemAt(1));
      view.whenLayerView(projectLayer).then(function(layerView) {

        var queryProjects = projectLayer.createQuery();
        $(document).on("click", ".listItem", function(e){
          $('.listItem').removeClass('selected');
          $(this).addClass('selected');
          var listProjectName = this.innerText;
          var listProjectID = this.id;
          console.log(listProjectID);
          queryProjects.where = "ProjectID='" + listProjectID + "'";

          map.layers.getItemAt(1).queryFeatures(queryProjects).then(function(result) {
          // projectLayer.queryFeatures(queryProjects).then(function(result) { ////****************
            console.log(result);
            var feature = result.features[0];
            featureLat = Number(feature.geometry["latitude"].toFixed(6));
            featureLong = Number(feature.geometry["longitude"].toFixed(6));
            // console.log(featureLong, featureLat);
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
            $("#projectModal").display() = "block";
            var listItemAtts= result.features[0].attributes;
            var listItemDesc = listItemAtts["Project_Description"];
            $('#projTitle').html(listItemDesc);
            var listItemDiv = listItemAtts["Division"];
            var listItemProg = listItemAtts["Program"].split(' | ')[1];
            var listItemLoc = listItemAtts["Location"];
            var listItemPrior = listItemAtts["Priority"];
            var listItemCost = numeral(listItemAtts["TotalCost"]).format('$0,0[.]00');
            var mySelect_Project = $('#projDesc').empty();
            mySelect_Project.append(
              '<p><b>Project ID: </b>' + projectID + '</p>' +
              '<p><b>Location: </b>' + listItemLoc + '</p>' +
              '<p><b>MassDOT Division: </b>' + listItemDiv + '</p>' +
              '<p><b>Program: </b>' + listItemProg + '</p>' +
              '<p><b>Priority: </b>' + listItemPrior + '</p>' +
              '<p><b>Total Cost: </b>' + listItemCost + '</p>'
            );

            //-------APIs--------//
            $.get("https://a.mapillary.com/v3/images", {
              client_id: 'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
              closeto: [featureLong,featureLat],
              per_page: 100,
              radius: 10000,
            })
            .done(function (data) {
              var featuresMapAPI = [];
              featuresMapAPI = data.features;
              var latMapAPI = featuresMapAPI[0].geometry.coordinates[1];
              var longMapAPI = featuresMapAPI[0].geometry.coordinates[0];
              // console.log(longMapAPI, latMapAPI);
              var keyMapAPI = String(featuresMapAPI[0].properties.key);
              // console.log(keyMapAPI);
              var mlyCombined;
              mlyCombined = {};
              mlyCombined = new Mapillary.Viewer(
                'mly',
                'cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj',
                keyMapAPI,
              )
            });
          });
        });
      })
    });



  }); // end required function
}); // end document ready
