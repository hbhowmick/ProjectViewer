<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="initial-scale=1,maximum-scale=1,user-scalable=no"
    />
    <title>Query features from a FeatureLayer - 4.14</title>

    <link
      rel="stylesheet"
      href="https://js.arcgis.com/4.14/esri/themes/light/main.css"
    />
    <script src="https://js.arcgis.com/4.14/"></script>

    <style>
      html,
      body,
      #viewDiv {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      #infoDiv {
        background-color: white;
        color: black;
        padding: 6px;
        width: 400px;
      }

      #results {
        font-weight: bolder;
        padding-top: 10px;
      }
      .slider {
        width: 100%;
        height: 60px;
      }
      .drop-down {
        padding-bottom: 15px;
      }
    </style>

    <script>
      console.clear()
      require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/GraphicsLayer",
        "esri/geometry/geometryEngine",
        "esri/Graphic",
        "esri/widgets/Slider"
      ], function(
        Map,
        MapView,
        FeatureLayer,
        GraphicsLayer,
        geometryEngine,
        Graphic,
        Slider
      ) {
        var projectsURL =
          "https://gisdev.massdot.state.ma.us/server/rest/services/CIP/CIPCommentToolTest/MapServer/1";
        var townsURL = "https://gis.massdot.state.ma.us/arcgis/rest/services/Boundaries/Towns/MapServer/0";
        var projectSelect = document.getElementById("project-type");
        var townSelect = document.getElementById("town-name");
        var queryProjects = document.getElementById("query-projects");

        var projectsLayer = new FeatureLayer({
          url: projectsURL,
          outFields: ["*"],
          visible: false
        });
        var townsLayer = new FeatureLayer({
          url: townsURL,
          outFields: ["*"],
          visible: false
        });
        var resultsLayer = new GraphicsLayer();

        var map = new Map({
          basemap: "dark-gray",
          layers: [projectsLayer, townsLayer, resultsLayer]
        });

        var view = new MapView({
          container: "viewDiv",
          map: map,
          zoom: 9,
          center: [-71.8, 42],
        });
        view.ui.add("infoDiv", "top-right");

        // query all features from the towns layer
        view
          .when(function() {
            return townsLayer.when(function() {
              var query = townsLayer.createQuery();
              // console.log("townsLayer query: ", query);
              return townsLayer.queryFeatures(query);
            });
          })
          .then(getValues_towns)
          .then(getUniqueValues)
          .then(addToSelect_towns)
          // .then(createGraphic);


        // query all features from the projects layer
        view
          .when(function() {
            return projectsLayer.when(function() {
              var query = projectsLayer.createQuery();
              // console.log("projectsLayer query: ", query);
              return projectsLayer.queryFeatures(query);
            });
          })
          .then(getValues_projects)
          .then(getUniqueValues)
          .then(addToSelect_projects)



        // return an array of all the values in the
        // Town field of the towns layer
        function getValues_towns(response) {
          var features = response.features;
          // console.log("townsLayer features: ", features);
          var values = features.map(function(feature) {
            return feature.attributes.TOWN;
          });
          // console.log("townsLayer Name values: ", values);
          return values;
        }


        // return an array of all the values in the
        // Division field of the projects layer
        function getValues_projects(response) {
          var features = response.features;
          // console.log("projectsLayer features: ", features);
          var values = features.map(function(feature) {
            return feature.attributes.Division;
          });
          // console.log("projectsLayer Division values: ", values);
          return values;
        }



        // return an array of unique values in
        // the Town field of the towns layer
        // or the Division field of the projects layer
        function getUniqueValues(values) {
          var uniqueValues = [];

          values.forEach(function(item, i) {
            if (
              (uniqueValues.length < 1 || uniqueValues.indexOf(item) === -1) &&
              item !== ""
            ) {
              uniqueValues.push(item);
            }
          });
          // console.log("unique values: ", uniqueValues);
          return uniqueValues;
        }


        // Add the unique values to the towns
        // select element. This will allow the user
        // to filter towns by town name.
        function addToSelect_towns(values) {
          values.sort();
          // console.log("sorted unique values: ", values);
          values.forEach(function(value) {
            var option = document.createElement("option");
            option.text = value;
            townSelect.add(option);
          });

          return setTownsDefinitionExpression(townSelect.value);
        }


        // Add the unique values to the projects type
        // select element. This will allow the user
        // to filter projects by division.
        function addToSelect_projects(values) {
          values.sort();
          // console.log("sorted unique values: ", values);
          values.forEach(function(value) {
            var option = document.createElement("option");
            option.text = value;
            projectSelect.add(option);
          });

          return setProjectsDefinitionExpression(projectSelect.value);
        }


        // set the definition expression on the towns
        // layer to reflect the selection of the user
        function setTownsDefinitionExpression(newValue) {
          townsLayer.definitionExpression = "TOWN = '" + newValue + "'";
          // console.log("townsLayer DefExp: ", townsLayer.definitionExpression);
          if (!townsLayer.visible) {
            townsLayer.visible = true;
          }
          return queryForTownGeometries();
        }

        // set the definition expression on the projects
        // layer to reflect the selection of the user
        function setProjectsDefinitionExpression(newValue) {
          projectsLayer.definitionExpression = "Division = '" + newValue + "'";
          // projectsLayer.definitionExpression = "Division = 'MBTA'";
          // console.log("projectsLayer DefExp: ", projectsLayer.definitionExpression);
          if (!projectsLayer.visible) {
            projectsLayer.visible = true;
          }

          return queryForProjectGeometries();
        }

        // Get all the geometries of the towns layer
        // the createQuery() method creates a query
        // object that respects the definitionExpression
        // of the layer
        function queryForTownGeometries() {
          var townsQuery = townsLayer.createQuery();
          // console.log("query for Town Geometries: ", townsQuery);
          return townsLayer.queryFeatures(townsQuery).then(function(response) {
            townsGeometries = response.features.map(function(feature) {
              // console.log("town geometry: ", feature.geometry);
              return feature.geometry;
            });
            // console.log("townsGeometries: ", townsGeometries);
            return townsGeometries;
          });
        }


        // Get all the geometries of the projects layer
        // the createQuery() method creates a query
        // object that respects the definitionExpression
        // of the layer
        function queryForProjectGeometries() {
          var projectsQuery = projectsLayer.createQuery();
          // console.log("query for Project Geometries: ", projectsQuery);
          return projectsLayer.queryFeatures(projectsQuery).then(function(response) {
            projectsGeometries = response.features.map(function(feature) {
              // console.log("project geometry: ", feature.geometry);
              return feature.geometry;
            });
            // console.log("projectGeometries: ", projectsGeometries);
            return projectsGeometries;
          });
        }


        var townGraphic = null;

        function createGraphic(){
          if (townGraphic) {
            townGraphic.geometry = townsGeometries[0]
          } else {
            townGraphic = new Graphic({
              geometry: townsGeometries[0],
              symbol: {
                type: "simple-fill",
                outline: {
                  width: 1.5,
                  color: [255, 128, 0, 0.5]
                },
                style: "none"
              }
            });
            view.graphics.add(townGraphic);
          }
        }


        // set a new definitionExpression on the towns layer
        // and create a new graphic for the new town
        townSelect.addEventListener("change", function() {
          var type = event.target.value;
          console.log("townSelect type: ", type);
          setTownsDefinitionExpression(type).then(createGraphic);
        });


        // set a new definitionExpression on the projects layer
        projectSelect.addEventListener("change", function() {
          var type = event.target.value;
          console.log("projectSelect type: ", type);
          setProjectsDefinitionExpression(type);
        });



        // query for projects with the specified division
        // within the town geometry when the query button
        // is clicked
        queryProjects.addEventListener("click", function() {
          queryLinearProjects().then(displayResults);
        });


        function queryLinearProjects() {
          var query = projectsLayer.createQuery();
          query.where =  "Division = '" + projectSelect.value + "'";
          console.log("Projects Division query: ", query.where);
          query.geometry = townsGeometries[0];
          query.spatialRelationship = "intersects";

          return projectsLayer.queryFeatures(query);
        }


        // display the project query results in the
        // view and print the number of results to the DOM
        function displayResults(results) {
          resultsLayer.removeAll();
          var features = results.features.map(function(graphic) {
            graphic.symbol = {
              type: "simple-line",
              color: [226, 119, 40],
              width: 10
            };
            return graphic;
          });
          var numProjects = features.length;
          document.getElementById("results").innerHTML =
            numProjects + " projects found";
          resultsLayer.addMany(features);
        }


      });
    </script>
  </head>

  <body>
    <div id="viewDiv"></div>
    <div id="infoDiv" class="esri-widget">
      <div class="drop-down">
        Select project type:
        <select id="project-type" class="esri-widget"></select>
      </div>
      <div class="drop-down">
        Select town:
        <select id="town-name" class="esri-widget"></select>
      </div>
      <button id="query-projects" class="esri-widget">Query Projects</button>
      <div id="results" class="esri-widget"></div>
    </div>
  </body>
</html>
