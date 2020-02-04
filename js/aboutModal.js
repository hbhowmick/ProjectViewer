var aboutModal = document.getElementById("aboutModal");

var aboutBtn = document.getElementById("aboutBtn");

var span = document.getElementsByClassName("close")[0];

//To re-open modal, click the About button in the top right
aboutBtn.onclick = function() {
  aboutModal.style.display = "block";
}

//To close modal, either click X in top right or anywhere else in window
span.onclick = function() {
  aboutModal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == aboutModal) {
    aboutModal.style.display = "none";
  }
}
