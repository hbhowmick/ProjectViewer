$(document).ready(function () {
  function populateStrings() {
    $("#aboutTool").html(  "<div class='modal-dialog modal-dialog-centered' role='document'>    <div class='modal-content'>      <div class='modal-header'>        <h3 class='modal-title' id='aboutToolTitle'>Welcome to the CIP Comment Tool and Interactive Map!</h3>        <button type='button' class='close' data-dismiss='modal' aria-label='Close'> <span aria-hidden='true'>&times;</span> </button>      </div>      <div class='modal-body'>        <p class='string page_help'></p>      </div>      <div class='modal-footer'>        <button type='button' class='btn btn-secondary' data-dismiss='modal'>Close</button>      </div>    </div>  </div>")

    $("#loading").html(  "<div class='modal-dialog' role='document'>    <div class='modal-content'>      <div class='modal-body'>        <h5 class='modal-title text-center'>Finding projects...</h5>        <div class='text-center'>          <div class='spinner-border' role='status'> <span class='sr-only'>Loading...</span> </div>        </div>      </div>    </div>  </div>")

	  $(".page_help").text(strings.help_message);

  }


});
