$(document).ready(function () {
  $.get("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=Program&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=true&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson", function (data) {
    var programs = JSON.parse(data);
    var mySelect = $('#programs');
    $(programs.features).each(function () {
      mySelect.append(
        $('<option></option>').val(this.attributes.Program).html(this.attributes.Program)
      );
    });

  });

	
  $.post("https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/MPOs/MapServer/0/query", {
      where: "1=1",
      outFields: "MPO",
      returnGeometry: false,
      orderByFields: 'MPO',
      f: 'pjson'
    })
    .done(function (data) {
      var mpos = $.parseJSON(data);
      var mpoSelect = $('#mpoSelect');
      $(mpos.features).each(function () {
        mpoSelect.append(
          $('<option></option>').val(this.attributes.MPO).html(this.attributes.MPO)
        );
      });

    });
	
	
  $("#projectSearch").autocomplete({
    source: function (request, response) {
      $.ajax({
        type: "POST",
        dataType: "json",
        url: "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/Projects/FeatureServer/6/query",
        data: {
          where: "Project_Description like '%" + request.term + "%' OR ProjectID like '%" + request.term + "%'",
          outFields: "Project_Description, ProjectID",
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
            return rObj;
          });
          response(searchSuggestions);
          $(".ui-autocomplete").css({
            'width': ($("#projectSearch").width() + 'px')
          });
        }
      });
    },
    minLength: 2,
    select: function (event, ui) {
      console.log("Selected: " + ui.item.value + " aka " + ui.item.id);
      searchedProject = ui.item.id;
		//showProject(ui.item.id);

      //SHOW PROJECT WITH ID = ui.item.id
    }
  });
	

  $.post("https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0/query", {
      where: "1=1",
      outFields: "TOWN, TOWN_ID",
      returnGeometry: false,
	    orderByFields: 'TOWN_ID',
      f: 'pjson'
    })
    .done(function (data) {
      var towns = $.parseJSON(data);
      var townsSelect = $('#townSelect');
      $(towns.features).each(function () {
        townsSelect.append(
          $('<option></option>').val(this.attributes.TOWN_ID).html(this.attributes.TOWN)
        );
      });

    });
});
