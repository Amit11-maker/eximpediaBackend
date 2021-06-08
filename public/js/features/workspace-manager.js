const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_TAXONOMY = '/taxonomies';
const ENDPOINT_FETCH_USER_WORKSPACES = '/users/{userId}/workspaces';

const CLIENT_ACCOUNT_ID = '5db6cc3b2f0229b6f23f9a70';
const CLIENT_USER_ID = '5db6cc3b2f0229b6f23f9a6f';

const DEFAULT_ALL = '';
const TRADE_TYPE_IMPORT = 'IMPORT';
const TRADE_TYPE_EXPORT = 'EXPORT';

const QUERY_PARAM_TERM_TRADE_TYPE = 'tradeType';
const QUERY_PARAM_TERM_TRADE_YEAR = 'tradeYear';
const QUERY_PARAM_TERM_COUNTRY_CODE = 'countryCode';

const QUERY_PARAM_TERM_WORKSPACE_ID = 'workspaceId';
const QUERY_PARAM_TERM_WORKSPACE_BUCKET = 'workspaceBucket';
const QUERY_PARAM_TERM_WORKSPACE_NAME = 'workspaceName';

$(document).ready(function () {

  var currentTradeType = null;
  var currentTradeYear = null;
  var currentCountryCode = null;

  var tradeTypes = ['IMPORT', 'EXPORT'];
  var yearMonths = [{
      id: 1,
      month: "January",
      alias: "JAN"
    },
    {
      id: 2,
      month: "February",
      alias: "FEB"
    },
    {
      id: 3,
      month: "March",
      alias: "MAR"
    },
    {
      id: 4,
      month: "April",
      alias: "APR"
    },
    {
      id: 5,
      month: "May",
      alias: "MAY"
    },
    {
      id: 6,
      month: "June",
      alias: "JUN"
    },
    {
      id: 7,
      month: "July",
      alias: "JUL"
    },
    {
      id: 8,
      month: "August",
      alias: "AUG"
    },
    {
      id: 9,
      month: "September",
      alias: "SEP"
    },
    {
      id: 10,
      month: "October",
      alias: "OCT"
    },
    {
      id: 11,
      month: "November",
      alias: "NOV"
    },
    {
      id: 12,
      month: "December",
      alias: "DEC"
    }
  ];
  var taxonomyStandards = [];

  // UI Panel Bars
  const searchPanelBarSection = $('#search-panel-bar');
  const workspacePanelResultSection = $('#workspace-result-bar');

  const searchPanelTradeSelect = $('#search-panel-bar #trade-select');
  const searchPanelCountrySelect = $('#search-panel-bar #country-select');
  const searchPanelYearSelect = $('#search-panel-bar #year-select');
  const searchPanelUserSelect = $('#search-panel-bar #user-select');
  const searchPanelActionSearchButton = $('#search-panel-bar #search-bar-tools .cta-search');
  const searchPanelActionResetButton = $('#search-panel-bar #search-bar-tools .cta-reset');


  // Array Object Key Sort

  var arrayObjectKeyCountDescendingSort = function (a, b) {
    const x = a.count;
    const y = b.count;

    let comparison = 0;
    if (x > y) {
      comparison = -1;
    } else if (x < y) {
      comparison = 1;
    }
    return comparison;
  };

  var arrayObjectKeyIdAscendingSort = function (a, b) {
    const x = a.id;
    const y = b.id;

    let comparison = 0;
    if (x > y) {
      comparison = 1;
    } else if (x < y) {
      comparison = -1;
    }
    return comparison;
  };

  // Search Panel Section

  function prepareSearchTradeOptions() {
    let addedOptionsArr = [];
    tradeTypes.forEach(tradeType => {
      if (!addedOptionsArr.includes(tradeType)) {
        let option = `<option value="${tradeType}" ${(tradeType === currentTradeType)?'selected':''}>${tradeType}</option>`;
        searchPanelTradeSelect.append(option);
        addedOptionsArr.push(tradeType);
      }
    });
  }

  function prepareSearchCountryOptions() {
    let addedOptionsArr = [];
    taxonomyStandards.forEach(taxonomy => {
      if (!addedOptionsArr.includes(taxonomy.code_iso_3)) {
        let option = `<option value="${taxonomy.code_iso_3}" ${(taxonomy.code_iso_3 === currentCountryCode)?'selected':''}>${taxonomy.country.toString().toUpperCase().trim()}</option>`;
        searchPanelCountrySelect.append(option);
        addedOptionsArr.push(taxonomy.code_iso_3);
      }
    });
  }

  function prepareSearchYearOptions() {
    let currentYear = new Date().getFullYear();
    for (let index = 0; index < 25; index++) {
      let optionYear = currentYear - index;
      let option = `<option value="${optionYear}">${optionYear}</option>`;
      $('#year-select').append(option);
    }
  }


  // Reload Explore Shipment

  function reloadExploreShipment() {
    window.location = '/workspace/manager';
  }


  // Explore Panel Actions

  searchPanelActionResetButton.on('click', function (e) {
    reloadExploreShipment();
  });

  searchPanelActionSearchButton.on('click', function (e) {
    currentTradeType = $(`#${searchPanelTradeSelect.attr('id')} option:selected`).val();
    currentCountryCode = $(`#${searchPanelCountrySelect.attr('id')} option:selected`).val();
    currentTradeYear = $(`#${searchPanelYearSelect.attr('id')} option:selected`).val();
    fetchUserWorkspacesAPIHandler(CLIENT_USER_ID, currentTradeType, currentTradeYear, currentCountryCode);
  });


  // Taxonomy Response Section

  function buildTaxonomyManager(taxonomies) {
    taxonomyStandards = taxonomies;
    prepareSearchTradeOptions();
    prepareSearchCountryOptions();
    prepareSearchYearOptions();
    fetchUserWorkspacesAPIHandler(CLIENT_USER_ID, null, null, null);
  }

  function attachWorkspaceCard(workspace) {

    let analyzeWorkspaceQueryParams = QUERY_PARAMS_INDICATOR.concat(
      QUERY_PARAM_TERM_TRADE_TYPE, QUERY_PARAMS_VALUE_ASSIGNER, workspace.trade.toUpperCase().trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_COUNTRY_CODE, QUERY_PARAMS_VALUE_ASSIGNER, workspace.code_iso_3.toUpperCase().trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_WORKSPACE_ID, QUERY_PARAMS_VALUE_ASSIGNER, workspace._id.trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_WORKSPACE_BUCKET, QUERY_PARAMS_VALUE_ASSIGNER, workspace.data_bucket.trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_WORKSPACE_NAME, QUERY_PARAMS_VALUE_ASSIGNER, workspace.name.trim()
    );

    let html = `
      <div class="col-xs-12 col-sm-6 col-md-4 col-lg-4 col-xl-4">
        <div class="card-box project-box ribbon-box">

          <div class="dropdown float-right">
            <a href="#" class="dropdown-toggle card-drop arrow-none" data-toggle="dropdown" aria-expanded="false">
              <i class="mdi mdi-dots-horizontal m-0 text-muted h3"></i>
            </a>
            <div class="dropdown-menu dropdown-menu-right card-option-menu" x-placement="bottom-end"
              style="position: absolute; will-change: transform; top: 0px; left: 0px; transform: translate3d(-108px, -83px, 0px);"
              x-out-of-boundaries="">
              <a class="dropdown-item" href="#">Rename</a>
              <a class="dropdown-item" href="#">Delete</a>
              <a class="dropdown-item" href="#">Add Members</a>
              <a class="dropdown-item" href="#">Remove Members</a>
            </div>
          </div>

          <h4 class="mt-0 mb-2">
            <img src="/images/flags/${workspace.flag_uri}" class="flag-sm" alt="flag">
            <a href="javascript: void(0);" class="text-dark" style="margin-left: 0.5rem;">${workspace.name}</a>
          </h4>

          <p class="mb-1">
            <span class="pr-2 text-nowrap mb-2 d-inline-block">
              By
            </span>
            <span class="pr-2 text-nowrap mb-2 d-inline-block">
              <i class="fas fa-user text-muted"></i>
              <b> Delton</b>
            </span>
            <span class="text-nowrap mb-2 d-inline-block" style="float: right;">
              <i class="fas fa-calendar-day text-muted"></i>
              <b> ${new Date(workspace.created_ts).toDateString()}</b>
            </span>
          </p>

          <div class="card-highlight-content">
            <div class="row text-center">
              <div class="col-6">
                <h5 class="font-weight-normal text-muted">Trade</h5>
                <h5>${workspace.trade}</h5>
              </div>
              <div class="col-6">
                <h5 class="font-weight-normal text-muted">Country</h5>
                <h5>${workspace.country}</h5>
              </div>
              <div class="col-6">
                <h5 class="font-weight-normal text-muted">Years</h5>
                <h5>${workspace.years.toString()}</h5>
              </div>
              <div class="col-6">
                <h5 class="font-weight-normal text-muted">Shipments</h5>
                <h5>${workspace.records}</h5>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <div class="row no-gutters">
              <div class="col-md-4">
                <button type="button" style="width:100%"
                  class="btn btn-primary btn-sm waves-effect waves-light">Download</button>
              </div>
              <div class="col-md-4">
                  <a href="/workspace/analyze${analyzeWorkspaceQueryParams}" style="width:100%; margin-left:1px; margin-right:1px"
                  class="btn btn-primary btn-sm waves-effect waves-light">Analyze</a>
              </div>
              <div class="col-md-4">
              <a href="/workspace/analyze${analyzeWorkspaceQueryParams}" style="width:100%;margin-left: 2px;"
                  class="btn btn-primary btn-sm waves-effect waves-light">View</a>
              </div>
            </div>
          </div>

        </div>
      </div>`;

    workspacePanelResultSection.append(html);
  }

  function buildWorkspaces(workspaces) {
    workspaces.forEach(workspace => {
      attachWorkspaceCard(workspace);
    });
    graceCloseSwal();
  }

  // API CALLS

  function fetchTaxonomyAPIHandler() {
    /*Swal.fire({
      title: "Retrieving Taxonomies",
      text: "Preparing Data-Points For Exploring Shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_TAXONOMY),
      type: 'GET',
      success: function (payload) {
        //graceCloseSwal();
        buildTaxonomyManager(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchUserWorkspacesAPIHandler(userId, tradeType, tradeYear, countryCode) {
    Swal.fire({
      title: "Retrieving Workspaces",
      text: "Preparing Data-Points For Exploring Workspaces",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_USER_WORKSPACES.replace('{userId}', userId), QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'tradeYear', QUERY_PARAMS_VALUE_ASSIGNER, tradeYear, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode),
      type: 'GET',
      success: function (workspaces) {
        //graceCloseSwal();
        workspacePanelResultSection.empty();
        if (workspaces.data.length === 0) {
          Swal.fire({
            title: "Workspaces Absent",
            text: "You haven't created any workspaces yet!",
            showConfirmButton: true,
            allowOutsideClick: false
          });
        } else {
          buildWorkspaces(workspaces.data);
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

  function instantCloseSwal() {
    Swal.close();
  }


  // Shimpment search Templating Section
  function initWorkspaceManager() {
    Swal.fire({
      title: "Configuring Environment For Workspaces",
      text: "Preparing Workspace Factors",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    fetchTaxonomyAPIHandler();
  }

  // INIT API CALLS
  initWorkspaceManager();

});
