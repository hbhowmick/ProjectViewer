var projectModal = document.getElementById("projectModal");

var projectBtn = document.getElementById("projectBtn");

var closeProject = document.getElementsByClassName("closeProject")[0];

// To re-open modal, click the About button in the top right
// projectBtn.onclick = function() {
//   projectModal.style.display = "block";
// }

closeProject.onclick = function() {
  projectModal.style.display = "none";
}

$('.mapillary').hide();
$('.tw-toggle').click(function(){
  $('.gm_streetview, .mapillary').toggle();
});


function initialize() { //Google Streetview
  var latlong = {lat: 42.352525, lng: -71.066218};
  var gm_map = new google.maps.Map(document.getElementById('gm_map'), {
    center: latlong,
    zoom: 14
  });

  var panorama = new google.maps.StreetViewPanorama(
    document.getElementById('pano'), {
      position: latlong,
      pov: {
        heading: 34,
        pitch: 10
      }
    }
  );
  gm_map.setStreetView(panorama);
}
