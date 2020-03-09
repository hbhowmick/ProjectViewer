function popupFunction(feature) {
  console.log(feature);
  let highlight;
  highlight && highlight.remove();
  // highlight = layerView.highlight(feature.graphic);

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


// view.watch("popup.featureCount", function (val) {
//   console.log(val)
// });
//
// // view.when().then(function() {
// view.whenLayerView(projectLocations).then(function(layerView) {
//   // Create a default graphic for when the application starts
//   const selectedFeatureGraphic = {
//     popupTemplate: {
//       content: "click ...",
//     }
//   };
//
//   // Provide graphic to a new instance of a Feature widget
//   const feature = new Feature({
//     container: "popupDock",
//     graphic: selectedFeatureGraphic,
//     map: view.map,
//     spatialReference: view.spatialReference,
//   });
//
//   // view.on("click", function(event) {
//   //   view.hitTest(event).then(function(event) {
//   //     console.log(event);
//   //     var currentPopupFeatures = view.popup.features;
//   //     console.log(currentPopupFeatures)
//   //     // for (i=0; i<event.results.length; i++) {
//   //     //   console.log(event.results[i].graphic.layer.title)
//   //     // }
//   //
//   //     // for(j=0; j<view.popup.featureCount; j++){
//   //     // for (result of currentPopupFeatures) {
//   //     //   feature.graphic = result.graphic;
//   //     //   feature.graphic.popupTemplate = result.graphic.popupTemplate
//   //     // }
//   //     // }
//   //   })
//   // });
//   // view.whenLayerView(projectLocationsPoints).then(function(layerView) {
//   //   let highlight;
//   //   // listen for the pointer-move event on the View
//   //   view.on("click", function(event) {
//   //     // Perform a hitTest on the View
//   //     view.hitTest(event).then(function(event) {
//   //       // console.log(event)
//   //       // Make sure graphic has a popupTemplate
//   //       let results = event.results.filter(function(result) {
//   //         return result.graphic.layer.popupTemplate;
//   //       });
//   //       // console.log(results);
//   //       let result = results[0];
//   //       highlight && highlight.remove();
//   //       // Update the graphic of the Feature widget
//   //       // on pointer-move with the result
//   //       if (result) {
//   //         feature.graphic = result.graphic;
//   //         feature.graphic.popupTemplate = result.graphic.popupTemplate;
//   //         highlight = layerView.highlight(result.graphic);
//   //       } else {
//   //         feature.graphic = graphic;
//   //       }
//   //
//   //
//   //
//   //
//   //
//   //     });
//   //
//   //     // console.log(event)
//   //     // view.hitTest(event).then(popupFunction);
//   //
//   //   });
//   // });
//   });








// view.when().then(function() {
//   // Create a default graphic for when the application starts
//   const selectedFeatureGraphic = {
//     popupTemplate: {
//       content: "Click feature to show details...",
//     }
//   };
//
//   // Provide graphic to a new instance of a Feature widget
//   const feature = new Feature({
//     container: "popupDock",
//     graphic: selectedFeatureGraphic,
//     // graphic: view.popup.features,
//     map: view.map,
//     spatialReference: view.spatialReference,
//     // defaultPopupTemplateEnabled: true,
//   });
//
//   // view.on("click", function(event) {
//   //   view.popup.open({
//   //     features: popupFeatures,
//   //     // featureMenuOpen: true,
//   //     // highlightEnabled: true
//   //   })
//   // });
//   //
//   // view.on("click", function(e) {
//   //   // console.log(view.popup.features);
//   //   view.popup.features.when(function() {
//   //     console.log('done')
//   //   })
//   //
//   //   console.log(view.popup.featureCount);
//   //   console.log(view.popup.selectedFeature);
//   //
//   //   // view.popup.features.when().then(function() {
//   //   //
//   //   //   console.log(view.popup.featureCount);
//   //   //   console.log(view.popup.selectedFeature);
//   //   // })
//   //   // view.popup.next();
//   //   // view.popup.on("trigger-action", function(e) {
//   //   //   console.log(e);
//   //   //   console.log(view.popup.features);
//   //   // })
//   // })
//
//
//   // view.whenLayerView(projectLocations).then(function(layerView) {
//   //   let highlight;
//   //   // listen for the pointer-move event on the View
//   //   view.on("click", function(event) {
//   //     // console.log(view.popup.features)
//   //     // Perform a hitTest on the View
//   //     view.hitTest(event).then(function(event) {
//   //       // Make sure graphic has a popupTemplate
//   //       // console.log(event.results);
//   //       // console.log(event.results.length);
//   //       // for(i=0; i<event.results.length; i++) {
//   //       //   console.log(event.results[i].graphic.layer.title);
//   //       //   console.log(event.results[i])
//   //       //   feature.graphic = event.results[i].graphic;
//   //       //   feature.graphic.popupTemplate = event.results[i].graphic.popupTemplate;
//   //       // }
//   //
//   //       let results = event.results.filter(function(result) {
//   //         return result.graphic.layer.popupTemplate;
//   //       });
//   //       // console.log(results);
//   //       // if (results.length > 0) {
//   //       //   for (i=0; i<results.length; i++){
//   //       //     console.log(results[i])
//   //       //   }
//   //       // }
//   //       let result = results[0];
//   //       highlight && highlight.remove();
//   //       // Update the graphic of the Feature widget
//   //       // on pointer-move with the result
//   //       if (result) {
//   //         feature.graphic = result.graphic;
//   //         feature.graphic.popupTemplate = result.graphic.popupTemplate;
//   //
//   //         highlight = layerView.highlight(result.graphic);
//   //       } else {
//   //         feature.graphic = graphic;
//   //       }
//   //     });
//   //   });
//   // });
//   //
//   // view.whenLayerView(projectLocationsPoints).then(function(layerView) {
//   //   let highlight;
//   //   // listen for the pointer-move event on the View
//   //   view.on("click", function(event) {
//   //     // Perform a hitTest on the View
//   //     view.hitTest(event).then(function(event) {
//   //       // console.log(event)
//   //       // Make sure graphic has a popupTemplate
//   //       let results = event.results.filter(function(result) {
//   //         return result.graphic.layer.popupTemplate;
//   //       });
//   //       // console.log(results);
//   //       let result = results[0];
//   //       highlight && highlight.remove();
//   //       // Update the graphic of the Feature widget
//   //       // on pointer-move with the result
//   //       if (result) {
//   //         feature.graphic = result.graphic;
//   //         feature.graphic.popupTemplate = result.graphic.popupTemplate;
//   //         highlight = layerView.highlight(result.graphic);
//   //       } else {
//   //         feature.graphic = graphic;
//   //       }
//   //
//   //
//   //
//   //
//   //
//   //     });
//   //
//   //     // console.log(event)
//   //     // view.hitTest(event).then(popupFunction);
//   //
//   //   });
//   // });
//
// });
