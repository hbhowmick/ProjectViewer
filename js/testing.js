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
