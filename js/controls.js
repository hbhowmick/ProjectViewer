$(document).ready(function () {

	searchedProject = false;

  // function googleTranslateElementInit() {
  //   new google.translate.TranslateElement({
  //       pageLanguage: 'en',
	// 			layout: google.translate.TranslateElement.InlineLayout.SIMPLE
  //     },
  //     'google_translate_element'
  //   );
  // }

  $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/Projects/FeatureServer/6/query", {
      where: "1=1",
      outFields: "Division",
      returnGeometry: false,
      orderByFields: 'Division',
      returnDistinctValues: true,
      f: 'pjson'
    })
    .done(function (data) {
      var divisions = $.parseJSON(data);
      var divisionSelect = $('#division');
      $(divisions.features).each(function () {
        divisionSelect.append(
          $('<option></option>').val(this.attributes.Division).html(this.attributes.Division)
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

  programList = [];

  $.post("https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query", {
      where: "1=1",
      outFields: "Division, Program",
      returnGeometry: false,
      orderByFields: 'Program',
      returnDistinctValues: true,
      f: 'pjson'
    })
    .done(function (data) {
      var programs = $.parseJSON(data);
      var programSelector = $('#programs');
      $(programs.features).each(function () {
        programList.push(this.attributes.Program);
        programSelector.append(
          $('<option></option>').val(this.attributes.Program).html(this.attributes.Program).attr("division", this.attributes.Division)
        );
      });

    });








		// $.get("https://a.mapillary.com/v3/images?client_id=cWVha0Q3dzFvTTlSQWFBR09jZnJsUTpjOTU2ZWVjNDA4ODAxZjFj&closeto=-71.266218,42.352525&per_page=1", function (data) {
		// 	var features = [];
		// 	features = data.features;
		// 	var lat = features[0].geometry.coordinates[1];
		// 	var long = features[0].geometry.coordinates[0];
		// 	console.log(lat, long);
		//
		// 	var key = features[0].properties.key;
		// 	console.log(key);
		// });


















  function getPrograms() {
    $("#programs option").filter(function () {
      $(this).toggle($(this).attr("division") == $('#division').val() || $(this).attr("division") == "All");
    });
  }


  $("#division").change(function () {
    getPrograms();
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


});
