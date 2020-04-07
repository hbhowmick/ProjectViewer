//This function creates the content for the popups for MBTA lines
function popupFunctionMbtaAsset(target) {
  $(".line").remove();
  $(".mode").remove();
  $(".system").remove();
  thisFeatureTarget = target;
  // console.log(target)
  lineProjects = [];
  modeProjects = [];
  systemProjects = [];
  if(sqlQuery){
    sqlQuery = sqlQuery;
  } else {
    sqlQuery = "(1=1)";
  }
  var query = new Query({
    outFields: ["*"],
    where: "(MBTA_Location like '%" + target.graphic.attributes.MBTA_Location + "%' or MBTA_Location = '" + target.graphic.attributes.route_desc + "' or MBTA_Location = 'System') AND " + sqlQuery
  });
  return queryProjectTask.execute(query).then(function (result) {
    if (result.features.length > 0) {
      var table = "";
      $(result.features).each(function () {
        thisProject = "<p><button class='btn info tProjList' id=" + this.attributes.ProjectID + ">" + this.attributes.Project_Description + " (" + this.attributes.ProjectID + ")</button></p>";
        table = table.concat(thisProject);
        var thisProject = new Graphic({
          geometry: view.popup.selectedFeature.geometry,
          // geometry: thisFeatureTarget.graphic.geometry,
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

        // $("#popupDock").children(".esri-feature__size-container").css("background-color", "blue");
        $("#popupDock").find(".esri-feature__main-container").html("TEST");

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
      return "<p id='popupFeatureSelected' class='tProjList line' modeType='line' val='" + target.graphic.attributes.MBTA_Location + "'>" + line + "<p id='popupFeatureSelected' class='tProjList mode' modeType='mode' val='System'>" + mode + "<p id='popupFeatureSelected' class='tProjList system' modeType='system' val='System'>" + mbta;
    } else {
      return "<p id='popupFeatureSelected' class='tProjList' val=''>No projects currently match your search criteria</p>";
    }

  });
}
