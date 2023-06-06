const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_TAXONOMY = '/taxonomies';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_ESTIMATE = '/trade/shipments/explore/estimate';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_BUYER_SELLER_SEARCH = '/trade/shipments/explore/traders/search';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_SPECIFICATIONS = '/trade/shipments/explore/specifications';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_TRADERS = '/trade/shipments/explore/traders';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_RECORDS = '/trade/shipments/explore/records';
const ENDPOINT_FETCH_EXPLORE_SHIPMENT_STATISTICS = '/trade/shipments/explore/statistics';
const ENDPOINT_EXPLORE_SHIPMENT_PAGE = '/explore/shipments';

const ENDPOINT_FETCH_USER_WORKSPACES = '/users/{userId}/workspaces/templates';
const ENDPOINT_VERIFY_WORKSPACE_EXISTENCE = '/accounts/{accountId}/workspaces/existence/verification';
const ENDPOINT_APPROVE_RECORDS_PURCHASE = '/workspaces/records/purchase/approval';
const ENDPOINT_ADD_WORKSPACE_RECORDS = '/workspaces/records';

const DECIMAL128MDB_JS_CAST = '$numberDecimal';
const FIELD_HS_CODE = 'HS_CODE';
const FIELD_IMP_DATE = 'IMP_DATE';
const FIELD_EXP_DATE = 'EXP_DATE';

const CLIENT_ACCOUNT_ID = '5db6cc3b2f0229b6f23f9a70';
const CLIENT_USER_ID = '5db6cc3b2f0229b6f23f9a6f';

const DEFAULT_ALL = '';
const TRADE_TYPE_IMPORT = 'IMPORT';
const TRADE_TYPE_EXPORT = 'EXPORT';

const SHIPMENT_FIELD_RECORDS_TAG = 'RECORDS_TAG';

const SHIPMENT_RESULT_TYPE_RECORDS = 'RECORDS';
const SHIPMENT_RESULT_TYPE_STATISTICS = 'STATISTICS';

const SHIPMENT_QUERY_TYPE_SEARCH = 'SEARCH';
const SHIPMENT_QUERY_TYPE_CHOOSE = 'CHOOSE';

const RESULT_EXPLORE_RELOAD_TYPE_DEFAULT = 'DEFAULT';
const RESULT_EXPLORE_RELOAD_TYPE_SEARCH = 'SEARCH';
const RESULT_EXPLORE_RELOAD_TYPE_FILTER = 'FILTER';

const WORKSPACE_ADD_TYPE_RECORDS_SELECTIONS = 'RECORDS_SELECTIONS';
const WORKSPACE_ADD_TYPE_MATCH_EXPRESSIONS = 'MATCH_EXPRESSIONS';

const WORKSPACE_TYPE_NEW = 'NEW';
const WORKSPACE_TYPE_EXISTING = 'EXISTING';

const QUERY_PARAM_TERM_TRADE_TYPE = 'tradeType';
const QUERY_PARAM_TERM_TRADE_YEAR = 'tradeYear';
const QUERY_PARAM_TERM_COUNTRY_CODE = 'countryCode';

const QUERY_PARAM_TERM_WORKSPACE_NAME = 'workspaceName';

$(document).ready(function () {

  var masterDTRun = true;
  var isFilterRefresh = false;
  var activateSearchBasedFilters = true;
  var recordsTable = null;
  var currentTradeType = null;
  var currentTradeYear = null;
  var currentCountryCode = null;
  var currentStartMonth = null;
  var currentEndMonth = null;
  var currentTermType = null;
  var currentTermIdentifier = null;
  var currentTermValue = null;
  var currentTotalRecords = null;
  var currentSummarizedRecords = null;
  var currentBuyerAlias = null;
  var currentSellerAlias = null;
  var currentWorkspaceAddRecordsType = null;
  var currentWorkspaceOperation = null;
  var currentWorkspacePurchases = null;
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
  var exploreShipmentSpecification = {};
  var exploreShipmentDTFields = [];
  var exploreShipmentStatisticsFieldOptions = {};
  var selectedShipments = [];
  var shipmentMasterFilterSet = {};
  var shipmentComputedFilterSet = {};
  var shipmentComputedSummarySet = {};

  // UI Panel Bars
  const semanticPanelBarSection = $('#semantic-panel-bar');
  const searchPanelBarSection = $('#search-panel-bar');
  const summaryPanelBarSection = $('#summary-panel-bar');
  const filterPanelBarSection = $('#filter-panel-bar');
  const resultPanelBarSection = $('#result-panel-bar');
  const recordsPanelBarSection = $('#result-panel-bar #records-illustration');
  const statisticsPanelBarSection = $('#result-panel-bar #statistics-illustration');

  const semanticPanelTradeSelect = $('#semantic-panel-bar #trade-select');
  const semanticPanelCountrySelect = $('#semantic-panel-bar #country-select');
  const semanticPanelYearSelect = $('#semantic-panel-bar #year-select');
  const semanticPanelActionSetTradeButton = $('#semantic-panel-bar #semantic-bar-tools #cta-set-trade');

  const searchPanelMonthStartSelect = $('#search-panel-bar #month-start-select');
  const searchPanelMonthEndSelect = $('#search-panel-bar #month-end-select');
  const searchPanelTermTypeSelect = $('#search-panel-bar #term-type-select');
  const searchPanelTermValueSwapperContainer = $('#search-panel-bar #term-value-swapper');
  const searchPanelActionSearchButton = $('#search-panel-bar #search-bar-tools .cta-search');
  const searchPanelActionResetButton = $('#search-panel-bar #search-bar-tools .cta-reset');

  const summaryPanelRecordLoader = $('#summary-panel-bar .label_records .progress-loader');
  const summaryPanelRecordContainer = $('#summary-panel-bar .label_records .content');
  const summaryPanelRecordCounter = $('#summary-panel-bar .label_records .content span');
  const summaryPanelShipmentLoader = $('#summary-panel-bar .label_shipments .progress-loader');
  const summaryPanelShipmentContainer = $('#summary-panel-bar .label_shipments .content');
  const summaryPanelShipmentCounter = $('#summary-panel-bar .label_shipments .content span');
  const summaryPanelHsCodeLoader = $('#summary-panel-bar .label_hs_codes .progress-loader');
  const summaryPanelHsCodeContainer = $('#summary-panel-bar .label_hs_codes .content');
  const summaryPanelHsCodeCounter = $('#summary-panel-bar .label_hs_codes .content span');
  const summaryPanelBuyerLoader = $('#summary-panel-bar .label_buyers .progress-loader');
  const summaryPanelBuyerContainer = $('#summary-panel-bar .label_buyers .content');
  const summaryPanelBuyerCounter = $('#summary-panel-bar .label_buyers .content span');
  const summaryPanelSellerLoader = $('#summary-panel-bar .label_sellers .progress-loader');
  const summaryPanelSellerContainer = $('#summary-panel-bar .label_sellers .content');
  const summaryPanelSellerCounter = $('#summary-panel-bar .label_sellers .content span');

  const filterPanelCTAButtons = $('#filter-panel-bar .cta-buttons');
  const filterPanelHsCodeButton = $('#filter-panel-bar #cta-filter-hscode');
  const filterPanelCountryButton = $('#filter-panel-bar #cta-filter-country');
  const filterPanelPortButton = $('#filter-panel-bar #cta-filter-port');
  const filterPanelMonthButton = $('#filter-panel-bar #cta-filter-month');
  const filterPanelQuantityButton = $('#filter-panel-bar #cta-filter-quantity');
  const filterPanelPriceButton = $('#filter-panel-bar #cta-filter-price');
  const filterPanelActionApplyButton = $('#filter-panel-bar #filter-bar-tools .cta-apply');
  const filterPanelActionResetButton = $('#filter-panel-bar #filter-bar-tools .cta-reset');

  const filterPanelHsCodeOptionsPane = $('#filter-right-hscode #filter-hscode');
  const filterPanelCountryOptionsPane = $('#filter-right-country #filter-country');
  const filterPanelPortOptionsPane = $('#filter-right-port #filter-port');
  const filterPanelMonthOptionsPane = $('#filter-right-month #filter-month');
  const filterPanelQuantityOptionsPane = $('#filter-right-quantity #filter-quantity');
  const filterPanelPriceOptionsPane = $('#filter-right-price #filter-price');

  const filterPanelQuantityUnitSelect = $('#filter-quantity .filter-options #unit-select');
  const filterPanelPriceCurrencySelect = $('#filter-price .filter-options #currency-select');

  const filterPanelDTListColumnOptions = $('#action-right-data-column-visibility');

  const filterPanelGlobalActionApplyButton = $('.cta-global-apply-filter');

  const addRecordsWorkspaceSelect = $('#manage-workspace-records-panel #workspace-select');
  const addWorkspaceSelectedRecordsButton = $('.cta-add-workspace-selected-records');
  const addWorkspaceAllRecordsButton = $('.cta-add-workspace-all-records');
  const specifyWorkspaceRecordsButton = $('#cta-specify-workspace-records');
  const confirmWorkspaceRecordsPurchaseButton = $('#cta-confirm-workspace-records-purchase');

  const statisticsPanelHsCodeCard = $('#result-panel-bar #statistics-illustration #statistics-hscode');
  const statisticsPanelCountryCard = $('#result-panel-bar #statistics-illustration #statistics-country');
  const statisticsPanelPortCard = $('#result-panel-bar #statistics-illustration #statistics-port');
  const statisticsPanelMonthCard = $('#result-panel-bar #statistics-illustration #statistics-month');

  var globSearch = null;

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

  function formulateDataMasterGroupSubCountNesting(dataArray, masterPosLimit, groupPosLimit) {
    let dataTree = {};
    dataArray.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {

      let dataMaster = filterValue._id.toString().toUpperCase().trim().substr(0, masterPosLimit);
      let dataGroup = filterValue._id.toString().toUpperCase().trim().substr(0, groupPosLimit);
      let dataSub = filterValue._id.toString().toUpperCase().trim();

      if (!dataTree.hasOwnProperty(dataMaster)) {
        dataTree[dataMaster] = {};
      }
      if (!dataTree[dataMaster].hasOwnProperty(dataGroup)) {
        dataTree[dataMaster][dataGroup] = [];
      }

      if (!(filterValue.isSelected != null && filterValue.isSelected != undefined)) {
        filterValue.isSelected = false;
      }

      dataTree[dataMaster][dataGroup].push({
        _id: dataSub,
        count: filterValue.count,
        isSelected: filterValue.isSelected
      });
    });

    return dataTree;
  }

  // Range Slider Initialisations

  $(`#${filterPanelQuantityOptionsPane.attr('id')} #quantity-range-slide`).ionRangeSlider({
    skin: "round",
    step: 1,
    grid: true,
    grid_num: 4,
    grid_snap: false,
    prettify_enabled: true,
    prettify_separator: ",",
    postfix: '',
    onStart: function (data) {},
    onChange: function (data) {
      // Called every time handle position is changed
    },
    onFinish: function (data) {
      // Called then action is done and mouse is released
      $(`#${filterPanelQuantityUnitSelect.attr('id')} option:selected`).attr('data-min-range', data.from).attr('data-max-range', data.to);
    },
    onUpdate: function (data) {
      // Called then slider is changed using Update public method
    }
  });
  var quantityRangeSlideInstance = $(`#${filterPanelQuantityOptionsPane.attr('id')} #quantity-range-slide`).data("ionRangeSlider");
  $(`#${filterPanelPriceOptionsPane.attr('id')} #price-range-slide`).ionRangeSlider({
    skin: "round",
    step: 1,
    grid: true,
    grid_num: 4,
    grid_snap: false,
    prettify_enabled: true,
    prettify_separator: ",",
    postfix: '',
    onStart: function (data) {},
    onChange: function (data) {
      // Called every time handle position is changed
    },
    onFinish: function (data) {
      // Called then action is done and mouse is released
      $(`#${filterPanelPriceCurrencySelect.attr('id')} option:selected`).attr('data-min-range', data.from * 1).attr('data-max-range', data.to * 1);
    },
    onUpdate: function (data) {
      // Called then slider is changed using Update public method
    }
  });
  var priceRangeSlideInstance = $(`#${filterPanelPriceOptionsPane.attr('id')} #price-range-slide`).data("ionRangeSlider");


  // Specification Panel Section

  function prepareSemanticTradeOptions() {
    let addedOptionsArr = [];
    tradeTypes.forEach(tradeType => {
      if (!addedOptionsArr.includes(tradeType)) {
        let option = `<option value="${tradeType}" ${(tradeType === currentTradeType)?'selected':''}>${tradeType}</option>`;
        semanticPanelTradeSelect.append(option);
        addedOptionsArr.push(tradeType);
      }
    });
  }

  function prepareSemanticCountryOptions() {
    let addedOptionsArr = [];
    taxonomyStandards.forEach(taxonomy => {
      if (!addedOptionsArr.includes(taxonomy.code_iso_3)) {
        let option = `<option value="${taxonomy.code_iso_3}" ${(taxonomy.code_iso_3 === currentCountryCode)?'selected':''}>${taxonomy.country.toString().toUpperCase().trim()}</option>`;
        semanticPanelCountrySelect.append(option);
        addedOptionsArr.push(taxonomy.code_iso_3);
      }
    });
  }

  function prepareSearchYearOptions() {
    //let currentYear = new Date().getFullYear();
    exploreShipmentSpecification.years.sort(function (a, b) {
      return b - a;
    }).forEach(year => {
      let option = `<option value="${year}" ${(currentTradeYear == year)?'selected':''}>${year}</option>`;
      semanticPanelYearSelect.append(option);
    });
  }


  // Search Panel Section

  function prepareSearchMonthStartOptions(isUpdate, selectedMonth) {
    if (!isUpdate) {
      yearMonths.forEach(yearMonth => {
        let option = `<option value="${yearMonth.id}" ${(yearMonth.id === 1)?'selected':''}>${yearMonth.month.toString().toUpperCase().trim()}</option>`;
        searchPanelMonthStartSelect.append(option);
      });
    } else {
      $(`#${searchPanelMonthStartSelect.attr('id')} > option`).each(function () {
        if (parseInt($(this).val()) > parseInt(selectedMonth)) {
          $(this).attr('disabled', 'disabled');
        } else {
          $(this).removeAttr('disabled');
        }
      });
    }
  }

  function prepareSearchMonthEndOptions(isUpdate, selectedMonth) {
    if (!isUpdate) {
      yearMonths.forEach(yearMonth => {
        let option = `<option value="${yearMonth.id}" ${(yearMonth.id === 11)?'selected':''} ${(yearMonth.id === 12)?'disabled':''}>${yearMonth.month.toString().toUpperCase().trim()}</option>`;
        searchPanelMonthEndSelect.append(option);
      });
    } else {
      $(`#${searchPanelMonthEndSelect.attr('id')} > option`).each(function () {
        if (parseInt($(this).val()) < parseInt(selectedMonth)) {
          $(this).attr('disabled', 'disabled');
        } else {
          $(this).removeAttr('disabled');
        }
      });
    }
  }

  function prepareAutoSearchTermFieldOptions(searchOptions, termTypeAlias) {
    //// console.log(searchOptions);
    let searchBox = $(`#input-${termTypeAlias}`);
    let fieldOptions = searchOptions;
    let fieldOptionViews = '';
    searchBox.find('option:not(:selected)').remove();
    //// console.log(currentTermValue);
    let preSelectedOptions = [];
    if (Array.isArray(currentTermValue)) {
      preSelectedOptions = currentTermValue;
    }
    fieldOptions.forEach(fieldOption => {
      if (fieldOption._id != null && !preSelectedOptions.includes(fieldOption._id)) {
        let option = `<option value="${fieldOption._id}">
            ${fieldOption._id.toString().toUpperCase().trim()}
          </option>`;
        fieldOptionViews = fieldOptionViews + option;
      }
    });
    searchBox.append(fieldOptionViews);
    //searchBox.prop('disabled', false);
    //searchBox.selectpicker('show');
    if (searchBox) {
      searchBox.selectpicker('refresh');
    }

    $(`.value-swapper[data-alias="${termTypeAlias}"] .dropdown-menu .inner[role="listbox"] .search-progress`).hide();
    $(`.value-swapper[data-alias="${termTypeAlias}"] .dropdown-menu .inner[role="listbox"] .dropdown-menu`).show();
  }

  function prepareSearchTermFieldOptions(termTypeAlias) {
    let fieldOptions = [];
    switch (termTypeAlias) {
      case 'BUYER':
        fieldOptions = exploreShipmentStatisticsFieldOptions.SEARCH_BUYERS;
        break;
      case 'SELLER':
        fieldOptions = exploreShipmentStatisticsFieldOptions.SEARCH_SELLERS;
        break;
      default:
        break;
    }
    let fieldOptionViews = '';
    fieldOptions.forEach(fieldOption => {
      if (fieldOption._id != null) {
        let option = `<option value="${fieldOption._id}">
            ${fieldOption._id.toString().toUpperCase().trim()}
          </option>`;
        fieldOptionViews = fieldOptionViews + option;
      }
    });
    $(`#input-${termTypeAlias}`).append(fieldOptionViews);
    $(`#input-${termTypeAlias}`).selectpicker();
  }

  function prepareSearchTermValueSwappers(searchTermTypes) {
    searchPanelTermValueSwapperContainer.empty();
    let currentlySelectedTermType = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`).val();
    searchTermTypes.forEach(searchTermType => {
      switch (searchTermType.template) {
        case SHIPMENT_RESULT_TYPE_RECORDS: {
          switch (searchTermType.query) {
            case SHIPMENT_QUERY_TYPE_SEARCH: {

              let termValueInput = `<div class="value-swapper" data-template="${searchTermType.template}" data-query="${searchTermType.query}" data-term="${searchTermType.field}"
                  ${(currentlySelectedTermType!=searchTermType.field)?'hidden':''} >
                  <label for="input-${searchTermType.field}" class="mr-2">Enter Search Term</label>
                  <input type="search" class="form-control" id="input-${searchTermType.field}" data-identifier="${searchTermType.identifier}"
                    placeholder="Start Typing ${searchTermType.field.replace(/_/gi,' ').toString().toUpperCase().trim()} ..." style="width:100%"></input>
                </div>`;
              searchPanelTermValueSwapperContainer.append(termValueInput);

              if (searchTermType.searchType && searchTermType.searchType.length > 0) {
                searchPanelTermValueSwapperContainer.find(`.value-swapper[data-term="${searchTermType.field}"]`).append(`<select class="custom-select" style="width: 25%; position: absolute;right: 0.7rem;top: 1.8rem;"> </select>`);
                searchTermType.searchType.forEach(searchFieldType => {
                  let option = `<option value="${searchFieldType.type}" data-identifier="${searchFieldType.type}">
                      ${searchFieldType.type.replace(/_/gi,' ').toString().toUpperCase().trim()}
                    </option>`;
                  searchPanelTermValueSwapperContainer.find(`.value-swapper[data-term="${searchTermType.field}"] select`).append(option);
                });
              }

              break;
            }
            case SHIPMENT_QUERY_TYPE_CHOOSE: {
              let termValueInput = `
                <div class="value-swapper form-group" data-template="${searchTermType.template}" data-query="${searchTermType.query}" data-term="${searchTermType.field}"
                  data-identifier="${searchTermType.identifier}" data-alias="${searchTermType.alias}"  ${(currentlySelectedTermType!=searchTermType.field)?'hidden':''}>
                  <label for="input-${searchTermType.alias}" class="mr-2">Choose Search Term</label>
                  <select title="Start Typing ..." multiple data-live-search="true"  noneResultsText="Searching ....." data-selected-text-format="count > 3"
                    data-style="btn-light" id="input-${searchTermType.alias}" data-identifier="${searchTermType.identifier}"
                    data-actions-box="true" data-divider="true" header="true"
                    class="form-control" style="width:100%">
                  </select>
                  <div class="selected-value"></div>
                </div>`;
              searchPanelTermValueSwapperContainer.append(termValueInput);

              $(`#input-${searchTermType.alias}`).selectpicker({
                //maxOptions: 10
              });
              $(`.value-swapper[data-alias="${searchTermType.alias}"] .dropdown-menu .inner[role="listbox"]`).append(`
              <div class="search-progress" style="display:none;text-align: center;min-height: 100%;justify-content: center;align-items: center;">
                <div class="progress-loader spinner-grow text-primary m-2" role="status" style="display: inline-block;"></div>
              </div>`);
              $(`.value-swapper[data-alias="${searchTermType.alias}"] .bs-searchbox`).append(`
              <button type="button" class="cta-search-term btn btn-success waves-effect waves-light mr-1" style="display:none;position: absolute;top: 0.6rem;right: 0.4rem;z-index: 4;"><i class="far fa-hand-point-up"></i></button>`);

              break;
            }
            default:
              break;
          }
          break;
        }
        case SHIPMENT_RESULT_TYPE_STATISTICS: {
          break;
        }
        default:
          break;
      }
    });
  }

  function prepareSearchTermTypeOptions() {
    exploreShipmentSpecification.search_field_semantic.forEach(searchFieldSemantic => {
      let option = `<option value="${searchFieldSemantic.field}" data-template="${searchFieldSemantic.template}" data-query="${searchFieldSemantic.query}"
          data-alias="${searchFieldSemantic.alias}" data-identifier="${searchFieldSemantic.identifier}">
          ${searchFieldSemantic.field.replace(/_/gi,' ').toString().toUpperCase().trim()}
        </option>`;
      searchPanelTermTypeSelect.append(option);
    });
    prepareSearchTermValueSwappers(exploreShipmentSpecification.search_field_semantic);
  }

  function prepareFilterTypeOptions() {
    exploreShipmentSpecification.filter_field_semantic.forEach(filterFieldSemantic => {
      filterPanelCTAButtons.find(`button[data-identifier="${filterFieldSemantic.identifier}"]`).show();
    });
  }

  // Summarization Panel Section

  function attachSummarization(summarization) {
    summaryPanelRecordLoader.hide();
    summaryPanelRecordContainer.show();
    if (summarization.SUMMARY_RECORDS != null || summarization.SUMMARY_RECORDS != undefined) {
      summaryPanelRecordCounter.text(summarization.SUMMARY_RECORDS);
      currentSummarizedRecords = summarization.SUMMARY_RECORDS;
    } else {
      summaryPanelRecordCounter.text('N/A');
    }

    summaryPanelShipmentLoader.hide();
    summaryPanelShipmentContainer.show();
    if (summarization.SUMMARY_SHIPMENTS != null || summarization.SUMMARY_SHIPMENTS != undefined) {
      summaryPanelShipmentCounter.text(summarization.SUMMARY_SHIPMENTS);
    } else {
      summaryPanelShipmentCounter.text('N/A');
    }

    summaryPanelHsCodeLoader.hide();
    summaryPanelHsCodeContainer.show();
    if (summarization.SUMMARY_HS_CODE != null || summarization.SUMMARY_HS_CODE != undefined) {
      summaryPanelHsCodeCounter.text(summarization.SUMMARY_HS_CODE);
    } else {
      summaryPanelHsCodeCounter.text('N/A');
    }

    summaryPanelBuyerLoader.hide();
    summaryPanelBuyerContainer.show();
    if (summarization.SUMMARY_BUYERS != null || summarization.SUMMARY_BUYERS != undefined) {
      summaryPanelBuyerCounter.text(summarization.SUMMARY_BUYERS);
    } else {
      summaryPanelBuyerCounter.text('N/A');
    }

    summaryPanelSellerLoader.hide();
    summaryPanelSellerContainer.show();
    if (summarization.SUMMARY_SELLERS != null || summarization.SUMMARY_SELLERS != undefined) {
      summaryPanelSellerCounter.text(summarization.SUMMARY_SELLERS);
    } else {
      summaryPanelSellerCounter.text('N/A');
    }
  }

  function detachSummarization() {
    summaryPanelRecordLoader.show();
    summaryPanelRecordContainer.hide();
    summaryPanelRecordCounter.text('');

    summaryPanelShipmentLoader.show();
    summaryPanelShipmentContainer.hide();
    summaryPanelShipmentCounter.text('');

    summaryPanelHsCodeLoader.show();
    summaryPanelHsCodeContainer.hide();
    summaryPanelHsCodeCounter.text('');

    summaryPanelBuyerLoader.show();
    summaryPanelBuyerContainer.hide();
    summaryPanelBuyerCounter.text('');

    summaryPanelSellerLoader.show();
    summaryPanelSellerContainer.hide();
    summaryPanelSellerCounter.text('');
  }


  // Result Records Filter Panel Section

  function freshenResultsRecordsFilters() {
    let filterPanelHsCodeOptions = $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options`);
    filterPanelHsCodeOptions.empty();

    let filterPanelCountryOptions = $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options`);
    filterPanelCountryOptions.empty();

    let filterPanelPortOptions = $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options`);
    filterPanelPortOptions.empty();

    let filterPanelMonthOptions = $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options`);
    filterPanelMonthOptions.empty();

    filterPanelQuantityUnitSelect.empty();

    filterPanelPriceCurrencySelect.empty();
  }

  function grabResultRecordsSelectedFilters() {

    let selectedHsCodeFilters = [];
    $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      selectedHsCodeFilters.push(parseInt($(this).attr('id')));
    });

    let selectedCountryFilters = [];
    $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      selectedCountryFilters.push($(this).attr('id'));
    });

    let selectedPortFilters = [];
    $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      selectedPortFilters.push($(this).attr('id'));
    });

    let selectedMonthFilters = [];
    $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      selectedMonthFilters.push($(this).attr('id').toUpperCase());
    });

    let selectedQuantityFilter = {};
    let selectedQuantityOption = $(`#${filterPanelQuantityUnitSelect.attr('id')} option:selected`);
    if (selectedQuantityOption.val() != null && selectedQuantityOption.val() != undefined) {
      if (selectedQuantityOption.val() != 'DEFAULT') {
        selectedQuantityFilter.unit = selectedQuantityOption.val();
        selectedQuantityFilter.minRange = parseInt(selectedQuantityOption.attr('data-min-range') * 1);
        selectedQuantityFilter.maxRange = parseInt(selectedQuantityOption.attr('data-max-range') * 1);
      }
    }

    let selectedPriceFilter = {};
    let selectedPriceOption = $(`#${filterPanelPriceCurrencySelect.attr('id')} option:selected`);
    if (selectedPriceOption.val() != null && selectedQuantityOption.val() != undefined) {
      if (selectedPriceOption.val() != 'DEFAULT') {
        selectedPriceFilter.currency = selectedPriceOption.val();
        selectedPriceFilter.minRange = parseInt(selectedPriceOption.attr('data-min-range') * 1);
        selectedPriceFilter.maxRange = parseInt(selectedPriceOption.attr('data-max-range') * 1);
      }
    }

    return {
      filterHsCode: selectedHsCodeFilters,
      filterCountry: selectedCountryFilters,
      filterPort: selectedPortFilters,
      filterMonth: selectedMonthFilters,
      filterQuantity: selectedQuantityFilter,
      filterPrice: selectedPriceFilter
    };
  }

  function activateResultRecordsFilters() {
    if (shipmentMasterFilterSet.FILTER_HS_CODE != null || shipmentMasterFilterSet.FILTER_HS_CODE != undefined) {
      let hsCodeTree = {};
      let hsCodeTreeCounter = {};
      shipmentMasterFilterSet.FILTER_HS_CODE.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {

        let hsCodeMaster = filterValue._id.toString().toUpperCase().trim().substr(0, 2);
        let hsCodeGroup = filterValue._id.toString().toUpperCase().trim().substr(0, 4);
        let hsCodeSub = filterValue._id.toString().toUpperCase().trim();

        if (!hsCodeTree.hasOwnProperty(hsCodeMaster)) {
          hsCodeTree[hsCodeMaster] = {};
          hsCodeTreeCounter[hsCodeMaster] = 0;
        }
        if (!hsCodeTree[hsCodeMaster].hasOwnProperty(hsCodeGroup)) {
          hsCodeTree[hsCodeMaster][hsCodeGroup] = [];
          hsCodeTreeCounter[hsCodeMaster + '_' + hsCodeGroup] = 0;
        }

        hsCodeTreeCounter[hsCodeMaster] += filterValue.count;
        hsCodeTreeCounter[hsCodeMaster + '_' + hsCodeGroup] += filterValue.count;

        hsCodeTree[hsCodeMaster][hsCodeGroup].push({
          _id: hsCodeSub,
          count: filterValue.count,
          isSelected: false
        });
      });
      let shipmentFilterHsCodeTree = hsCodeTree; //formulateDataMasterGroupSubCountNesting(shipmentMasterFilterSet.FILTER_HS_CODE, 2, 4);

      let filterPanelHsCodeOptions = $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options`);
      let isFilterHsCodeSet = (filterPanelHsCodeOptions.find('.checkbox').length > 0) ? true : false;
      if (isFilterHsCodeSet) {
        filterPanelHsCodeOptions.find('label span b').text(`0`);
        filterPanelHsCodeOptions.find('.dd-handle-exit span b').text(`0`);
        $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          let attachedHsCode = $(this).find('input').attr('id');
          /*$(this).closest(`li[data-id="${attachedHsCode.toString().toUpperCase().trim().substr(0, 2)}"]`).find('.dd-handle-exit span b').first().text(`0`);
          $(this).closest(`li[data-id="${attachedHsCode.toString().toUpperCase().trim().substr(0, 4)}"]`).find('.dd-handle-exit span b').first().text(`0`);
          $(this).find('label span b').text(`0`);*/
          for (const hsCodeMaster in shipmentFilterHsCodeTree) {
            if (shipmentFilterHsCodeTree.hasOwnProperty(hsCodeMaster)) {
              for (const hsCodeGroup in shipmentFilterHsCodeTree[hsCodeMaster]) {
                if (shipmentFilterHsCodeTree[hsCodeMaster].hasOwnProperty(hsCodeGroup)) {
                  shipmentFilterHsCodeTree[hsCodeMaster][hsCodeGroup].forEach(hsCode => {
                    if ($(this).find('input').attr('id') == hsCode._id) {
                      $(this).find('label span b').text(`${hsCode.count}`);

                      $(this).closest(`li[data-id="${hsCodeMaster}"]`).find('.dd-handle-exit span b').first().text(hsCodeTreeCounter[hsCodeMaster]);
                      $(this).closest(`li[data-id="${hsCodeGroup}"]`).find('.dd-handle-exit span b').first().text(hsCodeTreeCounter[hsCodeMaster + '_' + hsCodeGroup]);
                    }
                  });
                }
              }
            }
          }
        });
        $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options ol>li`).each(function (index, value) {
          //$(this).find('.dd-handle-exit span b').text(`0`);

        });
      } else {
        let masterItems = '';
        for (const hsCodeMaster in shipmentFilterHsCodeTree) {
          if (shipmentFilterHsCodeTree.hasOwnProperty(hsCodeMaster)) {
            let groupItems = '';
            for (const hsCodeGroup in shipmentFilterHsCodeTree[hsCodeMaster]) {
              if (shipmentFilterHsCodeTree[hsCodeMaster].hasOwnProperty(hsCodeGroup)) {
                var subItems = '';
                shipmentFilterHsCodeTree[hsCodeMaster][hsCodeGroup].forEach(hsCode => {
                  let item = `
                  <li class="dd-item" data-id="${hsCode._id}">
                    <div class="dd-handle-exit">
                        <div class="checkbox checkbox-primary">
                          <input class="filter-hscode-checkbox" id="${hsCode._id}" type="checkbox">
                          <label for="${hsCode._id}" class="text-dark">${hsCode._id.toString().toUpperCase().trim()}
                            <span class="text-muted float-right"><b>${hsCode.count}</b></span>
                          </label>
                        </div>
                    </div>
                  </li>
                  `;
                  subItems = subItems + item;
                });
                let item = `
                  <li class="dd-item dd-collapsed" data-id="${hsCodeGroup}">
                    <div class="dd-handle-exit">
                      ${hsCodeGroup}
                      <span class="text-muted float-right"><b>${hsCodeTreeCounter[hsCodeMaster+'_'+hsCodeGroup]}</b></span>
                    </div>
                    <ol class="dd-list no-drag">
                      ${subItems}
                    </ol>
                  </li>
                `;
                groupItems = groupItems + item;
              }
            }
            let item = `
              <li class="dd-item dd-collapsed" data-id="${hsCodeMaster}">
                <div class="dd-handle-exit">
                  ${hsCodeMaster}
                  <span class="text-muted float-right"><b>${hsCodeTreeCounter[hsCodeMaster]}</b></span>
                </div>
                <ol class="dd-list no-drag">
                  ${groupItems}
                </ol>
              </li>
            `;
            masterItems = masterItems + item;
          }
        }
        let hsCodeNestedList = `
          <div class="custom-dd dd" id="filter-hscode-nested-list">
            <ol class="dd-list no-drag">
              ${masterItems}
            </ol>
          </div>
        `;
        filterPanelHsCodeOptions.html(hsCodeNestedList);
        $('.dd').nestable({
          maxDepth: 0,
          noDragClass: 'no-drag'
        });
      }
    }


    if (shipmentMasterFilterSet.FILTER_COUNTRY != null || shipmentMasterFilterSet.FILTER_COUNTRY != undefined) {
      let filterPanelCountryOptions = $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options`);
      let isFilterCountrySet = (filterPanelCountryOptions.find('.checkbox').length > 0) ? true : false;
      if (isFilterCountrySet) {
        $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          $(this).find('label span b').text(`0`);
          shipmentMasterFilterSet.FILTER_COUNTRY.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).find('input').attr('id') == filterValue._id) {
              $(this).find('label span b').text(`${filterValue.count}`);
            }
          });
        });
      } else {
        shipmentMasterFilterSet.FILTER_COUNTRY.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
          let optionItem = `
            <div class="checkbox checkbox-primary mb-2">
              <input class="filter-country-checkbox" id="${filterValue._id}" type="checkbox">
              <label for="${filterValue._id}" class="text-dark">${filterValue._id.toString().toUpperCase().trim()}
                <span class="text-muted float-right"><b>${filterValue.count}</b></span>
              </label>
            </div>`;
          filterPanelCountryOptions.append(optionItem);
        });
      }
    }


    if (shipmentMasterFilterSet.FILTER_PORT != null || shipmentMasterFilterSet.FILTER_PORT != undefined) {
      let filterPanelPortOptions = $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options`);
      let isFilterPortSet = (filterPanelPortOptions.find('.checkbox').length > 0) ? true : false;
      if (isFilterPortSet) {
        $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          $(this).find('label span b').text(`0`);
          shipmentMasterFilterSet.FILTER_PORT.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).find('input').attr('id') == filterValue._id) {
              $(this).find('label span b').text(`${filterValue.count}`);
            }
          });
        });
      } else {
        shipmentMasterFilterSet.FILTER_PORT.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
          let optionItem = `
            <div class="checkbox checkbox-primary mb-2">
              <input class="filter-port-checkbox" id="${filterValue._id}" type="checkbox">
              <label for="${filterValue._id}" class="text-dark">${filterValue._id.toString().toUpperCase().trim()}
                <span class="text-muted float-right"><b>${filterValue.count}</b></span>
              </label>
            </div>`;
          filterPanelPortOptions.append(optionItem);
        });
      }
    }


    if (shipmentMasterFilterSet.FILTER_MONTH != null || shipmentMasterFilterSet.FILTER_MONTH != undefined) {
      shipmentMasterFilterSet.FILTER_MONTH.sort(function (a, b) {
        const x = a._id;
        const y = b._id;

        let comparison = 0;
        if (x > y) {
          comparison = 1;
        } else if (x < y) {
          comparison = -1;
        }
        return comparison;
      });
      let filterPanelMonthOptions = $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options`);
      let isFilterMonthSet = (filterPanelMonthOptions.find('.checkbox').length > 0) ? true : false;
      if (isFilterMonthSet) {
        $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          $(this).find('label span b').text(`0`);
          shipmentMasterFilterSet.FILTER_MONTH.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).find('input').attr('id') == filterValue._id) {
              $(this).find('label span b').text(`${filterValue.count}`);
            }
          });
        });
      } else {
        shipmentMasterFilterSet.FILTER_MONTH.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
          let monthLiteral = yearMonths.filter(month => month.id == filterValue._id)[0];
          let optionItem = `
            <div class="checkbox checkbox-primary mb-2">
              <input class="filter-month-checkbox" id="${filterValue._id}" type="checkbox">
              <label for="${filterValue._id}" class="text-dark">${monthLiteral.month.toString().toUpperCase().trim()}
                <span class="text-muted float-right"><b>${filterValue.count}</b></span>
              </label>
            </div>`;
          filterPanelMonthOptions.append(optionItem);
        });
      }
    }


    if (shipmentMasterFilterSet.FILTER_UNIT_QUANTITY != null || shipmentMasterFilterSet.FILTER_UNIT_QUANTITY != undefined) {
      let isFilterQuantitySet = (filterPanelQuantityUnitSelect.find('option').length > 0) ? true : false;
      if (isFilterQuantitySet) {
        $(`#${filterPanelQuantityUnitSelect.attr('id')} option`).each(function (index, value) {
          $(this).attr('data-min-range', `0`);
          $(this).attr('data-from-range', `0`);
          $(this).attr('data-max-range', `0`);
          $(this).attr('data-to-range', `0`);
          shipmentMasterFilterSet.FILTER_UNIT_QUANTITY.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).attr('value') == filterValue._id) {
              $(this).attr('data-min-range', `${filterValue.minRange}`);
              $(this).attr('data-from-range', `${filterValue.minRange}`);
              $(this).attr('data-max-range', `${filterValue.maxRange}`);
              $(this).attr('data-to-range', `${filterValue.maxRange}`);
            }
          });
        });
      } else {
        let optionUnitDefault = `<option value="DEFAULT" data-min-range="0" data-max-range="0"
          data-from-range="0" data-to-range="0" selected>None Selected</option>`;
        filterPanelQuantityUnitSelect.append(optionUnitDefault);
        $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options-range`).hide();
        shipmentMasterFilterSet.FILTER_UNIT_QUANTITY.forEach(filterValue => {
          let optionItem = `<option value="${filterValue._id}"
              data-min-range="${filterValue.minRange}" data-max-range="${filterValue.maxRange}"
              data-from-range="${filterValue.minRange}" data-to-range="${filterValue.maxRange}">${filterValue._id.toString().toUpperCase().trim()}</option>`;
          filterPanelQuantityUnitSelect.append(optionItem);
        });
      }
    }


    let combinedPriceFilters = [];
    for (const prop in shipmentMasterFilterSet) {
      if (shipmentMasterFilterSet[prop].length > 0 && shipmentMasterFilterSet[prop][0].hasOwnProperty('metaTag')) {
        if (shipmentMasterFilterSet[prop][0].metaTag.length > 0 && shipmentMasterFilterSet[prop][0].metaTag[0].hasOwnProperty('currency')) {
          let filter = {
            _id: shipmentMasterFilterSet[prop][0].metaTag[0].currency,
            minRange: shipmentMasterFilterSet[prop][0].minRange,
            maxRange: shipmentMasterFilterSet[prop][0].maxRange
          };
          combinedPriceFilters.push(filter);
        }
      }
    }

    if (combinedPriceFilters.length > 0) {
      let isFilterPriceSet = (filterPanelPriceCurrencySelect.find('option').length > 0) ? true : false;
      if (isFilterPriceSet) {
        $(`#${filterPanelPriceCurrencySelect.attr('id')} option`).each(function (index, value) {
          $(this).attr('data-min-range', `0`);
          $(this).attr('data-from-range', `0`);
          $(this).attr('data-max-range', `0`);
          $(this).attr('data-to-range', `0`);
          combinedPriceFilters.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).attr('value') == filterValue._id) {
              $(this).attr('data-min-range', `${filterValue.minRange}`);
              $(this).attr('data-from-range', `${filterValue.minRange}`);
              $(this).attr('data-max-range', `${filterValue.maxRange}`);
              $(this).attr('data-to-range', `${filterValue.maxRange}`);
            }
          });
        });
      } else {
        let optionCurrencyDefault = `<option value="DEFAULT" data-min-range="0" data-max-range="0"
          data-from-range="0" data-to-range="0" selected>None Selected</option>`;
        filterPanelPriceCurrencySelect.append(optionCurrencyDefault);
        $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options-range`).hide();
        combinedPriceFilters.forEach(filterValue => {
          let optionItem = `<option value="${filterValue._id}"
              data-min-range="${filterValue.minRange/1}" data-max-range="${filterValue.maxRange/1}"
              data-from-range="${filterValue.minRange/1}" data-to-range="${filterValue.maxRange/1}">${filterValue._id.toString().toUpperCase().trim()}</option>`;
          filterPanelPriceCurrencySelect.append(optionItem);
        });
      }

    }

  }



  // Taxonomy Search-Filter Data-Mapper

  function formulateDataTradersAggregationPayload() {
    return exploreShipmentSpecification.traders_aggregation;
  }

  function formulateDataShipmentPayload(shipmentResultType) {
    let payload = null;
    if (shipmentResultType === SHIPMENT_RESULT_TYPE_RECORDS) {
      payload = JSON.parse(JSON.stringify(exploreShipmentSpecification.records_aggregation));
    } else if (shipmentResultType === SHIPMENT_RESULT_TYPE_STATISTICS) {
      payload = JSON.parse(JSON.stringify(exploreShipmentSpecification.statistics_aggregation));
    }

    let appliedFilters = grabResultRecordsSelectedFilters();

    let aggregationPayload = {
      recordSetKey: payload.recordSetKey,
      sortTerm: payload.sortTerm,
      matchExpressions: [],
      groupExpressions: [],
      projectionExpressions: []
    };

    // Collect Search Term
    let matchClauseSearchTerm = payload.matchExpressions.filter(expression => expression.identifier === currentTermIdentifier)[0];
    // TODO: CONSIDER SINGLE VALUE OR ARRAY VALUE

    if (matchClauseSearchTerm.identifier == "SEARCH_HS_CODE") {
      if (appliedFilters.filterHsCode.length == 0) {
        let digitsCount = currentTermValue.length;
        let leftValue = currentTermValue;
        let rightValue = currentTermValue;
        for (let index = digitsCount + 1; index <= 8; index++) {
          leftValue += 0;
          rightValue += 9;
        }
        matchClauseSearchTerm.fieldValueLeft = Number(leftValue);
        matchClauseSearchTerm.fieldValueRight = Number(rightValue);
        aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
      }
    } else if (matchClauseSearchTerm.identifier == "SEARCH_PRODUCT_DESCRIPTION") {
      let additionalTextMatchClauseSearchTerm = JSON.parse(JSON.stringify(matchClauseSearchTerm));
      matchClauseSearchTerm.fieldValue = currentTermValue;
      let selectedSearchType = $(`.value-swapper[data-term="PRODUCT_DESCRIPTION"] select option:selected`);
      if (selectedSearchType.val() == "EXACT") {
        matchClauseSearchTerm.expressionType = 200;
        if (currentTermValue) {
          aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
        }
      } else if (selectedSearchType.val() == "OR") {
        matchClauseSearchTerm.expressionType = 201;
        if (currentTermValue) {
          if (currentTermValue.trim().split(' ').length == 1) {
            matchClauseSearchTerm.expressionType = 200;
          }
          aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
        }
      } else if (selectedSearchType.val() == "AND") {
        matchClauseSearchTerm.expressionType = 202;
        additionalTextMatchClauseSearchTerm.expressionType = 201;
        additionalTextMatchClauseSearchTerm.fieldValue = currentTermValue;
        if (currentTermValue) {
          if (currentTermValue.trim().split(' ').length == 1) {
            matchClauseSearchTerm.expressionType = 200;
            aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
          } else {
            aggregationPayload.matchExpressions.push(additionalTextMatchClauseSearchTerm);
            aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
          }
        }
      }

    } else {
      matchClauseSearchTerm.fieldValue = currentTermValue;
      if (currentTermValue) {
        aggregationPayload.matchExpressions.push(matchClauseSearchTerm);
      }
    }

    // Pre-Date Fixture
    /*if (appliedFilters.filterMonth.length == 0) {
      // Collect Month Term
      let matchClauseSearchMonth = payload.matchExpressions.filter(expression => expression.identifier === 'SEARCH_MONTH_RANGE')[0];
      let signal = -1;
      yearMonths.sort(arrayObjectKeyIdAscendingSort).forEach(month => {
        if (signal === -1) {
          if (month.id == currentStartMonth) signal = 0;
        }
        if (signal === 0) matchClauseSearchMonth.fieldValue.push(month.alias.toString().toUpperCase().trim());
        if (month.id == currentEndMonth) signal = 1;
      });
      if (matchClauseSearchMonth.fieldValue.length != 12) {
        aggregationPayload.matchExpressions.push(matchClauseSearchMonth);
      }
    }*/

    if (appliedFilters.filterMonth.length == 0) {
      // Collect Month Term
      let matchClauseSearchMonth = payload.matchExpressions.filter(expression => expression.identifier === 'SEARCH_MONTH_RANGE')[0];
      let caliberatedStartMonth = currentStartMonth;
      let caliberatedEndMonth = currentEndMonth;
      if (currentStartMonth == 1 && currentEndMonth == 12) {
        // Efficient ByPass As Per Bucketing Pattern
      } else {
        let caliberatedEndMonthMaxDay = new Date(currentTradeYear, caliberatedEndMonth, 0).getDate();
        matchClauseSearchMonth.fieldValueLeft =
          currentTradeYear.toString().concat('-', caliberatedStartMonth.length > 1 ? caliberatedStartMonth.toString() : '0'.concat(caliberatedStartMonth.toString()), '-', '01');
        matchClauseSearchMonth.fieldValueRight =
          currentTradeYear.toString().concat('-', caliberatedEndMonth.length > 1 ? caliberatedEndMonth.toString() : '0'.concat(caliberatedEndMonth.toString()), '-', caliberatedEndMonthMaxDay.toString());
        aggregationPayload.matchExpressions.push(matchClauseSearchMonth);
      }

    }

    // Collect Filter Terms
    if (exploreShipmentSpecification.filter_field_semantic != null && exploreShipmentSpecification.filter_field_semantic.length > 0) {

      exploreShipmentSpecification.filter_field_semantic.forEach(filterFieldSemantic => {
        switch (filterFieldSemantic.identifier) {
          case 'FILTER_HS_CODE': {
            let matchClauseFilterHsCode = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_HS_CODE')[0];
            if (appliedFilters.filterHsCode.length > 0) {
              matchClauseFilterHsCode.fieldValue = appliedFilters.filterHsCode;
              aggregationPayload.matchExpressions.push(matchClauseFilterHsCode);
              isHsCodeFiltered = true;
            }
            break;
          }
          case 'FILTER_COUNTRY': {
            let matchClauseFilterCountry = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_COUNTRY')[0];
            if (appliedFilters.filterCountry.length > 0) {
              matchClauseFilterCountry.fieldValue = appliedFilters.filterCountry;
              aggregationPayload.matchExpressions.push(matchClauseFilterCountry);
            }
            break;
          }
          case 'FILTER_PORT': {
            let matchClauseFilterPort = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_PORT')[0];
            if (appliedFilters.filterPort.length > 0) {
              matchClauseFilterPort.fieldValue = appliedFilters.filterPort;
              aggregationPayload.matchExpressions.push(matchClauseFilterPort);
            }
            break;
          }
          case 'FILTER_MONTH': {
            /*let matchClauseFilterMonth = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_MONTH')[0];
            if (appliedFilters.filterMonth.length > 0) {
              matchClauseFilterMonth.fieldValue = appliedFilters.filterMonth;
              aggregationPayload.matchExpressions.push(matchClauseFilterMonth);
              isMonthFiltered = true;
            }*/


            if (appliedFilters.filterMonth.length > 0) {
              let matchClauseFilterMonth = JSON.parse(JSON.stringify(payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_MONTH')[0]));
              let matchClauseFilterMonthOrArrs = [];
              appliedFilters.filterMonth.forEach(month => {
                let caliberatedEndMonthMaxDay = new Date(currentTradeYear, month, 0).getDate();
                let fieldValues = {};
                fieldValues.fieldValueLeft =
                  currentTradeYear.toString().concat('-', month.toString().length > 1 ? month.toString() : '0'.concat(month.toString()), '-', '01');
                fieldValues.fieldValueRight =
                  currentTradeYear.toString().concat('-', month.toString().length > 1 ? month.toString() : '0'.concat(month.toString()), '-', caliberatedEndMonthMaxDay.toString());
                // console.log(matchClauseFilterMonth);
                matchClauseFilterMonthOrArrs.push(fieldValues);
              });
              matchClauseFilterMonth.fieldValues = matchClauseFilterMonthOrArrs;
              aggregationPayload.matchExpressions.push(matchClauseFilterMonth);
              isMonthFiltered = true;
            }
            break;
          }
          case 'FILTER_UNIT': {
            let matchClauseFilterUnit = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_UNIT')[0];
            if (!(Object.entries(appliedFilters.filterQuantity).length === 0 && appliedFilters.filterQuantity.constructor === Object)) {
              matchClauseFilterUnit.fieldValue = appliedFilters.filterQuantity.unit;
              aggregationPayload.matchExpressions.push(matchClauseFilterUnit);
            }
            break;
          }
          case 'FILTER_QUANTITY': {
            if (!(Object.entries(appliedFilters.filterQuantity).length === 0 && appliedFilters.filterQuantity.constructor === Object)) {
              let matchClauseFilterQuantity = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_QUANTITY')[0];

              matchClauseFilterQuantity.fieldValueLeft = appliedFilters.filterQuantity.minRange;
              matchClauseFilterQuantity.fieldValueRight = appliedFilters.filterQuantity.maxRange;
              aggregationPayload.matchExpressions.push(matchClauseFilterQuantity);
            }
            break;
          }
          case 'FILTER_PRICE': {
            if (!(Object.entries(appliedFilters.filterPrice).length === 0 && appliedFilters.filterPrice.constructor === Object)) {
              if (filterFieldSemantic.metaTag === appliedFilters.filterPrice.currency) {
                let matchClauseFilterCurrencyPrices = payload.matchExpressions.filter(expression => expression.identifier === 'FILTER_PRICE');
                let matchClauseFilterPrice = matchClauseFilterCurrencyPrices.filter(currencyPrice => currencyPrice.metaTag === appliedFilters.filterPrice.currency)[0];
                matchClauseFilterPrice.fieldValueLeft = appliedFilters.filterPrice.minRange;
                matchClauseFilterPrice.fieldValueRight = appliedFilters.filterPrice.maxRange;
                aggregationPayload.matchExpressions.push(matchClauseFilterPrice);
              }

            }
            break;
          }
          default:
            break;
        }
      });
    }

    aggregationPayload.groupExpressions = payload.groupExpressions;
    aggregationPayload.projectionExpressions = payload.projectionExpressions;

    return aggregationPayload;
  }

  // Result Datatable Section

  function prepareRecordsDtListColumns() {
    let columnLocater = -1;
    let expanderField = '<th></th>';
    columnLocater++;
    let selectorField = '<th></th>';
    columnLocater++;
    $(`#${recordsPanelBarSection.attr('id')} #records-table > thead > tr`).append(expanderField).append(selectorField);
    $(`#${recordsPanelBarSection.attr('id')} #records-table > tfoot > tr`).append(expanderField).append(selectorField);

    let sequencedFields = [];
    // Apply Explore Fields
    exploreShipmentSpecification.explore_fields.forEach(tableField => {
      sequencedFields.push(tableField);
    });
    // Apply All Remaining Fields
    exploreShipmentSpecification.all_fields.forEach(tableField => {
      if (tableField.toUpperCase().trim() != SHIPMENT_FIELD_RECORDS_TAG) {
        if (!sequencedFields.includes(tableField)) {
          sequencedFields.push(tableField);
        }
      }
    });

    exploreShipmentDTFields = sequencedFields;

    sequencedFields.forEach(tableField => {
      columnLocater++;
      let sanitizedField = tableField.replace(/_/gi, ' ').toString().toUpperCase().trim();
      let th = `<th value="">${sanitizedField}</th>`;
      $(`#${recordsPanelBarSection.attr('id')} #records-table > thead > tr`).append(th);
      $(`#${recordsPanelBarSection.attr('id')} #records-table > tfoot > tr`).append(th);
      $(`#${filterPanelDTListColumnOptions.attr('id')} #options`).append(`
        <div class="checkbox checkbox-success mb-2">
          <input data-column=${columnLocater} id="data-column-checkbox${columnLocater}" type="checkbox" checked>
          <label for="data-column-checkbox${columnLocater}" class="text-dark">
            ${sanitizedField} <span class="text-muted float-right"><b></b></span>
          </label>
        </div>
      `);
    });
  }

  function packDTParams() {
    let paramsObj = formulateDataShipmentPayload(SHIPMENT_RESULT_TYPE_RECORDS);
    paramsObj.tradeType = currentTradeType;
    paramsObj.countryCode = currentCountryCode;
    paramsObj.tradeYear = currentTradeYear;
    paramsObj.tradeTotalRecords = currentTotalRecords;
    return paramsObj;
  }

  function sanitizeTradeDate(value) {
    return new Date(value).toDateString();
  }

  function sanitizeHsCodeDigitBoundaries(value) {
    return '0'.repeat(exploreShipmentSpecification.hs_code_digit_classification - value.toString().length).concat(value.toString());
  }

  function sanitizeDTDataObject(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          sanitizeDTDataPacket(obj[key]);
        } else {
          if (typeof (obj[key]) === 'object' && obj[key]) {
            if (obj[key].hasOwnProperty(DECIMAL128MDB_JS_CAST)) {
              let value = obj[key];
              if (value[DECIMAL128MDB_JS_CAST] != null && value[DECIMAL128MDB_JS_CAST] != undefined) {
                obj[key] = Number(value[DECIMAL128MDB_JS_CAST]);
              }
            }
          } else {

            if (obj.hasOwnProperty(FIELD_HS_CODE)) {
              if (obj[FIELD_HS_CODE] != null && obj[FIELD_HS_CODE] != undefined) {
                obj[FIELD_HS_CODE] = sanitizeHsCodeDigitBoundaries(obj[FIELD_HS_CODE]);
              }
            }

            if (obj.hasOwnProperty(FIELD_IMP_DATE)) {
              if (obj[FIELD_IMP_DATE] != null && obj[FIELD_IMP_DATE] != undefined) {
                obj[FIELD_IMP_DATE] = sanitizeTradeDate(obj[FIELD_IMP_DATE]);
              }
            }

            if (obj.hasOwnProperty(FIELD_EXP_DATE)) {
              if (obj[FIELD_EXP_DATE] != null && obj[FIELD_EXP_DATE] != undefined) {
                obj[FIELD_EXP_DATE] = sanitizeTradeDate(obj[FIELD_EXP_DATE]);
              }
            }

            sanitizeDTDataPacket(obj[key]);
          }
        }
      } else {
        obj[key] = 0;
      }
    }
  }

  function sanitizeDTDataPacket(data) {
    let innerData = data;
    //// console.log(JSON.stringify(obj));
    if (innerData != null && innerData != undefined) {
      if (Array.isArray(innerData)) {
        innerData.forEach(obj => {
          sanitizeDTDataObject(obj);
        });
      } else if (typeof (innerData) === 'object') {
        sanitizeDTDataObject(innerData);
      }
    }
  }

  function intitialiseRecordsDTList() {
    prepareRecordsDtListColumns();

    let fieldAssigners = [{
        "className": 'details-control',
        "orderable": false,
        "searchable": false,
        "data": null,
        "defaultContent": ''
      },
      {
        "data": "_id",
        "orderable": false,
        "searchable": false,
      }
    ];

    exploreShipmentDTFields.forEach(tableField => {
      if (tableField.toUpperCase().trim() != SHIPMENT_FIELD_RECORDS_TAG) {
        fieldAssigners.push({
          //"data": tableField.replace(/_/gi, ' ').toUpperCase().trim()
          "data": tableField.toString().toUpperCase().trim()
        });
      }
    });

    recordsTable = $(`#${recordsPanelBarSection.attr('id')} #records-table`).DataTable({
      //deferLoading: -1,
      autoWidth: true,
      processing: true,
      serverSide: true,
      searching: false,
      ordering: false,
      ajax: {
        url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_RECORDS),
        contentType: "application/json",
        type: "POST",
        data: function (d) {
          detachSummarization();
          let paramsObj = packDTParams();
          paramsObj.draw = d.draw;
          paramsObj.start = d.start;
          paramsObj.length = d.length;
          return JSON.stringify(paramsObj);
        },
        dataSrc: function (json) {
          graceCloseSwal();

          //Explicit Casting decimal128: // console.log(exploreShipmentSpecification.dataTypes_fields);
          sanitizeDTDataPacket(json.data);
          sanitizeDTDataPacket(json.filter);
          json.filter.FILTER_HS_CODE.forEach(obj => {
            obj._id = sanitizeHsCodeDigitBoundaries(obj._id.toString());
          });

          shipmentComputedSummarySet = json.summary;
          if (masterDTRun) {
            masterDTRun = false;
          }
          shipmentMasterFilterSet = json.filter;
          if (isFilterRefresh) {
            freshenResultsRecordsFilters();
            isFilterRefresh = false;
          }
          if (!(Object.entries(shipmentMasterFilterSet).length === 0 && shipmentMasterFilterSet.constructor === Object)) {
            activateResultRecordsFilters();
          }
          // if (masterDTRun) {
          //   shipmentMasterFilterSet = json.filter;
          //   if (!(Object.entries(shipmentMasterFilterSet).length === 0 && shipmentMasterFilterSet.constructor === Object)) {
          //     activateResultRecordsFilters();
          //   }
          //   masterDTRun = false;
          // } else {
          //   shipmentComputedFilterSet = json.filter;
          //   if (!(Object.entries(shipmentComputedFilterSet).length === 0 && shipmentComputedFilterSet.constructor === Object)) {
          //     applyResultRecordsNarrowedFilters();
          //   }
          // }
          return json.data;
        }
      },
      columnDefs: [{
        render: function (data, type, row) {
          let isChecked = selectedShipments.includes(data);
          let checkBox = `<div>
              <input style="vertical-align: middle;" data-column="1" data-ref-id="${data}'"
              id="data-column-checkbox-${data}'" type="checkbox" ${(isChecked)?'checked':''}>
            </div>`;
          return checkBox;
        },
        targets: 1
      }],
      columns: fieldAssigners,
      //scrollX: true,
      //pagingType: "full_numbers",
      language: {
        processing: `
          <div style="margin-top:23% !important;">
              <div class="spinner-border text-light" role="status"></div>
          </div>`,
        paginate: {
          previous: "<i class='mdi mdi-chevron-left'>",
          next: "<i class='mdi mdi-chevron-right'>"
        }
      },
      drawCallback: function () {
        $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
        attachSummarization(shipmentComputedSummarySet);
        // if (!(Object.entries(shipmentMasterFilterSet).length === 0 && shipmentMasterFilterSet.constructor === Object)) {
        //   activateResultRecordsFilters();
        // } else {
        //   masterDTRun = true;
        // }
        if (recordsTable != null) {
          filterPanelBarSection.show();
          resultPanelBarSection.show();
          recordsPanelBarSection.show();
        }
        summaryPanelBarSection.show();
      }
    });

    // Add event listener for opening and closing details
    $('#records-table tbody').on('click', 'td.details-control', function () {
      var tr = $(this).closest('tr');
      var row = recordsTable.row(tr);

      if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
        tr.removeClass('shown');
      } else {
        // Open this row
        row.child(format(row.data())).show();
        tr.addClass('shown');
      }
    });

    // Toggle Data-Columns
    $('#action-right-data-column-visibility input:checkbox').on('click', function (e) {
      let column = recordsTable.column($(this).attr('data-column'));
      column.visible(!column.visible());
    });

    $('#records-table tbody').on('click', 'td input[type="checkbox"]', function () {
      var tr = $(this).closest('tr');
      var row = recordsTable.row(tr);
      let rData = row.data();
      let selectedShipmentId = rData["_id"];
      if ($(this).is(':checked')) {
        if (!selectedShipments.includes(selectedShipmentId)) selectedShipments.push(selectedShipmentId);
      } else {
        selectedShipments = selectedShipments.filter(shipmentId => shipmentId != selectedShipmentId);
      }
    });

    /*$('#records-table').on('click', '.checkbox', function (e) {
      e.stopImmediatePropagation();
      let inputBox = $(this).find('input[data-ref-id]');
      let selectedShipmentId = inputBox.attr('data-ref-id');
      if (inputBox.hasClass('selectedShipment')) {
        inputBox.removeClass('selectedShipment');
        selectedShipments = selectedShipments.filter(shipmentId => shipmentId != selectedShipmentId);

      } else {
        selectedShipments.push(selectedShipmentId);
        inputBox.addClass('selectedShipment');
      }
      //recordsTable.rows('.selectedShipment').select();
    });*/

    // Format Maker For Expandable Row Layout
    function format(d) {
      // `d` is the original data object for the row
      return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
        '<tr>' +
        '<td>HS CODE:</td>' +
        '<td>' + d.HS_CODE + '</td>' +
        '</tr>' +
        '<tr>' +
        '<td>PRODUCT_DESCRIPTION:</td>' +
        '<td>' + d.PRODUCT_DESCRIPTION + '</td>' +
        '</tr>' +
        '</table>';
    }
  }

  function freshenRecordsDTList() {
    if (recordsTable != null) {
      recordsTable.clear();
    }
  }

  function destroyRecordsDTList() {
    if (recordsTable != null) {
      recordsTable.clear().destroy();
      recordsTable = null;
    }
  }

  function triggerRecordsDTListFetch() {
    if (recordsTable != null) {
      recordsTable.clear();
      recordsTable.columns.adjust().draw();
    }
  }


  // Result Statistics Section

  function attachShipmentStatisticsDTList(shipmentStatisticsAggregation) {

    shipmentComputedSummarySet = shipmentStatisticsAggregation.summary;
    shipmentMasterFilterSet = shipmentStatisticsAggregation.filter;

    attachSummarization(shipmentComputedSummarySet);

    if (!(Object.entries(shipmentMasterFilterSet).length === 0 && shipmentMasterFilterSet.constructor === Object)) {
      activateResultRecordsFilters();
    }

    if (shipmentStatisticsAggregation.filter.FILTER_HS_CODE != null || shipmentStatisticsAggregation.filter.FILTER_HS_CODE != undefined) {
      let hsCodeGroupTreeCounter = {};
      shipmentStatisticsAggregation.filter.FILTER_HS_CODE.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
        let hsCodeGroup = filterValue._id.toString().toUpperCase().trim().substr(0, 4);
        if (!hsCodeGroupTreeCounter.hasOwnProperty(hsCodeGroup)) {
          hsCodeGroupTreeCounter[hsCodeGroup] = 0;
        }
        hsCodeGroupTreeCounter[hsCodeGroup] += filterValue.count;
      });
      statisticsPanelHsCodeCard.find('table tbody').empty();
      for (const hsCodeGroup in hsCodeGroupTreeCounter) {
        if (hsCodeGroupTreeCounter.hasOwnProperty(hsCodeGroup)) {
          let statisticItem = `
          <tr>
            <td>${hsCodeGroup}</td>
            <td>${hsCodeGroupTreeCounter[hsCodeGroup]}</td>
          </tr>
          `;
          statisticsPanelHsCodeCard.find('table tbody').append(statisticItem);
        }
      }
      statisticsPanelHsCodeCard.show();
    } else {
      statisticsPanelHsCodeCard.hide();
    }

    if (shipmentStatisticsAggregation.filter.FILTER_COUNTRY_TRADER != null || shipmentStatisticsAggregation.filter.FILTER_HS_CODE != undefined) {
      statisticsPanelCountryCard.find('table tbody').empty();
      shipmentStatisticsAggregation.filter.FILTER_COUNTRY_TRADER.sort(arrayObjectKeyCountDescendingSort).forEach(statisticValue => {
        let statisticItem = `
          <tr>
            <td>${statisticValue._id}</td>
            <td>${statisticValue.breakCount}</td>
            <td>${statisticValue.count}</td>
          </tr>
          `;
        statisticsPanelCountryCard.find('table tbody').append(statisticItem);
      });
      statisticsPanelCountryCard.show();
    } else {
      statisticsPanelCountryCard.hide();
    }

    if (shipmentStatisticsAggregation.filter.FILTER_PORT != null || shipmentStatisticsAggregation.filter.FILTER_PORT != undefined) {
      statisticsPanelPortCard.find('table tbody').empty();
      shipmentStatisticsAggregation.filter.FILTER_PORT.sort(arrayObjectKeyCountDescendingSort).forEach(statisticValue => {
        let statisticItem = `
          <tr>
            <td>${statisticValue._id}</td>
            <td>${statisticValue.count}</td>
          </tr>
          `;
        statisticsPanelPortCard.find('table tbody').append(statisticItem);
      });
      statisticsPanelPortCard.show();
    } else {
      statisticsPanelPortCard.hide();
    }

    if (shipmentStatisticsAggregation.filter.FILTER_MONTH != null || shipmentStatisticsAggregation.filter.FILTER_MONTH != undefined) {
      statisticsPanelMonthCard.find('table tbody').empty();
      shipmentStatisticsAggregation.filter.FILTER_MONTH.sort(arrayObjectKeyCountDescendingSort).forEach(statisticValue => {
        let statisticItem = `
          <tr>
            <td>${statisticValue._id}</td>
            <td>${statisticValue.count}</td>
          </tr>
          `;
        statisticsPanelMonthCard.find('table tbody').append(statisticItem);
      });
      statisticsPanelMonthCard.show();
    } else {
      statisticsPanelMonthCard.hide();
    }

    recordsPanelBarSection.hide();
    statisticsPanelBarSection.show();
    filterPanelBarSection.show();
    resultPanelBarSection.show();
  }

  function triggerStatisticsDTListFetch(aggregationPayload) {
    fetchExploreShipmentStatisticsAPIHandler(aggregationPayload);
  }


  // Reload Explore Shipment

  function reloadExploreShipment() {
    let tradeType = $(`#${semanticPanelTradeSelect.attr('id')} option:selected`).val();
    let countryCode = $(`#${semanticPanelCountrySelect.attr('id')} option:selected`).val();
    let tradeYear = $(`#${semanticPanelYearSelect.attr('id')} option:selected`).val();
    window.location.assign(API_HOST.concat(ENDPOINT_EXPLORE_SHIPMENT_PAGE, QUERY_PARAMS_INDICATOR,
      'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
      'tradeYear', QUERY_PARAMS_VALUE_ASSIGNER, tradeYear, QUERY_PARAMS_SEPARATOR,
      'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode));
  }

  function reloadExploreShipmentResults(reloadType) {
    //selectedShipments = [];
    //shipmentMasterFilterSet = {};
    //shipmentComputedFilterSet = {};
    //hipmentComputedSummarySet = {};

    switch (reloadType) {
      case RESULT_EXPLORE_RELOAD_TYPE_SEARCH:
        freshenResultsRecordsFilters();
        break;
      case RESULT_EXPLORE_RELOAD_TYPE_FILTER:

        break;
      default:
        break;
    }

    summaryPanelBarSection.show();
    resultPanelBarSection.hide();
    switch (currentResultTemplate) {
      case SHIPMENT_RESULT_TYPE_RECORDS: {
        recordsPanelBarSection.show();
        statisticsPanelBarSection.hide();
        if (masterDTRun) {
          intitialiseRecordsDTList();
          /* Overrides Scroll X For Datatables*/
          $('#records-table').wrap('<div class="dataTables_scroll" />');
        } else {
          triggerRecordsDTListFetch();
        }
        break;
      }
      case SHIPMENT_RESULT_TYPE_STATISTICS: {
        recordsPanelBarSection.hide();
        statisticsPanelBarSection.show();
        break;
      }
      default:
        break;
    }

  }

  // Filter Slide Panel Section

  $(`#${filterPanelHsCodeOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      $(this).trigger('click');
    });
  });

  $(`#${filterPanelCountryOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options .checkbox input[type=checkbox]:checked`).each(function (index) {
      $(this).trigger('click');
    });
  });

  $(`#${filterPanelPortOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      $(this).trigger('click');
    });
  });

  $(`#${filterPanelMonthOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options input[type=checkbox]:checked`).each(function (index) {
      $(this).trigger('click');
    });
  });

  $(`#${filterPanelQuantityOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options option`).removeAttr('selected');
    $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options option[value="DEFAULT"]`).attr('selected', 'selected');
    $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options-range`).hide();
    quantityRangeSlideInstance.update({
      min: parseInt(0),
      max: parseInt(0),
      from: parseInt(0),
      to: parseInt(0)
    });
  });

  $(`#${filterPanelPriceOptionsPane.attr('id')} .cta-buttons .cta-reset`).on('click', function (e) {
    $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options option`).removeAttr('selected', 'selected');
    $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options option[value="DEFAULT"]`).attr('selected', 'selected');
    $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options-range`).hide();
    priceRangeSlideInstance.update({
      min: parseInt(0),
      max: parseInt(0),
      from: parseInt(0),
      to: parseInt(0)
    });
  });

  $(`#${filterPanelHsCodeOptionsPane.attr('id')} .filter-options`).on('change', '.checkbox input[type=checkbox]', function (e) {
    let selectedUnit = $(this);
    if (selectedUnit.is(':checked')) {
      selectedUnit.attr("checked", "checked");
    } else {
      selectedUnit.removeAttr("checked");
    }
  });

  $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options`).on('change', '.checkbox input[type=checkbox]', function (e) {
    let selectedUnit = $(this);
    if (selectedUnit.is(':checked')) {
      selectedUnit.attr("checked", "checked");
    } else {
      selectedUnit.removeAttr("checked");
    }
  });

  $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options`).on('change', '.checkbox input[type=checkbox]', function (e) {
    let selectedUnit = $(this);
    if (selectedUnit.is(':checked')) {
      selectedUnit.attr("checked", "checked");
    } else {
      selectedUnit.removeAttr("checked");
    }
  });

  $(`#${filterPanelMonthOptionsPane.attr('id')} .filter-options`).on('change', '.checkbox input[type=checkbox]', function (e) {
    let selectedUnit = $(this);
    if (selectedUnit.is(':checked')) {
      selectedUnit.attr("checked", "checked");
    } else {
      selectedUnit.removeAttr("checked");
    }
  });

  filterPanelQuantityUnitSelect.on('change', function (e) {
    let selectedUnit = $(`#${$(this).attr('id')} option:selected`);
    if (selectedUnit.val() != "DEFAULT") {
      $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options-range`).show();
    } else {
      $(`#${filterPanelQuantityOptionsPane.attr('id')} .filter-options-range`).hide();
    }
    quantityRangeSlideInstance.update({
      min: parseInt(selectedUnit.attr('data-min-range')),
      max: parseInt(selectedUnit.attr('data-max-range')),
      from: parseInt(selectedUnit.attr('data-from-range')),
      to: parseInt(selectedUnit.attr('data-to-range'))
    });
  });

  filterPanelPriceCurrencySelect.on('change', function (e) {
    let selectedUnit = $(`#${$(this).attr('id')} option:selected`);
    if (selectedUnit.val() != "DEFAULT") {
      $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options-range`).show();
    } else {
      $(`#${filterPanelPriceOptionsPane.attr('id')} .filter-options-range`).hide();
    }
    priceRangeSlideInstance.update({
      min: parseInt(selectedUnit.attr('data-min-range')),
      max: parseInt(selectedUnit.attr('data-max-range')),
      from: parseInt(selectedUnit.attr('data-from-range')),
      to: parseInt(selectedUnit.attr('data-to-range'))
    });
  });

  $('#cta-action-data-column-visibility, #action-right-data-column-visibility .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-action-data-column-enabled');
  });

  $('#cta-filter-hscode, #filter-right-hscode .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-hscode-enabled');
  });

  $('#cta-filter-country, #filter-right-country .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-country-enabled');
  });

  $('#cta-filter-port, #filter-right-port .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-port-enabled');
  });

  $('#cta-filter-quantity, #filter-right-quantity .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-quantity-enabled');
  });

  $('#cta-filter-price, #filter-right-price .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-price-enabled');
  });

  $('#cta-filter-month, #filter-right-month .close-slide-panel').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-month-enabled');
  });

  $('.rightbar-overlay').on('click', function (e) {
    $('body').removeClass(`right-bar-action-data-column-enabled right-bar-filter-hscode-enabled right-bar-filter-country-enabled
    right-bar-filter-port-enabled right-bar-filter-quantity-enabled right-bar-filter-price-enabled right-bar-filter-month-enabled`);
  });


  // Search Panel Change Detectors

  searchPanelMonthStartSelect.on('change', function (e) {
    prepareSearchMonthEndOptions(true, searchPanelMonthStartSelect.val());
  });

  searchPanelMonthEndSelect.on('change', function (e) {
    prepareSearchMonthStartOptions(true, searchPanelMonthEndSelect.val());
  });

  searchPanelTermTypeSelect.on('change', function (e) {
    let optionSelected = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`);
    let termType = optionSelected.val();
    let aliasType = optionSelected.attr('data-alias');
    searchPanelTermValueSwapperContainer.children().each(function (index) {
      if (termType != $(this).attr('data-term')) {
        $(this).attr('hidden', 'hidden');
      } else {
        $(this).removeAttr('hidden');
        //$(this).find(`button[data-id="input-${$(this).attr('data-alias')}"]`).trigger('click');
      }
    });
  });

  function triggerSearchTerm(searchBoxValueHolder) {

    let searchTerm = searchBoxValueHolder.val();
    let searchClassifier = searchBoxValueHolder.closest('.value-swapper');
    let searchField = searchClassifier.attr('data-term');
    let aliasType = searchClassifier.attr('data-alias');

    if (searchTerm) {
      $(`.value-swapper[data-alias="${aliasType}"] .dropdown-menu .inner[role="listbox"] .dropdown-menu`).hide();
      $(`.value-swapper[data-alias="${aliasType}"] .dropdown-menu .inner[role="listbox"] .search-progress`).show();
    } else {
      $(`.value-swapper[data-alias="${aliasType}"] .dropdown-menu .inner[role="listbox"] .dropdown-menu`).hide();
      $(`.value-swapper[data-alias="${aliasType}"] .dropdown-menu .inner[role="listbox"] .search-progress`).hide();
    }

    clearTimeout(searchIntervalID); // Clear Previous Search Triggers
    searchIntervalID = window.setTimeout(function () {

      if (searchTerm) {
        //$(`#input-${aliasType}`).prop('disabled', true);
        //$(`#input-${aliasType}`).selectpicker('refresh');
        fetchExploreShipmentBuyerSellerPatternSearchAPIHandler(currentTradeType, currentCountryCode,
          currentTradeYear, searchField, searchTerm, aliasType);
      }
    }, 300);
  }

  /*$(document).on('click', '.value-swapper .cta-search-term', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    let searchBoxValueHolder = $(this).parent('.bs-searchbox').find('input');
    triggerSearchTerm(searchBoxValueHolder);
  });*/

  var searchIntervalID = null;
  $(document).on('input', '.bs-searchbox input', function (e) {

    e.stopPropagation();
    e.stopImmediatePropagation();

    let searchBoxValueHolder = $(this);
    triggerSearchTerm(searchBoxValueHolder);

  });

  function intiateTradersAggregation(aliasType) {
    /*let paramsObj = formulateDataTradersAggregationPayload();
    paramsObj.tradeType = currentTradeType;
    paramsObj.countryCode = currentCountryCode;
    paramsObj.tradeYear = currentTradeYear;*/
  }

  searchPanelTermValueSwapperContainer.on('change', '.value-swapper select', function (e) {
    //currentTermValue = $(this).val();
  });


  // Explore Panel Actions

  semanticPanelActionSetTradeButton.on('click', function (e) {
    reloadExploreShipment();
  });

  function initiateFetchDataBuild(reloadType) {
    currentTradeType = $(`#${semanticPanelTradeSelect.attr('id')} option:selected`).val();
    currentCountryCode = $(`#${semanticPanelCountrySelect.attr('id')} option:selected`).val();
    currentTradeYear = $(`#${semanticPanelYearSelect.attr('id')} option:selected`).val();
    currentStartMonth = $(`#${searchPanelMonthStartSelect.attr('id')} option:selected`).val();
    currentEndMonth = $(`#${searchPanelMonthEndSelect.attr('id')} option:selected`).val();

    currentTermType = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`).val();
    currentTermIdentifier = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`).attr('data-identifier');
    currentResultTemplate = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`).attr('data-template');
    currentResultQuery = $(`#${searchPanelTermTypeSelect.attr('id')} option:selected`).attr('data-query');
    if (currentResultTemplate === SHIPMENT_RESULT_TYPE_RECORDS) {
      if (currentResultQuery === SHIPMENT_QUERY_TYPE_SEARCH) {
        currentTermValue = searchPanelTermValueSwapperContainer.find(`.value-swapper[data-term="${currentTermType}"] input`).val();
      } else if (currentResultQuery === SHIPMENT_QUERY_TYPE_CHOOSE) {
        currentTermValue = searchPanelTermValueSwapperContainer.find(`.value-swapper[data-term="${currentTermType}"] select`).val();
      }
    } else if (currentResultTemplate === SHIPMENT_RESULT_TYPE_STATISTICS) {}

    if (!currentTermValue) {
      Swal.fire({
        title: "Search Value Missing",
        text: "Guess you forget to type your search term?",
        type: "question",
        confirmButtonClass: "btn btn-confirm mt-2",
        allowOutsideClick: false
      });
    } else {
      switch (currentResultTemplate) {
        case SHIPMENT_RESULT_TYPE_RECORDS: {
          reloadExploreShipmentResults(reloadType);
          break;
        }
        case SHIPMENT_RESULT_TYPE_STATISTICS: {
          reloadExploreShipmentResults(reloadType);
          let paramsObj = formulateDataShipmentPayload(SHIPMENT_RESULT_TYPE_STATISTICS);
          paramsObj.tradeType = currentTradeType;
          paramsObj.countryCode = currentCountryCode;
          paramsObj.tradeYear = currentTradeYear;
          paramsObj.tradeTotalRecords = currentTotalRecords;
          triggerStatisticsDTListFetch(paramsObj);
          break;
        }
        default:
          break;
      }
    }
  }


  searchPanelActionResetButton.on('click', function (e) {
    reloadExploreShipment();
  });

  searchPanelActionSearchButton.on('click', function (e) {
    isFilterRefresh = true;
    initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_SEARCH);
  });

  filterPanelGlobalActionApplyButton.on('click', function (e) {
    $('body').removeClass(`right-bar-action-data-column-enabled right-bar-filter-hscode-enabled right-bar-filter-country-enabled
    right-bar-filter-port-enabled right-bar-filter-quantity-enabled right-bar-filter-price-enabled right-bar-filter-month-enabled`);
    initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_FILTER);
  });

  $(document).on('keypress', '.value-swapper input[type="search"]', function (e) {
    if (e.keyCode === 13) {
      isFilterRefresh = true;
      initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_SEARCH);
    }
  });


  // Workspace Panel Section

  function initiateManageWorkspacePanel(userWorkspaces) {
    addRecordsWorkspaceSelect.empty();
    userWorkspaces.forEach(workspace => {
      let option = `<option value="${workspace._id}">${workspace.name}</option>`;
      addRecordsWorkspaceSelect.append(option);
    });

    graceCloseSwal();
    var intervalID = window.setTimeout(function (e) {
      new Custombox.modal({
        content: {
          effect: 'fadein',
          target: '#manage-workspace-records-panel'
        },
        overlay: {
          close: false
        },
        loader: {
          active: false,
        }
      }).open();
      clearTimeout(intervalID);
    }, 1000);

  }

  function initiateIngestWorkspacePanel(recordsPurchaseKit) {

    let totalRecords = recordsPurchaseKit.totalRecords;
    let purchasableRecords = recordsPurchaseKit.purchasableRecords;
    let availableCredits = recordsPurchaseKit.availableCredits;
    let consumableCredits = purchasableRecords * 1;
    let balanceCredits = availableCredits - consumableCredits;

    $('#ingest-workspace-records-panel .info-workspace-selected').text(currentWorkspaceOperation.name);
    $('#ingest-workspace-records-panel .info-records-selected').text(totalRecords);
    $('#ingest-workspace-records-panel .info-records-selected b').text(totalRecords);
    $('#ingest-workspace-records-panel .info-records-previously-purchased b').text(totalRecords - purchasableRecords);
    $('#ingest-workspace-records-panel .info-records-currently-purchasable b').text(purchasableRecords);
    $('#ingest-workspace-records-panel .info-records-point-consumption').text(consumableCredits);
    $('#ingest-workspace-records-panel .info-records-point-consumption b').text(consumableCredits);
    $('#ingest-workspace-records-panel .info-records-points-cost b').text(1);
    $('#ingest-workspace-records-panel .info-records-selected-workspace').text();
    $('#ingest-workspace-records-panel .info-account-available-points').text(availableCredits);
    $('#ingest-workspace-records-panel .info-account-balance-points').text(balanceCredits);

    if (balanceCredits < 0) {
      $('#ingest-workspace-records-panel .low-point-indicator').show();
      $('#ingest-workspace-records-panel .buy-points-widget').show();
      confirmWorkspaceRecordsPurchaseButton.hide();
    } else {
      $('#ingest-workspace-records-panel .low-point-indicator').hide();
      $('#ingest-workspace-records-panel .buy-points-widget').hide();
      confirmWorkspaceRecordsPurchaseButton.show();
    }

    graceCloseSwal();
    var intervalID = window.setTimeout(function (e) {
      new Custombox.modal({
        content: {
          effect: 'fadein',
          target: '#ingest-workspace-records-panel'
        },
        overlay: {
          close: false
        },
        loader: {
          active: false,
        }
      }).open();
      clearTimeout(intervalID);
    }, 100);

  }

  function packWorkspacePurchaseApprovalParams() {
    let dataShipment = formulateDataShipmentPayload(currentResultTemplate);
    let paramsObj = {};
    paramsObj.recordsSelections = selectedShipments;
    paramsObj.matchExpressions = dataShipment.matchExpressions;
    paramsObj.tradeType = currentTradeType;
    paramsObj.countryCode = currentCountryCode;
    paramsObj.tradeYear = currentTradeYear;
    if (currentWorkspaceAddRecordsType === WORKSPACE_ADD_TYPE_RECORDS_SELECTIONS) {
      paramsObj.tradeRecords = selectedShipments.length;
    } else if (currentWorkspaceAddRecordsType === WORKSPACE_ADD_TYPE_MATCH_EXPRESSIONS) {
      paramsObj.tradeRecords = currentSummarizedRecords;
    }
    return paramsObj;
  }

  function packWorkspaceRecordsAdditionParams() {
    let paramsObj = currentWorkspacePurchases;
    let workspaceTaxonomy = taxonomyStandards.filter(taxonomy => (taxonomy.trade == currentTradeType &&
      taxonomy.code_iso_3 == currentCountryCode))[0];
    paramsObj.country = workspaceTaxonomy.country;
    paramsObj.countryCodeISO3 = workspaceTaxonomy.code_iso_3;
    paramsObj.countryCodeISO2 = workspaceTaxonomy.code_iso_2;
    paramsObj.flagUri = workspaceTaxonomy.flag_uri;
    paramsObj.taxonomyId = workspaceTaxonomy._id;
    paramsObj.indexSpecifications = workspaceTaxonomy.fields.indexes;
    paramsObj.workspaceType = currentWorkspaceOperation.type;
    paramsObj.workspaceId = currentWorkspaceOperation.id;
    paramsObj.workspaceName = currentWorkspaceOperation.name;
    return paramsObj;
  }

  addWorkspaceSelectedRecordsButton.on('click', function (e) {
    //// console.log(selectedShipments);
    currentWorkspaceAddRecordsType = WORKSPACE_ADD_TYPE_RECORDS_SELECTIONS;
    fetchUserWorkspacesAPIHandler(CLIENT_USER_ID, currentTradeType, currentCountryCode);
  });

  addWorkspaceAllRecordsButton.on('click', function (e) {
    currentWorkspaceAddRecordsType = WORKSPACE_ADD_TYPE_MATCH_EXPRESSIONS;
    fetchUserWorkspacesAPIHandler(CLIENT_USER_ID, currentTradeType, currentCountryCode);
  });

  $('#manage-workspace-records-panel .cta-close').on('click', function (e) {
    Custombox.modal.close();
  });

  $('#ingest-workspace-records-panel .cta-close').on('click', function (e) {
    Custombox.modal.close();
  });

  $('input[type="radio"][name="choose-workspace"]').on('change', function (e) {
    let workspaceChoiceType = $(this).val();
    if (workspaceChoiceType === "NEW") {
      $('#choice-existing-workspace').hide();
      $('#choice-new-workspace').show();
    } else if (workspaceChoiceType === "EXISTING") {
      $('#choice-new-workspace').hide();
      $('#choice-existing-workspace').show();
    }
  });

  specifyWorkspaceRecordsButton.on('click', function (e) {

    $('#manage-workspace-records-panel #choice-new-workspace .exists-err-msg').hide();
    $('#manage-workspace-records-panel #choice-new-workspace .blank-err-msg').hide();

    let workspaceChoiceType = $('input[type="radio"][name="choose-workspace"]:checked').val();
    if (workspaceChoiceType === WORKSPACE_TYPE_NEW) {
      let workspaceName = $('#workspace-name').val();
      if (workspaceName) {
        currentWorkspaceOperation = {};
        currentWorkspaceOperation.type = WORKSPACE_TYPE_NEW;
        currentWorkspaceOperation.id = "";
        currentWorkspaceOperation.name = workspaceName.trim();
        Custombox.modal.close();
        let intervalID = window.setTimeout(function (e) {
          verifyWorkspaceExistenceAPIHandler(CLIENT_ACCOUNT_ID, $('#workspace-name').val());
          clearTimeout(intervalID);
        }, 100);
      } else {
        $('#manage-workspace-records-panel #choice-new-workspace .blank-err-msg').show();
      }
    } else if (workspaceChoiceType === WORKSPACE_TYPE_EXISTING) {
      let optionSelected = $(`#${addRecordsWorkspaceSelect.attr('id')} option:selected`);
      currentWorkspaceOperation = {};
      currentWorkspaceOperation.type = WORKSPACE_TYPE_EXISTING;
      currentWorkspaceOperation.id = optionSelected.val();
      currentWorkspaceOperation.name = optionSelected.text();
      Custombox.modal.close();
      currentWorkspacePurchases = packWorkspacePurchaseApprovalParams();
      approveRecordsPurchaseAPIHandler(CLIENT_ACCOUNT_ID, currentWorkspacePurchases);
    }

  });

  confirmWorkspaceRecordsPurchaseButton.on('click', function (e) {
    let payload = packWorkspaceRecordsAdditionParams();
    Custombox.modal.close();
    let intervalID = window.setTimeout(function (e) {
      addWorkspaceRecordsAPIHandler(CLIENT_ACCOUNT_ID, CLIENT_USER_ID, payload);
      clearTimeout(intervalID);
    }, 100);

  });

  function validateWorkspaceExistence(isExists) {

    instantCloseSwal();
    if (isExists) {
      $('#manage-workspace-records-panel #choice-new-workspace .exists-err-msg').show();
      new Custombox.modal({
        content: {
          effect: 'fadein',
          target: '#manage-workspace-records-panel'
        },
        overlay: {
          close: false
        },
        loader: {
          active: false,
        }
      }).open();
    } else {
      currentWorkspacePurchases = packWorkspacePurchaseApprovalParams();
      approveRecordsPurchaseAPIHandler(CLIENT_ACCOUNT_ID, currentWorkspacePurchases);
    }

  }

  function validateRecordsPurchaseApproval(recordsPurchaseKit) {
    //// console.log(recordsPurchaseKit);
    instantCloseSwal();
    initiateIngestWorkspacePanel(recordsPurchaseKit);
  }


  // Explore Panel Build

  function buildShipmentExplorePanel() {
    if (taxonomyStandards.length === 0 || !exploreShipmentSpecification.code_iso_3) {
      return;
    }
    fetchExploreShipmentEstimateAPIHandler(currentTradeType, currentCountryCode, currentTradeYear);
  }


  // Shipment Statistics Section
  function buildExploreShipmentStatistics(shipmentsStatistics) {
    attachShipmentStatisticsDTList(shipmentsStatistics);
  }


  // Shipment Estimate Response Section

  function buildExploreShipmentEstimate(estimatedShipments) {
    currentTotalRecords = estimatedShipments;
    searchPanelBarSection.show();
    graceCloseSwal();
  }


  // Shipment Traders Response Section

  function buildExploreShipmentBuyerSellerSearch(shipmentTraders, aliasType) {
    prepareAutoSearchTermFieldOptions(shipmentTraders, aliasType);
  }


  /*function buildExploreShipmentTraders(shipmentTraders) {
    exploreShipmentStatisticsFieldOptions = shipmentTraders;
    if (exploreShipmentStatisticsFieldOptions.SEARCH_BUYERS != null || exploreShipmentStatisticsFieldOptions.SEARCH_BUYERS != undefined) {
      prepareSearchTermFieldOptions('BUYER');
    }
    if (exploreShipmentStatisticsFieldOptions.SEARCH_SELLERS != null || exploreShipmentStatisticsFieldOptions.SEARCH_SELLERS != undefined) {
      prepareSearchTermFieldOptions('SELLER');
    }
    currentTotalRecords = shipmentTraders.SUMMARY_RECORDS[0].count;
    searchPanelBarSection.show();
    graceCloseSwal();
  }*/


  // Shipment Specifications Response Section

  function buildExploreShipmentSpecifications(shipmentSpecifications) {
    if (shipmentSpecifications.length === 0) {
      Swal.fire({
        title: "Explore Countries Absent",
        text: "No Shipment Records Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      shipmentSpecifications.forEach(shipmentSpecification => {
        //attachTradeCountryCard(shipmentSpecification);
        exploreShipmentSpecification = shipmentSpecification;
        prepareSearchYearOptions();
        prepareSearchMonthStartOptions(false, null);
        prepareSearchMonthEndOptions(false, null);
        prepareSearchTermTypeOptions();
        prepareFilterTypeOptions();
        buildShipmentExplorePanel();
      });
    }
  }


  // Taxonomy Response Section

  function buildTaxonomyManager(taxonomies) {
    taxonomyStandards = taxonomies;
    prepareSemanticTradeOptions();
    prepareSemanticCountryOptions();
    buildShipmentExplorePanel();
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

  function fetchExploreShipmentSpecificationsAPIHandler(tradeType, countryCode) {
    /*Swal.fire({
      title: "Configuring Specifications",
      text: "Preparing Data-Points For Exploring Shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_SPECIFICATIONS, QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode),
      type: 'GET',
      success: function (payload) {
        //graceCloseSwal();
        buildExploreShipmentSpecifications(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchExploreShipmentEstimateAPIHandler(tradeType, countryCode, tradeYear) {
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_ESTIMATE, QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode, QUERY_PARAMS_SEPARATOR,
        'tradeYear', QUERY_PARAMS_VALUE_ASSIGNER, tradeYear),
      type: 'GET',
      contentType: "application/json",
      success: function (payload) {
        buildExploreShipmentEstimate(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchExploreShipmentBuyerSellerPatternSearchAPIHandler(
    tradeType, countryCode, tradeYear, searchField, searchTerm, aliasType) {
    /*Swal.fire({
      title: "Matching Traders",
      text: "Preparing Data-Points For Exploring Traders",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_BUYER_SELLER_SEARCH, QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode, QUERY_PARAMS_SEPARATOR,
        'tradeYear', QUERY_PARAMS_VALUE_ASSIGNER, tradeYear, QUERY_PARAMS_SEPARATOR,
        'searchField', QUERY_PARAMS_VALUE_ASSIGNER, searchField, QUERY_PARAMS_SEPARATOR,
        'searchTerm', QUERY_PARAMS_VALUE_ASSIGNER, searchTerm),
      type: 'GET',
      success: function (payload) {
        graceCloseSwal();
        //// console.log(payload);
        buildExploreShipmentBuyerSellerSearch(payload.data, aliasType);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchExploreShipmentTradersAPIHandler(shipmentTraderAggregation) {
    /*Swal.fire({
      title: "Configuring Traders",
      text: "Preparing Data-Points For Shipment Traders",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_TRADERS),
      type: 'POST',
      data: JSON.stringify(shipmentTraderAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        buildExploreShipmentTraders(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchExploreShipmentStatisticsAPIHandler(shipmentStatisticsAggregation) {
    Swal.fire({
      title: "Retrieving Shipments",
      text: "Processing Shipment Records",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_EXPLORE_SHIPMENT_STATISTICS),
      type: 'POST',
      data: JSON.stringify(shipmentStatisticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        graceCloseSwal();
        buildExploreShipmentStatistics(payload);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }


  function fetchUserWorkspacesAPIHandler(userId, tradeType, countryCode) {
    Swal.fire({
      title: "Retrieving Workspaces",
      text: "Preparing Data-Points For Exploring Shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_USER_WORKSPACES.replace('{userId}', userId), QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode),
      type: 'GET',
      success: function (payload) {
        //graceCloseSwal();
        initiateManageWorkspacePanel(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function verifyWorkspaceExistenceAPIHandler(accountId, workspaceName) {
    Swal.fire({
      title: "Verifying Workspace Availability",
      text: "Check if worksapce with similar name exists",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_VERIFY_WORKSPACE_EXISTENCE.replace('{accountId}', accountId), QUERY_PARAMS_INDICATOR,
        'workspaceName', QUERY_PARAMS_VALUE_ASSIGNER, workspaceName),
      type: 'GET',
      success: function (payload) {
        //graceCloseSwal();
        validateWorkspaceExistence(payload.data);
        //// console.log(payload);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function approveRecordsPurchaseAPIHandler(accountId, shipmentRecordsPurchaseAggregation) {
    let purchaseRecordsApprovalPayload = shipmentRecordsPurchaseAggregation;
    purchaseRecordsApprovalPayload.accountId = accountId;
    Swal.fire({
      title: "Approving Purchase",
      text: "Estimating requisite credits for purchasing new shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_APPROVE_RECORDS_PURCHASE),
      type: 'POST',
      data: JSON.stringify(purchaseRecordsApprovalPayload),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        validateRecordsPurchaseApproval(payload);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function addWorkspaceRecordsAPIHandler(accountId, userId, shipmentRecordsPurchaseAggregation) {
    let workspaceRecordsPayload = shipmentRecordsPurchaseAggregation;
    workspaceRecordsPayload.accountId = accountId;
    workspaceRecordsPayload.userId = userId;
    Swal.fire({
      title: "Preparing your workspace",
      text: "Ingesting Records to the selected workspace",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_ADD_WORKSPACE_RECORDS),
      type: 'POST',
      data: JSON.stringify(workspaceRecordsPayload),
      contentType: "application/json",
      success: function (payload) {
        $('#records-table tbody td input[type="checkbox"]').each(function () {
          $(this).prop("checked", false);
        });
        selectedShipments = [];
        // Refresh Stimulus
        searchPanelActionSearchButton.trigger('click');
        Swal.fire({
          type: "success",
          title: "Operation Successfull",
          text: "Successfully modified workspace!",
          showConfirmButton: false,
        });
        graceCloseSwal();
        //validateRecordsPurchaseApproval(payload);
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


  // Shimpment Semantic Templating Section
  function extractShipmentSemanticParams() {
    const parsedUrl = new URL(window.location.href);
    currentTradeType = parsedUrl.searchParams.get(QUERY_PARAM_TERM_TRADE_TYPE);
    currentTradeYear = parsedUrl.searchParams.get(QUERY_PARAM_TERM_TRADE_YEAR);
    currentCountryCode = parsedUrl.searchParams.get(QUERY_PARAM_TERM_COUNTRY_CODE);
    searchPanelBarSection.hide();
    summaryPanelBarSection.hide();
    filterPanelBarSection.hide();
    resultPanelBarSection.hide();
    recordsPanelBarSection.hide();
    statisticsPanelBarSection.hide();
    Swal.fire({
      title: "Configuring Environment For Exploration",
      text: "Preparing Data-Points For Shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    fetchTaxonomyAPIHandler();
    fetchExploreShipmentSpecificationsAPIHandler(currentTradeType, currentCountryCode);
  }

  // INIT API CALLS
  extractShipmentSemanticParams();

});
