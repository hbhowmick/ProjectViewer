var listModal = document.getElementById("listModal");

// var listBtn = document.getElementById("listBtn");

var closeList = document.getElementsByClassName("closeList")[0];

//To re-open modal, click the About button in the top right
// listBtn.onclick = function() {
//   listModal.style.display = "block";
// }

//To close modal, either click X in top right or anywhere else in window
closeList.onclick = function() {
  listModal.style.display = "none";
}


var list = "";
document.getElementById('projectList-content').innerHTML = list;

$(document).ready(function(){
  $("select.filter").change(function(){
    listModal.style.display = "block";
    var mySelect = $('#projectList-content').empty();
    var str = $(this).children("option:selected").val(this.attributes.Program)[0].innerText;
    var programSelect = str.replace(/ /g, "+");
    programSelect = str.replace(/&/g, "%26");
    // console.log(programSelect);
    var getLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1/query?where=Program%3D%27" +
    programSelect +
    "%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=pjson";


    $.get(getLink, function (data) {
      var programs = JSON.parse(data);
      mySelect = $('#projectList-content');
      $(programs.features).each(function () {
        var projDesc = this.attributes.Project_Description;
        var location = this.attributes.Location;
        var textResult = projDesc.concat(" (").concat(location).concat(")");
        // console.log(textResult);
        mySelect.append(
          // $('<a href="" class="listItem"></a><br><br>').val(textResult).html(textResult)
          $('<div class="listItem"><a href=""></a></div><br>').val(textResult).html(textResult)
        );
      });
    });

  });

});
