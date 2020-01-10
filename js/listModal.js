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


var dictFilters = {};
var dictFiltersURL = {};
var selected = 'All';
var selectedURL = '';
var lastSelected = ''; // do i still need this?
var where = '';
var headers = [];
var outfields = []; //not sure I need this?





//---------------------------------------------------------
$("select.form-control").change(function(){
  listModal.style.display = "none";
  $('#projectList-header').empty();
  $('#projectList-subheader').empty();
  $('#projectList-content').empty();
  var dropdown = $(this).attr('id');
  selected = $(this).children("option:selected").val();
  if (dropdown=='townSelect') {
    selected = dict_townID[selected]['town'];
  }
  dictFilters[dropdown]=selected;
  if (dropdown=='mpoSelect') {
    delete dictFilters[dropdown];
  }
  // console.log(dictFilters);
  // console.log(selected);
  selectedURL = selected.replace(/ /g, "+");
  selectedURL = selectedURL.replace(/&/g, "%26");
  // console.log(selectedURL);

  dictFiltersURL[dropdown]=selectedURL;

  if (selected == 'All' || selected == '0') {
    removeFilter(dictFiltersURL, dropdown);
  } else {
    updateFilter(dictFiltersURL, dropdown);
  }
  listModal.style.display = "block";
  console.log(queryLink);
});
//---------------------------------------------------------

function updateFilter(dict, dropdown) {
  // console.log(dictFilters);
  // headers = selected.split(" | ");
  // console.log("Headers Array: " + headers);
  // header = headers[0];
  // console.log("Header: " + header);


  if (dropdown == 'division' || dropdown == 'townSelect' || dropdown == 'programs' ) {
    attrFilter(dict);

  //   if (lastSelected != '') {
  //     console.log('subsequent filter');
  //   }
  //
  //
  // } else if (dropdown == 'mpoSelect') {
  //   console.log("DROPDOWN: " + dropdown);
  // } else {
  //   console.log("did not click a dropdown");
  }
  //
  // lastSelected = selected;
  // console.log(queryLink);
};

function removeFilter(dict, dropdown) {
  // console.log(dict);
  // console.log(dropdown);
  delete dict[dropdown];
  var keys = Object.keys(dict);
  if (keys.length == 0) {
    console.log("remove WHERE from queryLink");
    removeStr =
    console.log();
  }



  // console.log(dict);





  // console.log(queryLink);
};









function attrFilter(dict) {
  queryLink = "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/6/query?"
  // console.log(dict);
  var keys = Object.keys(dict);
  // console.log(keys);
  if (keys.includes('programs')){
    beforeProgram(dict, keys);
    program = dict['programs'];
    programsLike = '+AND+Program+LIKE+%27%25' + program + '%25%27';
    queryLink = queryLink + programsLike;
  } else {
    beforeProgram(dict, keys);
  }
  // console.log(queryLink);
};

function beforeProgram(dict, keys) {
  if (keys.includes('division') && keys.includes('townSelect')) {
    where = 'where=' +
    'Division%3D%27' + dict['division'] + '%27+AND+' +
    'Location%3D%27' + dict['townSelect'] + '%27';
    queryLink = queryLink + where;
  } else if (keys.includes('division')){
    where = 'where=Division%3D%27' + dict['division'] + '%27' ;
    queryLink = queryLink + where;
  } else if (keys.includes('townSelect')){
    where = 'where=Location%3D%27' + dict['townSelect'] + '%27' ;
    queryLink = queryLink + where;
  }
};
