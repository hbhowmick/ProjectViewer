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
