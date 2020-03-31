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
          var divisionSelect = $('#division');
          $(divisions.features).each(function () {
            divisionSelect.append(
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
          var mpoSelect = $('#mpoSelect');
          $(mpos.features).each(function () {
            mpoSelect.append(
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
          var townsSelect = $('#townSelect');
          $(towns.features).each(function () {
            townsSelect.append(
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
					var rtasSelect = $('#rtaSelect');
					$(rtas.features).each(function () {
						rtasSelect.append(
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
							var districtsSelect = $('#distSelect');
							$(districts.features).each(function () {
								districtsSelect.append(
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
          var programSelector = $('#programs');
          $(programs.features).each(function () {
            programList.push(this.attributes.Program);
            programSelector.append(
              $('<option></option>').val(this.attributes.Program).html(this.attributes.Program).attr("division", this.attributes.Division)
            );
          });
          getPrograms();
        });

		  function getPrograms() {
				$("#programs").val("");
		    $("#programs option").filter(function () {
		      $(this).toggle($(this).attr("division") == $('#division').val() || $(this).attr("division") == "All");
		    });
		  };

			$("#division").change(function () {
				getPrograms();
			});

			$("#cost-range").slider({
				range: true,
				min: 0,
				max: 5000000000,
				values: [0, 5000000000],
				slide: function (event, ui) {
					$("#minCost").val(numeral(ui.values[0]).format('0,0[.]00'));
					$("#maxCost").val(numeral(ui.values[1]).format('0,0[.]00'));
				}
			});
			minValue = numeral($("#minCost").val()).value();
			maxValue = numeral($("#maxCost").val()).value();
			if (minValue > maxValue) {
				maxValue = minValue
			};
			$("#minCost").val(numeral(minValue).format('0,0[.]00'));
			$("#maxCost").val(numeral(maxValue).format('0,0[.]00'));
			$("#cost-range").slider("values", [minValue, maxValue]);
		})

    .fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
    });

		$("#closeList-btn").click(function() {
      $("#listModal").css("display", "none");
			$("#closeList-btn").css("display", "none");
			$("#reopenList-btn").css("display", "inline-block");
      if($("#projectModal").css("display") == "block") {
        $("#viewDiv").css("height", "58%");
        $("#projectModal").css("height", "35%");
      }
    })

		$("#reopenList-btn").click(function() {
			$("#listModal").css("display", "block");
			$("#closeList-btn").css("display", "inline-block");
			$("#reopenList-btn").css("display", "none");
		})

		$("#closePopup-btn").click(function() {
		  $("#projectModal").css("display", "none");
			$("#closePopup-btn").css("display", "none");
		  $("#viewDiv").css("height", "82%");
			$("#reopenPopup-btn").css("display", "block");
			$("#reopenPopup-btn").css("height", "25px");
		})

		$("#reopenPopup-btn").click(function() {
			$("#projectModal").css("display", "block");
			$("#viewDiv").css("height", "58%");
			$("#projectModal").css("height", "35%");
			$("#closePopup-btn").css("display", "block");
			$("#reopenPopup-btn").css("display", "none");
		})

		$('.mapillary').hide();
		$('.tw-toggle').click(function(){
		  $('.gm_streetview, .mapillary').toggle();
		});

		$("#aboutBtn").click(function() {
			$("#aboutModal").css("display", "block")
		})

});
