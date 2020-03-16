$(".closeProject-btn").click(function() {
  $("#projectModal").css("display", "none");
  $("#viewDiv").css("height", "95%");
})



$('.mapillary').hide();
$('.tw-toggle').click(function(){
  $('.gm_streetview, .mapillary').toggle();
});
