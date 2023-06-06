const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_EXPLORE_COUNTRIES = '/trade/countries/explore';

const DEFAULT_ALL = '';
const TRADE_TYPE_IMPORT = 'IMPORT';
const TRADE_TYPE_EXPORT = 'EXPORT';

const QUERY_PARAM_TERM_TRADE_TYPE = 'tradeType';
const QUERY_PARAM_TERM_TRADE_YEAR = 'tradeYear';
const QUERY_PARAM_TERM_COUNTRY_CODE = 'countryCode';

$(document).ready(function () {

  function attachTradeCountryCard(tradeCountry) {

    let tradeYearsOrderedArr = tradeCountry.years.sort();
    let currentYear = 2019;
    if (tradeYearsOrderedArr.length > 0) {
      currentYear = tradeYearsOrderedArr[tradeYearsOrderedArr.length - 1];
    }

    let exploreShipmentsQueryParams = QUERY_PARAMS_INDICATOR.concat(
      QUERY_PARAM_TERM_TRADE_TYPE, QUERY_PARAMS_VALUE_ASSIGNER, tradeCountry.trade.toUpperCase().trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_COUNTRY_CODE, QUERY_PARAMS_VALUE_ASSIGNER, tradeCountry.code_iso_3.toUpperCase().trim(), QUERY_PARAMS_SEPARATOR,
      QUERY_PARAM_TERM_TRADE_YEAR, QUERY_PARAMS_VALUE_ASSIGNER, currentYear
    );
    let html = `
      <div class="col-xl-4 col-xs-12 col-md-6" id="${tradeCountry.data_bucket}">
          <div class="card-box project-box ribbon-box">
            <div class="ribbon ribbon-success float-right"><i class="fas fa-database mr-1"></i>New Data
            </div>
            <h4 class="mt-0"><img src="/images/flags/${tradeCountry.flag_uri}" class="flag-sm" alt="friend" style="">
                <a href="javascript: void(0);" class="text-dark" style="margin-left: 0.5rem;">${tradeCountry.country}</a>
            </h4>
            <p class="text-muted font-13 mb-3 sp-line-5">Global trade data is an active step towards understanding the import-export business of global countries.
            If you want to know more about it, simply click on any country-data mentioned below.
            </p>
            <div class="row mb-3">
                <div class="col-md-6">
                  <div id="showcaseFieldBlockLeft">
                  </div>
                </div>
                <div class="col-md-6">
                  <div id="showcaseFieldBlockRight">
                  </div>
                </div>
            </div>
            <div class="card-box" style="padding: 0px;">
                <h4 class="header-title mb-3" style="display: none;"></h4>
                <div class="table-responsive">
                  <table class="table table-bordered table-hover table-centered m-0">
                      <thead class="thead-light">
                        <tr>
                            <th>Trade</th>
                            <th>Date Range</th>
                            <th>Shipments</th>
                            <th>View</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                            <td>
                              <h5 class="m-0 font-weight-normal">${tradeCountry.trade}</h5>
                            </td>
                            <td>
                              ${tradeYearsOrderedArr.toString()}
                            </td>
                            <td>
                              ${tradeCountry.totalRecords}
                            </td>
                            <td>
                              <a href="/explore/shipments${exploreShipmentsQueryParams}" class="btn btn-xs btn-primary"><i
                                  class="far fa-eye"></i></a>
                            </td>
                        </tr>
                      </tbody>
                  </table>
                </div>
            </div>
          </div>
      </div>`;

    $('#exploreCountriesCardContainer').append(html);

    let oddEvenSwitch = 2;
    tradeCountry.showcase_fields.forEach(showcaseField => {
      let fieldBlock = `
        <p class="text-muted font-weight-bold sp-line-1">
        <i class="mdi mdi-checkbox-marked-circle-outline h6 text-primary mr-2"></i>${showcaseField.replace('_',' ')}
        </p>`;
      if (oddEvenSwitch % 2 === 0) {
        $(`#${tradeCountry.data_bucket} #showcaseFieldBlockLeft`).append(fieldBlock);
      } else {
        $(`#${tradeCountry.data_bucket} #showcaseFieldBlockRight`).append(fieldBlock);
      }
      oddEvenSwitch++;
    });
  }

  function buildExploreCountries(exploreCountries) {
    $('#exploreCountriesCardContainer').empty();
    if (exploreCountries.length === 0) {
      Swal.fire({
        title: "Explore Countries Absent",
        text: "No Countries In Active Mode Found",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      exploreCountries.forEach(exploreCountry => {
        attachTradeCountryCard(exploreCountry);
      });
    }
  }

  $('#filterAll').on('click', function (e) {
    fetchExploreTradeCountriesAPIHandler("");
  });

  $('#filterImport').on('click', function (e) {
    fetchExploreTradeCountriesAPIHandler(TRADE_TYPE_IMPORT);
  });

  $('#filterExport').on('click', function (e) {
    fetchExploreTradeCountriesAPIHandler(TRADE_TYPE_EXPORT);
  });

  function fetchExploreTradeCountriesAPIHandler(tradeType) {
    Swal.fire({
      title: "Retrieving Countries",
      text: "Preparing Country-wise Trade EXIM Stats",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_COUNTRIES, QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType),
      type: 'GET',
      success: function (payload) {
        graceCloseSwal();
        buildExploreCountries(payload.data);
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

  // INIT API CALLS
  fetchExploreTradeCountriesAPIHandler(DEFAULT_ALL);

});
