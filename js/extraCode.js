x = {
  aInternal: 10,
  aListener: function(val) {},
  set a(val) {
    this.aInternal = val;
    this.aListener(val);
  },
  get a() {
    return this.aInternal;
  },
  registerListener: function(listener) {
    this.aListener = listener;
  }
}

x.registerListener(function(val) {
  alert("Someone changed the value of x.a to " + val);
});

x.a = 42;
//-----------------------------------------------------


function replacePopupGraphic() {
  console.log("mapResultObject:", mapResultObject)
  console.log("listResultObject:", listResultObject)
  console.log("popupIndex:", popupIndex)
  console.log(clickItemID, clickLocation, clickItemLocSource)

  $("#popupDock").removeClass("mbtaPopup")
  $(".tProjList").remove()

  var result = mapResultObject[popupIndex]
  if(result.graphic.geometry.type === "point") {
    console.log("point")
    popupLat = result.graphic.geometry.latitude
    popupLong = result.graphic.geometry.longitude
  } else if (result.graphic.geometry.type === "polyline"){
    console.log("line")
    popupLat = result.graphic.geometry.extent.center.latitude
    popupLong = result.graphic.geometry.extent.center.longitude
  } else {
    console.log(result.graphic.geometry.type, "need to return lat/long from graphic")
  }

  if(result.graphic.attributes.MBTA_Location) {
    popupProjID = result.graphic.attributes.MBTA_Location
  } else {
    popupProjID = result.graphic.attributes.ProjectID
  }

  popupIMG = "Current Project</br>ID: ".concat(popupProjID).concat("</br>Latitude: ").concat(popupLat).concat("</br>Longitude: ").concat(popupLong)
  $("#currentProj").html(popupIMG)


  if (result.graphic.attributes.MBTA_Location) {
    $("#popupDock").addClass("mbtaPopup")
  }

  if (result) {
    popupFeature.graphic = result.graphic
  } else {
    console.log('else')
    popupFeature.graphic = graphic
  }
}








popupString = "<h4 id='popupTitle'>".concat(attributes.Project_Description).concat(" (").concat(attributes.ProjectID).concat(")</h4>").concat("<p id='popupFeatureSelected'>").concat(link).concat("MassDOT Division: ").concat(attributes.Division).concat("</br> Location: ").concat(attributes.Location).concat("</br> Program: ").concat(attributes.Program).concat("</br> Total Cost: ").concat(numeral(attributes.Total).format('$0,0[.]00')).concat("</br></br>This project was programmed by the <b>").concat(attributes.Division).concat("</b> within the <b>").concat(attributes.Program ).concat("</b> CIP Program. It is located in <b>").concat(attributes.Location).concat("</b> and has a total cost of <b>").concat(numeral(attributes.Total).format('$0,0[.]00')).concat("</b>.</p>")

$("#popupFunc").html(popupString)
$("#popupFeatureSelected").attr('val', attributes.ProjectID)











results = event.results.filter(function(result) {
  return result.graphic.layer.popupTemplate
})









var Obj = {
  result: 0,
  addNumber: function(a, b) {
    this.result = a + b;
    return this;
  },

  multiplyNumber: function(a, b) {
    this.result = a * b;
    return this;
  },

  divideNumber: function(a, b) {
    this.result = a / b;
    return this;
  }
}

Obj.addNumber(10, 20).multiplyNumber(Obj.result,10).divideNumber(Obj.result, 10);
alert(Obj.result);


function

getGraph(projectLocations)
.then(res =>
  view.whenLayerView(res)
  .then(function (layerView) {
    var queryFilter = new FeatureFilter({
      where: "ProjectID = '606522'",
    })
    layerView.filter = queryFilter;
  })
)




view.whenLayerView(projectLocations)
.then(function (layerView) {
  var queryFilter = new FeatureFilter({
    where: "1=1",
  })
  layerView.filter = queryFilter;
})





//   var graphic = new Graphic({
//   geometry: result.features[0].geometry,
//   attributes: result.features[0].attributes,
//   symbol: {
//     type: "simple-marker",
//     color: [226, 119, 40],
//   },
//   popupTemplate: {
//     // title: "TEST",
//     content: popupFunction,
//     actions: [{
//       id: "back",
//       title: "Go back",
//       className: "esri-icon-undo"
//     }]
//   }
// })
