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


view.whenLayerView(projectLocationsMBTA)
.then(function(layerView) {
  view.on("pointer-move", eventHandler);
  function eventHandler(event) {
    view.hitTest(event).then(getGraphics);
  };
  let highlight, hoverLayerTitle, hoverProjectID, hoverMBTAline;
  function getGraphics(response) {
    // console.log(response)
    if (response.results.length) {

      const graphic = response.results.filter(function(result) {
        return result.graphic.layer === layer;
      })[0].graphic;
      const attributes = graphic.attributes;
      const attLayerTitle = graphic.layer.title;

      if(graphic.layer.title.includes('MBTA')) {
        const attMBTAline = attributes.MBTA_Location;
        const attDivision = "MBTA";


        if (highlight && hoverMBTAline !== attMBTAline) {
          console.log("a different line is already highlighted")
          highlight.remove();
          highlight = null;
          return;
        }

        if (highlight) {
          console.log("same MBTA line")
          return;
        }

        const query = layerView.createQuery();
        query.where = "MBTA_Location LIKE '%" + attMBTAline + "%'";
        layerView.queryObjectIds(query).then(function(ids) {
          if (highlight) {
            highlight.remove();
          }
          highlight = layerView.highlight(ids);
          hoverMBTAline = attMBTAline;
          hoverLayerTitle = attLayerTitle;
        });
      } else {

        const attProjectID = attributes.ProjectID;
        const attDivision = attributes.Division;
        const attLocation = attributes.Location;
        const attLayerTitle = graphic.layer.title;

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
          hoverLayerTitle = attLayerTitle;
        });
      }
    } else {
       highlight.remove();
       highlight = null;
    };
  };
})










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








//
// function popupFunctionList(attributes) {
//   console.log(attributes)
//
//   if (attributes.Division == "Highway") {
//     link = "<a href='https://hwy.massdot.state.ma.us/projectinfo/projectinfo.asp?num=" + attributes.ProjectID + "' target=blank id='pinfoLink' class='popup-link' style='color: blue'>Additional Project Information.</a>"
//   } else if (attributes.Division == "MBTA") {
//     link = "<a href='https://www.mbta.com/projects' target=blank id='pinfoLink' class='popup-link'>Learn more about MBTA capital projects and programs.</a>"
//   } else {
//     link = ""
//   }
//   return "<p id='popupFeatureSelected' val='" + attributes.ProjectID + "'>" + link + "</br>MassDOT Division: " + attributes.Division + "</br> Location: " + attributes.Location + "</br> Program: " + attributes.Program + "</br> Total Cost: " + numeral(attributes.Total).format('$0,0[.]00') + "</p> This project was programmed by the <b>" + attributes.Division + "</b> within the <b>" + attributes.Program + "</b> CIP Program. It is located in <b>" + attributes.Location + "</b> and has a total cost of <b>" + numeral(attributes.Total).format('$0,0[.]00') + "</b>."
//
// };
