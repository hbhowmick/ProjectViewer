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
