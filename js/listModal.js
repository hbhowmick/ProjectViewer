var listModal = document.getElementById("listModal");

// var listBtn = document.getElementById("listBtn");
// listBtn.onclick = function() {
  //   console.log("clicked list");
  //   listModal.style.display = "block";
  // }

var closeList = document.getElementsByClassName("closeList")[0];

//To close modal, either click X in top right or anywhere else in window
closeList.onclick = function() {
  listModal.style.display = "none";
}


var list = "";
document.getElementById('projectList-content').innerHTML = list;
