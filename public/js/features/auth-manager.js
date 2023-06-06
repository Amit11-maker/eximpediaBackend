const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_PANEL_LOGIN = '/login';
const ENDPOINT_PANEL_DASHBOARD = '/dashboard';

$(document).ready(function () {

  $('#passCode').on('click', function (e) {
    let passCode = $('#password').val();
    if (passCode) {
      panelLoginAPIHandler(passCode);
    }
  });

  function panelLoginAPIHandler(passCode) {
    Swal.fire({
      title: "Access Guard",
      text: "Authenticating Access Role",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_PANEL_LOGIN, QUERY_PARAMS_INDICATOR,
        'pass_code', QUERY_PARAMS_VALUE_ASSIGNER, passCode),
      type: 'GET',
      success: function (payload) {
        graceCloseSwal();
        if (payload.data) {
          window.location = API_HOST.concat(ENDPOINT_PANEL_DASHBOARD);
        } else {
          Swal.fire({
            title: "Auth Failed",
            text: "PassCode is Invalid!",
            showConfirmButton: false,
            allowOutsideClick: false,
            timer: 1500
          });
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function showApiError(textStatus, errorThrown) {
    Swal.fire({
      type: "error",
      title: textStatus,
      text: errorThrown,
      showConfirmButton: false,
      footer: '<a href="">Why do I have this issue?</a>'
    });
  }

  function graceCloseSwal() {
    var intervalID = window.setTimeout(function () {
      Swal.close();
      clearTimeout(intervalID);
    }, 2000);
  }

});
