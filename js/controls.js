$(document).ready(function () {
	$.getJSON("config/urls.json")
		.done(function (json) {
      url = json.urls;
			$.post(url.project_table + "/query", {
        where: "1=1",
        outFields: "Division",
        returnGeometry: false,
        orderByFields: 'Division',
        returnDistinctValues: true,
        f: 'pjson'
      })
      .done(function (data) {
        var divisions = $.parseJSON(data);
        $(divisions.features).each(function () {
          $('#divisionSelect').append(
            $('<option></option>').val(this.attributes.Division).html(this.attributes.Division)
          );
        });
      });

			$.post(url.MPOs + "/query", {
        where: "1=1",
        outFields: "MPO",
        returnGeometry: false,
        orderByFields: 'MPO',
        f: 'pjson'
      })
      .done(function (data) {
        var mpos = $.parseJSON(data);
        $(mpos.features).each(function () {
          $('#mpoSelect').append(
            $('<option></option>').val(this.attributes.MPO).html(this.attributes.MPO)
          );
        });
      });

			$.post(url.Towns + "/query", {
        where: "1=1",
        outFields: "TOWN, TOWN_ID",
        returnGeometry: false,
        orderByFields: 'TOWN_ID',
        f: 'pjson'
      })
      .done(function (data) {
        var towns = $.parseJSON(data);
        $(towns.features).each(function () {
          $('#townSelect').append(
            $('<option></option>').val(this.attributes.TOWN).html(this.attributes.TOWN)
          );
        });
      });

			$.post(url.RTAs + "/query", {
				where: "1=1",
				outFields: "RTA, RTA_NAME",
				returnGeometry: false,
				orderByFields: 'RTA',
				f: 'pjson'
			})
			.done(function (data) {
				var rtas = $.parseJSON(data);
				$(rtas.features).each(function () {
					$('#rtaSelect').append(
						$('<option></option>').val(this.attributes.RTA_NAME).html(this.attributes.RTA.concat(" (", this.attributes.RTA_NAME, ")"))
					);
				});
			});

			$.post(url.Districts + "/query", {
				where: "1=1",
				outFields: "DistrictName",
				returnGeometry: false,
				orderByFields: 'DistrictName',
				f: 'pjson'
			})
			.done(function (data) {
				var districts = $.parseJSON(data);
				$(districts.features).each(function () {
					$('#districtSelect').append(
						$('<option></option>').val(this.attributes.DistrictName).html(this.attributes.DistrictName)
					);
				});
			});

			programList = [];

			$.post(url.project_table + "/query", {
        where: "1=1",
        outFields: "Division, Program",
        returnGeometry: false,
        orderByFields: 'Program',
        returnDistinctValues: true,
        f: 'pjson'
      })
      .done(function (data) {
        var programs = $.parseJSON(data);
        $(programs.features).each(function () {
          programList.push(this.attributes.Program);
          $('#programSelect').append(
            $('<option></option>').val(this.attributes.Program).html(this.attributes.Program).attr("division", this.attributes.Division)
          );
        });
        getPrograms();
      });

		  function getPrograms() {
				$("#programSelect").val("");
		    $("#programSelect option").filter(function () {
		      $(this).toggle(
						$(this).attr("division") == $('#divisionSelect').val() || $(this).attr("division") == "All");
		    });
		  };

			$("#divisionSelect").change(function () {
				getPrograms();
			});
		})

    .fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
    });

		$("#closeList-btn").click(function() {
      $("#listModal").css("display", "none");
			$("#closeList-btn").css("display", "none");
			$("#reopenList-btn").css("display", "inline-block");
      if($("#projectModal").css("display") == "block") {
        $("#viewDiv").css("height", "59%");
        $("#projectModal").css("height", "37%");
      }
    });

		$("#reopenList-btn").click(function() {
			$("#listModal").css("display", "block");
			$("#closeList-btn").css("display", "inline-block");
			$("#reopenList-btn").css("display", "none");
		});

		$("#closePopup-btn").click(function() {
		  $("#projectModal").css("display", "none");
			$("#closePopup-btn").css("display", "none");
		  $("#viewDiv").css("height", "96%");
			$("#reopenPopup-btn").css("display", "block");
			$("#reopenPopup-btn").css("height", "4%");
		});

		$("#reopenPopup-btn").click(function() {
			$("#projectModal").css("display", "block");
			$("#viewDiv").css("height", "59%");
			$("#projectModal").css("height", "37%");
			$("#closePopup-btn").css("display", "block");
			$("#reopenPopup-btn").css("display", "none");
		});

		$("#helpContent").on("click", "button", function() {
			$("#helpModal").css('display', 'none');
		});

		$("#helpBtn").on("click", function() {
			$("#helpModal").css('display', 'block');
		});

});
