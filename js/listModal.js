$(".closeList-btn").click(function() {
  $("#listModal").css("display", "none");
  if($("#projectModal").css("display") == "block") {
    $("#viewDiv").css("height", "58%");
    $("#projectModal").css("height", "35%");
  }
})

// document.getElementById('projectList-content').innerHTML = "";
