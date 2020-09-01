//The following is the cost slider. It is used to configure the input and do something when the value is changed
  $("#cost-range").slider({
    range: true,
    min: 0,
    max: 5000000000,
    values: [0, 5000000000],
    slide: function (event, ui) {
      $("#minCost").val(numeral(ui.values[0]).format('0,0[.]00'));
      $("#maxCost").val(numeral(ui.values[1]).format('0,0[.]00'));
      applyFeatureViewFilters();
    }
  });

  function costVal() {
    minValue = numeral($("#minCost").val()).value();
    maxValue = numeral($("#maxCost").val()).value();
    if (minValue > maxValue) {
      maxValue = minValue
    };
    $("#minCost").val(numeral(minValue).format('0,0[.]00'));
    $("#maxCost").val(numeral(maxValue).format('0,0[.]00'));
    $("#cost-range").slider("values", [minValue, maxValue]);
    applyFeatureViewFilters();
  }
