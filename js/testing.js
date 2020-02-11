// if (val == false) {
//   console.log("Done loading")
// } else {
//   console.log("LOADING LINES...")
// }
// if (filterStart == true) {
//   console.log("FILTERING...")
// } else {
//   console.log("**")
// }




// if ($("#townSelect").val() > 0) {
//   townQuery = townLayer.createQuery();
//   townQuery.where = "TOWN_ID = " + $("#townSelect").val();
//   townQuery.returnGeometry = true;
//   townQuery.outFields = ["TOWN_ID", "TOWN"];
//   townQuery.outSpatialReference = view.spatialReference;
//   townLayer.geometryPrecision = 0;
//   townLayer.queryFeatures(townQuery)
//     .then(function (response) {
//       var townName = response.features[0].attributes.TOWN;
//
//
//       console.log(sql)
//       $.getJSON("config/urls.json")
//       .done(function (json) {
//         url = json.urls;
//         $.post(url.project_table + "/query", {
//           where: sql,
//           outFields: ["*"],
//           returnGeometry: true,
//           orderByFields: 'Project_Description',
//           returnDistinctValues: true,
//           f: 'pjson'
//         })
//         .done(function (data) {
//           var returnedList = $.parseJSON(data);
//           console.log(returnedList.features);
//           var featuresCounted = 0;
//           var checkLength = returnedList.features.length;
//           console.log("MBTA Projects\n", checkLength);
//           $(returnedList.features).each(function () {
//             var projDesc = this.attributes.Project_Description;
//             var projDiv = this.attributes.Division;
//             projID = this.attributes.ProjectID;
//             var location = this.attributes.Location;
//             var textResult = projDesc.concat(" (").concat(location).concat(")");
//             listContent.append(
//               $("<option class='listItem'></option>").val(this.attributes.Division).html(textResult).attr('id', projID)
//             );
//             featuresCounted++;
//           });
//           // if (projArr !== lastProjArr) {
//             totalProj = totalProj + checkLength;
//           // }
//           // if(featuresCounted === checkLength){
//             //   listModal.style.display = "block";
//             // }
//           });
//         })
//   })
// }


// view.when(function() {
  // view.whenLayerView(projectLocations).then(function(layerView) {
    // $("option").mouseenter(function(){
    //   console.log("HOVER");
    // })
    // $("option").hover(function(){
    //   console.log("HOVER");
    // })
    // $(".listItem").mouseenter(function(e){
    //   console.log("HOVER", e.type);
    // })
    $(".listModal").on("mouseenter", ".listItem", function(e){
      console.log("HOVER");
      var listProjectID = this.id;
      console.log(listProjectID);
    })
    // $(".listModal").on("click", ".listItem", function(e){
    //   console.log("CLICK");
    // })
  // })
// });



    $(".filter").change(function(e){
      console.log("A filter changed...");
      // listModal.style.display = "none";
      linesCounted = false;
      pointsCounted = false;
      mbtaCounted = false;
      totalProj = 0;
      lastProjArr = [];
      listContent.empty();
      filterStart = true;
      mbtaProjectString = "";
      view.graphics.removeAll();


      if (e.target.id === "townPrjs") {
        console.log("Do Not Apply feature view filter") //The reason for only checking the town checkbox and not RTA/Distrct, is that only towns show up in the map. RTA/District projects get displayed via the town popup.
      // } else if ($("#townSelect").val() == "0" || $("#mpoSelect").val() == "All") {
      } else {
        $('#loading').modal('show')
        applyFeatureViewFilters();
      }










      // costVal();

    });

    $("#townSelect").change(function () {
      console.log("town changed");
      townID = $("#townSelect").val();
      $("#mpoSelect").val("")
      townVal(townID);
    })

    $("#mpoSelect").change(function() {
      console.log("mpo changed");
      selectedMPO = $(this).children("option:selected").val()
      $("#townSelect").val("TEST");
      mpoVal(selectedMPO);
    })





    function townVal(townID) {
      if (townID > 0) {
        // $("#mpoSelect").val("All");
        townQuery = townLayer.createQuery();
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
          townName = response.features[0].attributes.TOWN;

          queryFilter = new FeatureFilter({
            where: sql,
            geometry: extentForRegionOfInterest,
            spatialRelationship: "intersects"
          });
          prjLocationLines.filter = queryFilter
          prjLocationPoints.filter = queryFilter
          console.log("Town selection:", townName);

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
            }
          });
          view.graphics.add(townGraphic);
        });
      } else {
        spatialFilter = false;
        console.log("All");
        applyFeatureViewFilters();
        view.goTo(stateExtent);
      }
    };

    function mpoVal(selectedMPO) {
      if (selectedMPO !== "All" && selectedMPO !== '') {
        // $("#townSelect").val("All");
        mpoQuery = mpoLayer.createQuery();
        $('#loading').modal('show')
        hideLoad = false;
        mpoQuery.where = "Location like '%" + selectedMPO + "%' and Location_Type = 'MPO'";
        mpoQuery.returnGeometry = true;
        mpoQuery.outFields = ["Location"];
        mpoQuery.outSpatialReference = view.spatialReference;
        mpoQuery.returnExtentOnly = true;
        mpoQuery.geometryPrecision = 0;
        mpoLayer.queryFeatures(mpoQuery)
        .then(function (response) {
          spatialFilter = true;
          extentForRegionOfInterest = response.features[0].geometry;
          mpoName = response.features[0].attributes.Location;

          queryFilter = new FeatureFilter({
            where: sql,
            geometry: extentForRegionOfInterest,
            spatialRelationship: "intersects"
          });
          prjLocationLines.filter = queryFilter
          prjLocationPoints.filter = queryFilter
          console.log("MPO selection:", mpoName);

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
            }
          });
          view.graphics.add(mpoGraphic);
        });
      } else {
        spatialFilter = false;
        console.log("All");
        applyFeatureViewFilters();
        view.goTo(stateExtent);
      }

    };

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

    function costVal() {
      minValue = numeral($("#minCost").val()).value();
      maxValue = numeral($("#maxCost").val()).value();
      if (minValue > maxValue) {
        maxValue = minValue
      };
      $("#minCost").val(numeral(minValue).format('0,0[.]00'));
      $("#maxCost").val(numeral(maxValue).format('0,0[.]00'));
      $("#cost-range").slider("values", [minValue, maxValue]);
      applyFeatureViewFilters();
    }



//----------spatialQuery-----------//
function spatialQuery(layer) {
  var query = layer.createQuery();
  query.geometry = extentForRegionOfInterest;
  query.spatialRelationship = "intersects";
  query.returnGeometry = true;
  query.outFields = ["Division", "Program", "Project_Description", "ProjectID", "Location"];

  view.whenLayerView(layer)
  .then(function (layerView) {
    flv = layerView
  })


  flv.queryFeatures(query)
  .then(function(response){

    // console.log(response);
    // var listContent = $("#projectList-content");
    // listContent.empty();
    response.features.forEach(function(feature){
      // console.log(response.features);
      var projDesc = feature.attributes.Project_Description;
      var projDiv = feature.attributes.Division;
      projID = feature.attributes.ProjectID;
      var location = feature.attributes.Location;
      var textResult = projDesc.concat(" (").concat(location).concat(")");
      // console.log(textResult);
      listContent.append(
        $("<option class='listItem'></option>").val(projDiv).html(textResult).attr('id', projID)
      );
    });
  });
};


function applyListFilters() {
  if ($("#townSelect").val() !== "0" && $("#townSelect").val() !== "All") {
    townSQL = "(Location = '" + townName + "' OR Location_Source = '" + townName + "')";
  } else if ($("#mpoSelect").val() !== "" && $("#mpoSelect").val() !== "All") {
    mpoSQL = "(Location like '%" + selectedMPO + "%' and Location_Type = 'MPO')"
  }
  $.getJSON("config/urls.json")
  .done(function (json) {
    url = json.urls;
    $.post(url.project_table + "/query", {
      where: sql + " AND " + townSQL + " AND " + mpoSQL,
      outFields: ["*"],
      returnGeometry: true,
      orderByFields: 'Project_Description',
      returnDistinctValues: true,
      f: 'pjson'
    })
    .done(function (data) {
      var returnedList = $.parseJSON(data);
      // console.log(returnedList.features);
      // var listContent = $("#projectList-content");
      // listContent.empty();
      var featuresCounted = 0;
      var checkLength = returnedList.features.length;
      // console.log(checkLength);
      $(returnedList.features).each(function () {
        var projDesc = this.attributes.Project_Description;
        var projDiv = this.attributes.Division;
        projID = this.attributes.ProjectID;
        var location = this.attributes.Location;
        var textResult = projDesc.concat(" (").concat(location).concat(")");
        listContent.append(
          $("<option class='listItem'></option>").val(this.attributes.Division).html(textResult).attr('id', projID)
        );
        featuresCounted++;
      });
      if(featuresCounted === checkLength){
        listModal.style.display = "block";
      }
    });
  })
};






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
