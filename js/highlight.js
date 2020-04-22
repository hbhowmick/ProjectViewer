
    // $("#listModal").on("mouseover", ".listItem", function () {
    //   view.graphics.removeAll()
    //   view.graphics.add(spatialGraphic)
    //   var hoverItemID = this.id
    //   var hoverLocation = $(this).attr('location')
    //   // console.log(hoverItemID, hoverLocation, this)
    //   var hoverItemLocSource = $(this).attr('location_source')
    //
    //   if (hoverItemLocSource === "POINT") {
    //     pointQuery.where = "ProjectID = '" + hoverItemID + "'"
    //     prjLocationPoints.queryFeatures(pointQuery).then(function (ids) {
    //       pointHighlight.geometry = ids.features[0].geometry
    //       view.graphics.add(pointHighlight)
    //     })
    //   } else if (hoverItemLocSource === "polyline") {
    //     linesQuery.where = "ProjectID = '" + hoverItemID + "'"
    //     prjLocationLines.queryFeatures(linesQuery).then(function (ids) {
    //       lineHighlight.geometry = ids.features[0].geometry
    //       view.graphics.add(lineHighlight)
    //     })
    //   } else if (hoverItemLocSource === "MBTA") {
    //     console.log(hoverLocation)
    //     if (hoverLocation == 'System') {
    //       mbtaQuery.where = "(1=1)"
    //     } else if (hoverLocation == 'Commuter Rail' || hoverLocation == 'Ferry' || hoverLocation == 'Rapid Transit' || hoverLocation == 'Silver') {
    //       mbtaQuery.where = "route_desc = '" + hoverLocation + "'"
    //     } else {
    //       if (hoverLocation.includes(",")) {
    //         var tLineArray = hoverLocation.split(", ")
    //         var tLineSQL = ""
    //         for(i=0; i<tLineArray.length; i++){
    //           if (i<tLineArray.length-1) {
    //             tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%' OR "
    //           } else {
    //             tLineSQL = tLineSQL + "MBTA_Location LIKE '%" + tLineArray[i] + "%'"
    //           }
    //         }
    //         mbtaQuery.where = tLineSQL
    //         console.log(mbtaQuery.where)
    //       } else {
    //         mbtaQuery.where = "MBTA_Location LIKE '%" + hoverLocation + "%'"
    //       }
    //     }
    //     mbtaLayerView.queryFeatures(mbtaQuery).then(function (response) {
    //       // console.log(response);
    //       tGraphicsArray = []
    //       $(response.features).each(function() {
    //         // console.log(this.attributes.MBTA_Location);
    //         var tHighlight = new Graphic()
    //         tHighlight.symbol = {
    //           type: "simple-line", // autocasts as SimpleLineSymbol()
    //           color: [226, 119, 40],
    //           width: 5
    //         }
    //         tHighlight.geometry = this.geometry
    //         tGraphicsArray.push(tHighlight)
    //       })
    //       view.graphics.addMany(tGraphicsArray)
    //     })
    //   }
    // });
    //
    // $("#listModal").on("mouseout", ".listItem", function () {
    //   if (pointHighlight) {
    //     view.graphics.remove(pointHighlight)
    //   }
    //   if (lineHighlight) {
    //     view.graphics.remove(lineHighlight)
    //   }
    //   if (tGraphicsArray) {
    //     view.graphics.removeMany(tGraphicsArray)
    //   }
    // });




    view.on("pointer-move", function(event) {
      view.hitTest(event).then(getGraphics)
    })
    let highlightL, hoverProjectID
    function getGraphics(response) {
      if (response.results.length) {
        highlightGraphic = response.results.filter(function(result) {
          return result.graphic.layer === projectLocations
        })[0].graphic
        const attributes = highlightGraphic.attributes
        const attProjectID = attributes.ProjectID
        const attDivision = attributes.Division
        const attLocation = attributes.Location

        if (highlightL && hoverProjectID !== attProjectID) {
          highlightL.remove()
          highlightL = null
          return
        }
        if (highlightL) {
          return
        }

        const query = layerView.createQuery()
        query.where = "ProjectID = '" + attProjectID + "'"
        layerView.queryObjectIds(query).then(function(ids) {
          if (highlightL) {
            highlightL.remove()
          }
          highlightL = layerView.highlight(ids)
          hoverProjectID = attProjectID
        })
      } else {
        highlightL.remove()
        highlightL = null
      }
    }
