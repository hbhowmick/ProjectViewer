view2.when(disableZooming);

function disableZooming(view) {
  view.popup.dockEnabled = true;

  // Removes the zoom action on the popup
  view.popup.actions = [];

  // stops propagation of default behavior when an event fires
  function stopEvtPropagation(event) {
    event.stopPropagation();
  }

  // exlude the zoom widget from the default UI
  view.ui.components = ["attribution"];

  // disable mouse wheel scroll zooming on the view
  view.on("mouse-wheel", stopEvtPropagation);

  // disable zooming via double-click on the view
  view.on("double-click", stopEvtPropagation);

  // disable zooming out via double-click + Control on the view
  view.on("double-click", ["Control"], stopEvtPropagation);

  // disables pinch-zoom and panning on the view
  view.on("drag", stopEvtPropagation);

  // disable the view's zoom box to prevent the Shift + drag
  // and Shift + Control + drag zoom gestures.
  view.on("drag", ["Shift"], stopEvtPropagation);
  view.on("drag", ["Shift", "Control"], stopEvtPropagation);

  // prevents zooming with the + and - keys
  view.on("key-down", function(event) {
    var prohibitedKeys = ["+", "-", "Shift", "_", "="];
    var keyPressed = event.key;
    if (prohibitedKeys.indexOf(keyPressed) !== -1) {
      event.stopPropagation();
    }
  });

  return view;
};
