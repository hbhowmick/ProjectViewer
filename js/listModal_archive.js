var listModal = document.getElementById("listModal");

// var listBtn = document.getElementById("listBtn");
// listBtn.onclick = function() {
  //   console.log("clicked list");
  //   listModal.style.display = "block";
  // }

var closeList = document.getElementsByClassName("closeList")[0];

//To close modal, either click X in top right or anywhere else in window
closeList.onclick = function() {
  listModal.style.display = "none";
}


var list = "";
document.getElementById('projectList-content').innerHTML = list;


$("select.form-control").change(function(){
  console.log('here');

});




$("select.form-control").change(function(){ // begin Side Panel event listener
  listModal.style.display = "none";
  $('#projectList-header').empty();
  $('#projectList-subheader').empty();
  var mySelect_List = $('#projectList-content').empty();
  listModal.style.display = "block";
  // console.log($(this).attr('id'));
  var str = $(this).children("option:selected").val();
  console.log(str);
  var select = '';
  select = str.replace(/ /g, "+");
  select = select.replace(/&/g, "%26");
  var splitProgramSelect = [];
  town = '';
  if (select=="All") {
    select = "1%3D1";
    splitProgramSelect.push(str);
  } else {
    // ***********if Division, Town, or MPO dropdown***********
    if ($(this).attr('id') == 'division') {
      select = "Division%3D%27" + select + "%27"
      splitProgramSelect.push(str);
    } else if ($(this).attr('id') == 'townSelect') {
      town = dict_townID[str]['town'];
      console.log(town);
      splitProgramSelect.push(town);
      select = "Location%3D%27" + town + "%27"
    } else if ($(this).attr('id') == 'mpoSelect') {
      // select = "Location%3D%27" + select + "%27"
      // splitProgramSelect.push(str);









      // ***********if CIP program***********
    } else if ($(this).attr('id') == 'programs') {
      str = $(this).children("option:selected").val(this.attributes.Program)[0].innerText;
      select = str.replace(/ /g, "+");
      select = select.replace(/&/g, "%26");

      if (select !="All") {
        splitProgramSelect = str.split(" | ");
        header = splitProgramSelect[0]
        subheader = splitProgramSelect[1];
        select = "Program%3D%27" + select + "%27"
      }

      // ***********if uncheck checkboxes***********




      // ***********if Cost range***********
    } else {
      console.log('no');
    }


  }






    var getLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query?where=" +
    select +
    "&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=pjson";
    // console.log(getLink);

    $.get(getLink, function (data) {
      var projects = JSON.parse(data);
      mySelect_List = $('#projectList-content');
      // console.log(splitProgramSelect);

      $(projects.features).each(function () {
        // $('#projectList-header').empty();
        // $('#projectList-subheader').empty();
        var projDesc = this.attributes.Project_Description;
        // console.log(projDesc);
        // console.log(town.toUpperCase());
        if(projDesc.includes(town.toUpperCase())) {
          removeStr = town.toUpperCase() + "- ";
          projDesc = projDesc.replace(removeStr,'');
        };
        // console.log(projDesc);
        var projDiv = this.attributes.Division;
        var projID = this.attributes.ProjectID;
        var location = this.attributes.Location;
        var textResult = projDesc.concat(" (").concat(location).concat(")");
        if(splitProgramSelect.length>1){
          $('#projectList-header').html(projDiv.toUpperCase());
          $('#projectList-subheader').html(subheader.toUpperCase() + ' PROJECTS');
        } else {
          $('#projectList-header').html(splitProgramSelect[0].toUpperCase() + ' PROJECTS');
        }
        mySelect_List.append(
          $('<div class="listItem"></div>').val(textResult).html(textResult).attr('id', projID)
        );
      });
    });


}); // end Side Panel event listener
