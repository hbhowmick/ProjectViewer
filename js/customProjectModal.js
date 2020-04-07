// projectSearchID = false;
sourceLayerView = false;
highlight = false;

highlightClickL = null;
highlightClickP = null;
results = [];
popupIndex = 0;
popupIndexVal = 0;
projectPopup = '';

var zoomTo = {
  title: "Zoom To",
  id: "zoomTo",
  className: "esri-icon-notice-round"
}

$("#zoomTo").click(function() {
  view.goTo(projectPopup);
})


$("#closePopup-btn").css("display", "block");
$("#projectModal").css("display", "block");

//---from popupFunctionMbtaAsset---//
$(".mbtaPopup")
.append("<p id='popupFeatureSelected' class='tProjList line' modeType='line' val='" + target.graphic.attributes.MBTA_Location + "'></p>")
.append("<p id='popupFeatureSelected' class='tProjList mode' modeType='mode' val='" + target.graphic.attributes.route_desc + "'></p>")
.append("<p id='popupFeatureSelected' class='tProjList system' modeType='system' val='System'></p>");

if (lineProjects.length > 0) {
  $(".line").append("<button class='btn btn-info' id='mbtaLine'></button>")
  line = "View " + target.graphic.attributes.MBTA_Location + " projects";
  $("#mbtaLine").html(line);
} else {
  $(".line").append("<p>No " + target.graphic.attributes.MBTA_Location + " projects currently match your search criteria</p>");
}
if (modeProjects.length > 0) {
  $(".mode").append("<button class='btn btn-info' id='mbtaMode'></button>")
  mode = "View " + target.graphic.attributes.route_desc + " projects";
  $("#mbtaMode").html(mode);
} else {
  $(".mode").append("<p>No " + target.graphic.attributes.route_desc + " projects currently match your search criteria</p>");
}
if (systemProjects.length > 0) {
  $(".system").append("<button class='btn btn-info' id='mbtaSystem'></button>");
  mbta = "View MBTA Systemwide projects";
  $("#mbtaSystem").html(mbta);
} else {
  $(".system").append("<p>No MBTA Systemwide projects currently match your search criteria</p>");
}
//--------------------------------//

const graphic = {
  popupTemplate: {
    content: "Click a feature to show details..."
  }
};
let feature;
// Provide graphic to a new instance of a Feature widget
feature = new Feature({
  container: "popupDock",
  graphic: graphic,
  map: view.map,
  spatialReference: view.spatialReference,
});

prjLocationLines = layerView;
let results = [];
var popupIndex = 0;
var popupIndexVal = 0;
view.on("click", function(event) {
  if (highlightL) {
    highlightL.remove();
  }
  view.hitTest(event).then(function(event) {
    if(event.results.length>0){
      $("#reopenPopup-btn").css("display", "none");
      $("#closePopup-btn").css("display", "block");
      $("#projectModal").css("display", "block");
      $("#viewDiv").css("height", "58%");
      results = [];
      popupIndex = 0;
      popupIndexVal = 0;
      popupIndexVal = popupIndex+1;
      $("#popupIndex").html(popupIndexVal);
      results = event.results.filter(function(result) {
        return result.graphic.layer.popupTemplate;
      });
      // console.log(results)
      if (event.results.length > 1) {
        $("#navigationArrows").css("display", "inline-block");
        $("#popupTotal").html(event.results.length)
      } else {
        $("#navigationArrows").css("display", "none");
      }
      replacePopupGraphic(popupIndex);
    }
  })
});
$("#rightArrow").on("click", function(){
  if (popupIndexVal<results.length) {
    popupIndex+=1;
    popupIndexVal+=1;
  } else {
    popupIndex=0;
    popupIndexVal=1;
  }
  // console.log(popupIndex,popupIndexVal)
  $("#popupIndex").html(popupIndexVal);
  replacePopupGraphic(popupIndex, sourceLayerView)
});
$("#leftArrow").on("click", function(){
  if (popupIndexVal>1) {
    popupIndex-=1;
    popupIndexVal-=1;
  } else {
    popupIndex=results.length-1;
    popupIndexVal=results.length;
  }
  // console.log(popupIndex, popupIndexVal);
  $("#popupIndex").html(popupIndexVal);
  replacePopupGraphic(popupIndex, sourceLayerView);
});
function replacePopupGraphic(index) {

  $("#popupDock").removeClass("mbtaPopup");
  $(".tProjList").remove();

  var result = results[index];
  projectPopup = result.graphic.geometry;

  if (result.graphic.attributes.MBTA_Location) {
    $("#popupDock").addClass("mbtaPopup");
  }

  if (result) {
    feature.graphic = result.graphic;
    // console.log(index, result.graphic.layer.title);
    if (highlightClickP) {
      highlightClickP.remove();
      highlightClickP = null;
    }
    highlightClickL = prjLocationLines.highlight(result.graphic);
  } else {
    console.log('else')
    feature.graphic = graphic;
  }
}


prjLocationPoints = layerView;
let results = [];
var popupIndex = 0;
var popupIndexVal = 0;
view.on("click", function(event) {
  if (highlightP) {
    highlightP.remove();
  }
  view.hitTest(event).then(function(event) {
    if(event.results.length>0){
      $("#reopenPopup-btn").css("display", "none");
      $("#closePopup-btn").css("display", "block");
      $("#projectModal").css("display", "block");
      $("#viewDiv").css("height", "58%");
      results = [];
      popupIndex = 0;
      popupIndexVal = 0;
      popupIndexVal = popupIndex+1;
      $("#popupIndex").html(popupIndexVal);
      results = event.results.filter(function(result) {
        return result.graphic.layer.popupTemplate;
      });
      // console.log(results)
      if (event.results.length > 1) {
        $("#navigationArrows").css("display", "inline-block");
        $("#popupTotal").html(event.results.length)
      } else {
        $("#navigationArrows").css("display", "none");
      }
      replacePopupGraphic(popupIndex);
    }

  })
});
$("#rightArrow").on("click", function(){
  if (popupIndexVal<results.length) {
    popupIndex+=1;
    popupIndexVal+=1;
  } else {
    popupIndex=0;
    popupIndexVal=1;
  }
  // console.log(popupIndex,popupIndexVal)
  $("#popupIndex").html(popupIndexVal);
  replacePopupGraphic(popupIndex)
});
$("#leftArrow").on("click", function(){
  if (popupIndexVal>1) {
    popupIndex-=1;
    popupIndexVal-=1;
  } else {
    popupIndex=results.length-1;
    popupIndexVal=results.length;
  }
  // console.log(popupIndex, popupIndexVal);
  $("#popupIndex").html(popupIndexVal);
  replacePopupGraphic(popupIndex);
});
function replacePopupGraphic(index) {

  $("#popupDock").removeClass("mbtaPopup");
  $(".tProjList").remove();

  var result = results[index];
  projectPopup = result.graphic.geometry;

  if (result.graphic.attributes.MBTA_Location) {
    $("#popupDock").addClass("mbtaPopup");
  }

  if (result) {
    feature.graphic = result.graphic;
    // console.log(index, result.graphic.layer.title);
    if (highlightClickL) {
      highlightClickL.remove();
      highlightClickL = null;
    }
    highlightClickP = prjLocationPoints.highlight(result.graphic);
  } else {
    console.log('else')
    feature.graphic = graphic;
  }
}



//------HTML------//
<!-- PROJECT MODAL -->
<!-- Re-Open Popup Button -->
<div class="col" id="reopenPopup-btn">
  <span><i class="fa fa-angle-double-up"></i></span>
</div>
<div class="w-100 col-offset-5" id="projectModal">
  <div class="row" id="projectContent">
    <!-- Close Popup Button -->
    <div class="row w-100" id="closePopup-btn">
      <span><i class="fa fa-angle-double-down"></i></span>
    </div>
    <!-- Popup Content -->
    <div class="row justify-content-md-center" id="popupContent">
      <!-- POPUP -->
      <div class="col-md esri-widget" id="popupDock">
        <div class="topWidgets">
          <div class="esri-icon-zoom-in-magnifying-glass" id="zoomTo">
            <span class="esri-popup__action-text">
              Zoom To
            </span>
          </div>
          <div id="navigationArrows">
            <div class="arrow navArrows" id="leftArrow">
              <i class="fas fa-angle-left"></i>
            </div>
            <div class="navArrows" id="popupCount">
              <div class="d-inline" id="popupIndex"></div>
              <div class="d-inline">of</div>
              <div class="d-inline" id="popupTotal"></div>
            </div>
            <div class="arrow navArrows" id="rightArrow">
            <i class="fas fa-angle-right"></i>
          </div>
        </div>
        </div>
      </div>
      <!-- APIs -->
      <div class="col-md" id="imageryAPI">
        <!-- <div class="tw-toggle">
          <input checked type="radio" name="toggle" value="true">
          <label class="toggle toggle-yes">
            <i class="fas fa-street-view"></i>
          </label>
          <input type="radio" name="toggle" value="false">
          <label class="toggle toggle-yes">
            <i class="fas fa-images"></i>
          </label>
          <span></span>
        </div>
        <div class="gm_streetview">
          <div id="g_stview"></div>
        </div>
        <div class="mapillary"> -->
          <!-- <div id="mly" class="mapillary-js"></div> -->
        </div>
      </div>
    </div>
  </div>

</div>
//---------------//
