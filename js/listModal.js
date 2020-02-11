var listModal = document.getElementById("listModal");
var listHeader = document.getElementById("projectList-header");
var listSubheader = document.getElementById("projectList-subheader");
var listContent = document.getElementById("projectList-content");

var closeList = document.getElementsByClassName("closeList-btn")[0];

closeList.onclick = function() {
  listModal.style.display = "none";
}

var list = "";
document.getElementById('projectList-content').innerHTML = list;
