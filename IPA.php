<?php
$apikey = '463851C754C05C12CA6F95B844A81E00';
$secretkey = 'E8DE2371A8DD76F26F6272B1A535D96F909602F722F2571A6A7B853CAC822C94FEB1CD1F777AA69712DEEB2B626122A1DB3E17F1F04873025CC15E1CFE0E6A8ABE29BDDFDB361E53F5331E7BC7407BE03F972FA0CBFC30C756936AE7644F33EEF3346675D28FE25C93FAF1FD5D2BD06B627F05644948A6A97C3A3979DC383BAC';
$ipaLoadUrl = 'http://pol.pictometry.com/ipa/v1/load.php';
$ipaJsLibUrl = 'http://pol.pictometry.com/ipa/v1/embed/host.php?apikey=463851C754C05C12CA6F95B844A81E00';
$iframeId = 'pictometry_ipa';

// create the URL to be signed
$unsignedUrl = $ipaLoadUrl."?apikey=$apikey&ts=".time();

// create the digital signature using the unsigned Load URL and the secret key
$digitalSignature = hash_hmac('md5', $unsignedUrl, $secretkey);

// create the signed Load URL using the generated digital signature
$signedUrl = $unsignedUrl."&ds=".$digitalSignature."&app_id=".$iframeId;
?>

<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>


<title>Project Viewer</title>
<!-- client-side script from pictometry -->
<script type="text/javascript" src="<?php echo $ipaJsLibUrl; ?>"></script>



<meta http-equiv="X-UA-Compatible" content="IE=7,IE=9">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<script src="https://use.fontawesome.com/releases/v5.12.0/js/all.js" data-auto-replace-svg="nest"></script>
<script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js"></script>
<!-- <link href='https://unpkg.com/mapillary-js@1.7.1/dist/mapillary-js.min.js'> -->
<!-- <link href="https://unpkg.com/mapillary-js@2.18.0/dist/mapillary.min.css" rel="stylesheet"/> -->
<link href="https://unpkg.com/mapillary-js@2.20.0/dist/mapillary.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://js.arcgis.com/4.13/esri/themes/light/main.css"/>
<!-- <script src="https://js.arcgis.com/4.13/"></script>
<script src="js/map.js"></script>
<script src="js/controls.js"></script> -->
<link rel="stylesheet" href="css/style.css"/>
</head>

<body>
  <div id="mainDiv" class="container-fluid d-flex flex-column">

    <nav class="navbar-expand-sm s-navbar navbar-custom w-100">
      <img src="images/massdot_logo.png" class="img-fluid" alt="MassDOT Logo">
      <a class="navbar-brand">Project Viewer</a>
      <div class="topnav topnav-right collapse navbar-collapse" id="navbarCollapse">
        <a class="nav-link" href="https://www.mass.gov/service-details/capital-investment-plan-cip">2020-2024 CIP<span class="sr-only">(current)</span></a>
        <a class="nav-link" id="aboutBtn">ABOUT</a>
        <div class="btn my-2 my-sm-0 m-2">
          <div id="google_translate_element"></div>
        </div>
      </div>
    </nav>

    <!-- start About Modal -->
    <div id="aboutModal">
      <div id="aboutModal-content">
        <span class="close">&times;</span>
        <h4 class="w-100 h-10">Welcome to the Project Viewer and Interactive Map!</h4>
        <p>This application displays all 2020-2024 Capital Investment Plan Projects in Massachusetts. Search for projects by location or filter by MassDOT division, town, or program using the dropdown menus on the left. Additionally filter by project cost, using the sliders.</p>
      </div>
    </div>
    <!-- end About Modal -->

    <div class="row container-fluid flex-fill">
      <main class="col" style="background-color: white">
        <div class="row fullScreen">

          <!-- start Side Panel-->
          <div class="col-xl-2 sideContents" >
            <h4>Filter Projects</h4>
            <br>
            <label for="division">MassDOT Division</label>
            <div class="input-group mb-3">
              <select class="form-control dropdown filter" id="division">
                <option>All</option>
              </select>
            </div>
            <label for="townSelect">Town</label>
            <div class="input-group mb-3">
              <select class="form-control dropdown filter" id="townSelect">
    	          <option value="0">All</option>
              </select>
  		      </div>
            <label for="mpoSelect">MPO</label>
            <div class="input-group mb-3">
              <select class="form-control dropdown town-filter" id="mpoSelect">
                <option value="All">All</option>
              </select>
            </div>

            <!-- start checkboxes -->
            <div class="checkbox">
              <div class="filter mr-sm-2 w-100 ">
                <input class="geomCheck" type="checkbox" id="townPrjs" checked>
                <label class="form-check-label" for="townPrjs"> Town-wide projects </label>
              </div>
              <div class="filter mr-sm-2 w-100 ">
                <input class="geomCheck" type="checkbox" id="rtaPrjs" checked>
                <label class="form-check-label" for="rtaPrjs"> RTA-wide projects </label>
              </div>
              <div class="filter mr-sm-2 w-100 ">
                <input class="geomCheck" type="checkbox" id="districtPrjs" checked>
                <label class="form-check-label" for="districtPrjs"> Highway District projects </label>
              </div>
            </div>
            <!-- end checkboxes -->

            <label for="programs">CIP Program</label>
            <div class="input-group mb-3">
              <select class="form-control custom-select filter" id="programs" multiple>
                <option value="All" division= "All" selected>All</option>
              </select>
            </div>
            <div>
              <label for="amount">Cost Range</label>
              <form class="form">
                <div class="form-inline flex-grow-1">Min:  $
                  <input type="text" class="form-control form-control-sm costInput flex-grow-1 m-2" id="minCost" placeholder="0" value="0">
                </div>
                <div class="form-inline ">Max:  $
                  <input type="text" class="form-control form-control-sm costInput flex-grow-1 m-2" id="maxCost" placeholder="5,000,000,000" value="5,000,000,000">
                </div>
              </form>
              <div id="cost-range" 	class="filter"></div>
            </div>
            <br>
            <div class="filter mr-sm-2">
              <p>To view town, RTA, or statewide projects which match the current filters, click on that town or RTA in the map</p>
            </div>












            <div id="content">
              <h3 style="display: inline">SAGIS Pictometry Viewer</h3>
              <br>

              Go to Coordinates:
              <input type="text" id="locationText" onKeyPress="if (event.keyCode == 13) setLocation();"></input>
              <button type="button" onclick="setLocation();">Go</button>
              Address Search:
              <input type="text" id="addressText" onKeyPress="if (event.keyCode == 13) gotoAddress();"></input>
              <button type="button" onclick="gotoAddress();">Go</button>

            </div>
            <div id="pictometry">
              <iframe id="<?php echo $iframeId; ?>" width="100%" height="100%" src="#"></iframe>
            </div>
          </div>












          <!-- end  Side Panel -->

          <!-- start List Modal -->
          <div class="container listModal" id="listModal">
            <div class="row h-90pct">
              <div class="col-11 descList break-word" id="projectList-content"></div>
              <div class="col hideList" id="hideList">
                <span class="closeList-btn"><i class="fa fa-angle-double-left"></i></span>
              </div>
            </div>
          </div>
          <!-- end List Modal -->

          <!-- start Map col -->
          <div class="col d-flex flex-column mapCol">
            <input class="form-control mr-sm-2" id="projectSearch" type="search" placeholder="Search for a project (e.g. Red-Blue Connector)" aria-label="Search">
            <div id="viewDiv" class="col"></div>

            <!-- start Project Modal -->
            <div class="col col-offset-5" id="projectModal">
              <div id="projectModal-content">
                <div class="row closeProject-btn">
                  <span><i class="fa fa-angle-double-down"></i></span>
                </div>
                <div class="row w-100 justify-content-md-center projectContent">

                  <!-- start left col -->
                  <div class="col-md leftCol">
                    <div class="row">
                      <h6 id="projTitle"></h6>
                    </div>
                    <div class="row" id="projDesc"></div>
                  </div>
                  <!-- end left col -->

                  <!-- start right col -->
                  <div class="col-md rightCol">
                    <div class="tw-toggle">
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
                      <div id="gm_map"></div>
                      <div id="pano"></div>
                    </div>
                    <div class="mapillary">
                      <div id="mly" class="mapillary-js"></div>
                    </div>
                  </div>
                  <!-- end right col -->

                </div>
              </div>
            </div>
            <!-- end Project Modal -->

          </div>
          <!-- end Map col -->

        </div>
      </main>
    </div>
  </div>
  <div class="modal fade show" id="loading" tabindex="-1" role="dialog" aria-labelledby="loadingTitle" aria-hidden="true" data-backdrop="static" data-keyboard="false"></div>
  <script type="text/javascript">
  function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE}, 'google_translate_element');
  }
  </script>
  <script src="https://js.arcgis.com/4.13/"></script>
  <script src="js/page_contents.js"></script>
  <script src="js/controls.js"></script>
  <script src="js/aboutModal.js"></script>
  <script src="js/listModal.js"></script>
  <script src="js/projectModal.js"></script>
  <script src="js/map.js"></script>
  <!-- <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAVkDHsjYRM8sk6wQdbOgpaqibEpHE6Qmg&callback=initialize">
  </script> -->








  <script type="text/javascript">
    var ipa = new PictometryHost('<?php echo $iframeId; ?>','<?php echo $ipaLoadUrl; ?>');
    // declare variables to store values from URL
    var addressURL, lat, longi, orientation, angle, layerNumber;

    // Set your start location coordinates
    var defaultLat = '<SET THIS TO YOUR DEFAULT Latitude>';
    var defaultLongi = '<SET THIS TO YOUR DEFAULT Longitude>';

    ipa.ready = function() {
      //Takes everything after the question mark and puts it into a string called SearchString
      // This is an example URL for the using the following code:
      // http://pase10/php/ipatest4.php?address=115%20E%20Woodford%20Ave,%20Pittsburgh,%20PA%2015210&lat=40.393424&lon=-79.984461&ori=e

      var SearchString = window.location.search.substring(1);
      // Seperates SearchString into an array of values. Each value is divided by the & which does not get stored in the urlParams array.
      var urlParams = SearchString.split("&");

      //This is a loop that starts at 0 and ends at whatever length of the array is.
      //For example, if there are 5 items in the array it will start counting at 0 and go to 4.
      //Every time it counts up 1 number, it checks the value of the array at the current position and sets its value to one of the variable declared above.
      for(var i=0; i < urlParams.length; i++)
      {
        if(urlParams[i].toString().match("address"))
          {
                          addressURL = decodeURIComponent(urlParams[i].substr(8));
          }
          if(urlParams[i].toString().match("lat"))
          {
                          lat = urlParams[i].substr(4);
          }
          if(urlParams[i].toString().match("lon"))
          {
                          longi = urlParams[i].substr(4);
          }
          if(urlParams[i].toString().match("ori"))
          {
                          orientation = urlParams[i].substr(4);
          }
          if(urlParams[i].toString().match("angle"))
          {
                          angle = urlParams[i].substr(6);
          }
          if(! urlParams[0].substr(4))
          {
                          alert("Setting Default start location.");
                          lat = defaultLat;
                          longi = defaultLongi;
          }
      }
      //checks whether the value of variable addressURL is set. If it is defined ipa.gotoAddress is called while passing the addressURL variable.
      if(addressURL != undefined)
      {
        ipa.gotoAddress(addressURL);
      }
      else
      {
        ipa.setLocation(lat,longi);
      }

      //Sets the orientation to the value passed via URL. It does so by checking what the value is of the orientation variable and performing the appropriate function.
      ipa.addListener('onchangeview', function (view)
      {
        if(orientation == 'E' || orientation == 'e' || orientation == 'east' || orientation == 'EAST' || orientation == 'East')
          {
            ipa.setMapOrientation({
            angle: ipa.MAP_ANGLE.OBLIQUE,
            orientation: ipa.MAP_ORIENTATION.EAST
          });
        }
        if(orientation == 'N' || orientation == 'n' || orientation == 'north' || orientation == 'NORTH' || orientation == 'North')
          {
            ipa.setMapOrientation({
              angle: ipa.MAP_ANGLE.OBLIQUE,
              orientation: ipa.MAP_ORIENTATION.NORTH
            });
          }
        if(orientation == 'W' || orientation == 'w'  || orientation == 'west' || orientation == 'WEST'  || orientation == 'West')
          {
            ipa.setMapOrientation({
              angle: ipa.MAP_ANGLE.OBLIQUE,
              orientation: ipa.MAP_ORIENTATION.WEST
            });
          }
        if(orientation == 'S' || orientation == 's'|| orientation == 'south'|| orientation == 'SOUTH'|| orientation == 'South')
          {
            ipa.setMapOrientation({
              angle: ipa.MAP_ANGLE.OBLIQUE,
              orientation: ipa.MAP_ORIENTATION.SOUTH
            });
          }
      });

      ipa.getLayers( function(layers) {
        myLayers = layers;
      });

      ipa.getSearchServices( function(searchableLayers) {
          mySearchLayers = searchableLayers;
      });
    };

        function gotoEastmanHouse() {
          // Set the view location
          ipa.setLocation({
              y:43.152139,       // Latitude
              x:-77.580298,      // Longitude
              zoom:20            // Optional Zoom level
          });
          return false;
        };

        function setLocation() {
          var location = document.getElementById('locationText');
          var loc = location.value.split(',');
          var lat = loc[0].replace(/^\s+|\s+$/g, "");
          var lon = loc[1].replace(/^\s+|\s+$/g, "");

          // Alternate syntax to pass parameters
          ipa.setLocation(lat, lon, 17);
          return false;
        };

        function gotoAddress() {
          var address = document.getElementById('addressText');
          ipa.gotoAddress(address.value);

          return false;
        };

        function getLocation() {
          ipa.getLocation();
        };

        function parcelSearch() {
          var searchString = document.getElementById('parcelString');

          var query =
          {
            searchString: searchString.value,   // A known street in your street layer
              id: 59333,              // Your street layer id.  (Must have been retrieved with getSearchServices
              fields: ["st_name"]    // In this example we search only the 'street_name' field from the layer
          }
          ipa.searchByString(query);
          // setMarker();
        };

        // set the iframe src to load the IPA
        var iframe = document.getElementById('<?php echo $iframeId; ?>');
        iframe.setAttribute('src', '<?php echo $signedUrl; ?>');

    </script>



</body>
</html>
