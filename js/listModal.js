var listModal = document.getElementById("listModal");
var listHeader = document.getElementById("projectList-header");
var listSubheader = document.getElementById("projectList-subheader");
var listContent = document.getElementById("projectList-content");

var closeList = document.getElementsByClassName("closeList")[0];

//To close modal, either click X in top right or anywhere else in window
closeList.onclick = function() {
  listModal.style.display = "none";
}


var list = "";
document.getElementById('projectList-content').innerHTML = list;
