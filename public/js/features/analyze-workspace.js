const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_TAXONOMY = '/taxonomies';
const ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_BUYER_SELLER_SEARCH = '/workspaces/shipments/analytics/traders/search';
const ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_TRADERS = '/workspaces/shipments/analytics/traders';
const ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_RECORDS = '/workspaces/shipments/analytics/records';
const ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_STATISTICS = '/workspaces/shipments/analytics/statistics';
const ENDPOINT_WORKSPACE_ANALYTICS_PAGE = '/workspace/analyze';

const ENDPOINT_FETCH_USER_WORKSPACE_ANALYTICS_SPECIFICATIONS = '/users/{userId}/workspaces/{workspaceId}/analytics/specifications';

const ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_FACTORS_CORRELATION = '/analytics/correlation/chronology/trade/factors';
const ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_ENTITIES_COMPARISON = '/analytics/comparison/chronology/trade/entities';
const ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_ENTITIES_DISTRIBUTION = '/analytics/distribution/chronology/trade/entities';
const ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CORRELATION = '/analytics/correlation/trade/entities/factors';
const ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION = '/analytics/contribution/trade/entities/factors';
const ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION = '/analytics/periodisation/trade/entities/factors';
const ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION = '/analytics/composition/trade/entities/factors';

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

const QUERY_PARAM_TERM_TRADE_TYPE = 'tradeType';
const QUERY_PARAM_TERM_TRADE_YEAR = 'tradeYear';
const QUERY_PARAM_TERM_COUNTRY_CODE = 'countryCode';

const QUERY_PARAM_TERM_WORKSPACE_ID = 'workspaceId';
const QUERY_PARAM_TERM_WORKSPACE_BUCKET = 'workspaceBucket';
const QUERY_PARAM_TERM_WORKSPACE_NAME = 'workspaceName';

const TRADE_FACTOR_TYPE_INDIVIDUAL = "INDIVIDUAL";
const TRADE_FACTOR_TYPE_COMBINED = "COMBINED";
const TRADE_FACTOR_TYPE_QUANTITY = "QUANTITY";
const TRADE_FACTOR_TYPE_PRICE = "PRICE";
const TRADE_FACTOR_TYPE_DUTY = "DUTY";
const TRADE_FACTOR_TYPE_SHIPMENT = "SHIPMENT";
const TRADE_FACTOR_TYPE_UNIT_PRICE = "UNIT_PRICE";
const TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE = "AVERAGE_UNIT_PRICE";

const TRADE_ENTITY_TYPE_HSCODE = "HSCODE";
const TRADE_ENTITY_TYPE_COUNTRY = "COUNTRY";
const TRADE_ENTITY_TYPE_PORT = "PORT";
const TRADE_ENTITY_TYPE_IMPORTER = "IMPORTER";
const TRADE_ENTITY_TYPE_EXPORTER = "EXPORTER";

const ANALYTICS_SPECIFICATION_TYPE_SUMMARY = "ANALYTICS_SUMMARY";
const ANALYTICS_SPECIFICATION_TYPE_CORRELATION = "ANALYTICS_CORRELATION";
const ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION = "ANALYTICS_DISTRIBUTION";
const ANALYTICS_SPECIFICATION_TYPE_COMPARISON = "ANALYTICS_COMPARISON";
const ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION = "ANALYTICS_CONTRIBUTION";
const ANALYTICS_SPECIFICATION_TYPE_PERIODISATION = "ANALYTICS_PERIODISATION";
const ANALYTICS_SPECIFICATION_TYPE_COMPOSITION = "ANALYTICS_COMPOSITION";

const TRADE_RELATION_TYPE_ALL = "ALL";
const TRADE_RELATION_TYPE_DUO = "DUO";
const TRADE_RELATION_TYPE_TRIO = "TRIO";

const TRADE_CONTRAST_TYPE_NEUTRAL = "NEUTRAL";
const TRADE_CONTRAST_TYPE_DIFFERENTIAL = "DIFFERENTIAL";

const TRADE_INTERVAL_TYPE_FIXED = "FIXED";
const TRADE_INTERVAL_TYPE_COMPUTED = "COMPUTED";

const TRADE_PATTERN_TYPE_TREE = "TREE";
const TRADE_PATTERN_TYPE_PIVOT = "PIVOT";

const ANALYTICS_FRAMEWORK_TYPE_SHIPMENT = "SHIPMENT";
const ANALYTICS_FRAMEWORK_TYPE_GENERAL = "GENERAL";
const ANALYTICS_FRAMEWORK_TYPE_IMPORTER = "IMPORTER";
const ANALYTICS_FRAMEWORK_TYPE_EXPORTER = "EXPORTER";
const ANALYTICS_FRAMEWORK_TYPE_HS_CODE = "HS_CODE";
const ANALYTICS_FRAMEWORK_TYPE_PORT = "PORT";
const ANALYTICS_FRAMEWORK_TYPE_COUNTRY = "COUNTRY";

const RESULT_ORDER_TYPE_TOP = 'TOP';

$(document).ready(function () {

  var masterDTRun = true;
  var isFilterRefresh = false;
  var activateSearchBasedFilters = true;
  var recordsTable = null;
  var currentTradeType = null;
  var currentTradeYear = null;
  //Aliased Team Test
  currentTradeYear = 2019;
  var currentCountryCode = null;
  var currentStartMonth = null;
  var currentEndMonth = null;
  var currentTermType = null;
  var currentTermIdentifier = null;
  var currentTermValue = null;
  var currentTotalRecords = null;
  var currentSummarizedRecords = null;
  var currentWorkspaceAddRecordsType = null;
  var currentWorkspaceOperation = null;
  var currentWorkspacePurchases = null;
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

  var currentWorkspaceId = null;
  var currentWorkspaceBucket = null;
  var currentWorkspaceName = null;

  var currentFilteredImporterCount = 0;
  var currentFilteredExporterCount = 0;
  var currentFilteredHsCodeCount = 0;
  var currentFilteredPortCount = 0;
  var currentFilteredCountryCount = 0;

  var currentAnalyticsCorrelationTradeFactors = null;
  var isReloadAnalyticsGeneral = true;
  var isReloadAnalyticsImporter = true;
  var isReloadAnalyticsExporter = true;
  var isReloadAnalyticsHsCode = true;
  var isReloadAnalyticsPort = true;
  var isReloadAnalyticsCountry = true;

  var tradeImporterFactorsContributionAnalysisTable = null;
  var tradeImporterFactorsPeriodisationAnalysisTable = null;
  var tradeImporterFactorsCompositionAnalysisTable = null;
  var tradeExporterFactorsContributionAnalysisTable = null;
  var tradeExporterFactorsPeriodisationAnalysisTable = null;
  var tradeExporterFactorsCompositionAnalysisTable = null;
  var tradeHsCodeFactorsContributionAnalysisTable = null;
  var tradeHsCodeFactorsPeriodisationAnalysisTable = null;
  var tradeHsCodeFactorsCompositionAnalysisTable = null;
  var tradePortFactorsContributionAnalysisTable = null;
  var tradePortFactorsPeriodisationAnalysisTable = null;
  var tradePortFactorsCompositionAnalysisTable = null;
  var tradeCountryFactorsContributionAnalysisTable = null;
  var tradeCountryFactorsPeriodisationAnalysisTable = null;
  var tradeCountryFactorsCompositionAnalysisTable = null;

  // UI Panel Bars
  const semanticPanelBarSection = $('#semantic-panel-bar');
  const searchPanelBarSection = $('#search-panel-bar');
  const summaryPanelBarSection = $('#summary-panel-bar');
  const filterPanelBarSection = $('#filter-panel-bar');
  const resultPanelBarSection = $('#result-panel-bar');
  const recordsPanelBarSection = $('#result-panel-bar #records-illustration');
  const statisticsPanelBarSection = $('#result-panel-bar #statistics-illustration');

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

  const statisticsPanelHsCodeCard = $('#result-panel-bar #statistics-illustration #statistics-hscode');
  const statisticsPanelCountryCard = $('#result-panel-bar #statistics-illustration #statistics-country');
  const statisticsPanelPortCard = $('#result-panel-bar #statistics-illustration #statistics-port');
  const statisticsPanelMonthCard = $('#result-panel-bar #statistics-illustration #statistics-month');

  const deleteWorkspaceSelectedRecordsButton = $('.cta-add-workspace-selected-records');
  const confirmWorkspaceRecordsDeleteButton = $('#cta-confirm-workspace-records-purchase');

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
        let option = `<option value="${yearMonth.id}" ${(yearMonth.id === 12)?'selected':''}>${yearMonth.month.toString().toUpperCase().trim()}</option>`;
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
    let searchBox = $(`#input-${termTypeAlias}`);
    let fieldOptions = searchOptions;
    let fieldOptionViews = '';
    searchBox.find('option:not(:selected)').remove();
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
      currentFilteredHsCodeCount = parseInt(summarization.SUMMARY_HS_CODE);
    } else {
      summaryPanelHsCodeCounter.text('N/A');
      currentFilteredHsCodeCount = 0;
    }

    summaryPanelBuyerLoader.hide();
    summaryPanelBuyerContainer.show();
    if (summarization.SUMMARY_BUYERS != null || summarization.SUMMARY_BUYERS != undefined) {
      summaryPanelBuyerCounter.text(summarization.SUMMARY_BUYERS);
      currentFilteredImporterCount = parseInt(summarization.SUMMARY_BUYERS);
    } else {
      summaryPanelBuyerCounter.text('N/A');
      currentFilteredImporterCount = 0;
    }

    summaryPanelSellerLoader.hide();
    summaryPanelSellerContainer.show();
    if (summarization.SUMMARY_SELLERS != null || summarization.SUMMARY_SELLERS != undefined) {
      summaryPanelSellerCounter.text(summarization.SUMMARY_SELLERS);
      currentFilteredExporterCount = parseInt(summarization.SUMMARY_SELLERS);
    } else {
      summaryPanelSellerCounter.text('N/A');
      currentFilteredExporterCount = 0;
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
        currentFilteredCountryCount = 0;
        $(`#${filterPanelCountryOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          $(this).find('label span b').text(`0`);
          shipmentMasterFilterSet.FILTER_COUNTRY.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).find('input').attr('id') == filterValue._id) {
              $(this).find('label span b').text(`${filterValue.count}`);
              currentFilteredCountryCount++;
            }
          });
        });
      } else {
        currentFilteredCountryCount = 0;
        shipmentMasterFilterSet.FILTER_COUNTRY.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
          let optionItem = `
            <div class="checkbox checkbox-primary mb-2">
              <input class="filter-country-checkbox" id="${filterValue._id}" type="checkbox">
              <label for="${filterValue._id}" class="text-dark">${filterValue._id.toString().toUpperCase().trim()}
                <span class="text-muted float-right"><b>${filterValue.count}</b></span>
              </label>
            </div>`;
          filterPanelCountryOptions.append(optionItem);
          currentFilteredCountryCount++;
        });
      }
    } else {
      currentFilteredCountryCount = 0;
    }


    if (shipmentMasterFilterSet.FILTER_PORT != null || shipmentMasterFilterSet.FILTER_PORT != undefined) {
      let filterPanelPortOptions = $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options`);
      let isFilterPortSet = (filterPanelPortOptions.find('.checkbox').length > 0) ? true : false;
      if (isFilterPortSet) {
        currentFilteredPortCount = 0;
        $(`#${filterPanelPortOptionsPane.attr('id')} .filter-options .checkbox`).each(function (index, value) {
          $(this).find('label span b').text(`0`);
          shipmentMasterFilterSet.FILTER_PORT.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
            if ($(this).find('input').attr('id') == filterValue._id) {
              $(this).find('label span b').text(`${filterValue.count}`);
              currentFilteredPortCount++;
            }
          });
        });
      } else {
        currentFilteredPortCount = 0;
        shipmentMasterFilterSet.FILTER_PORT.sort(arrayObjectKeyCountDescendingSort).forEach(filterValue => {
          let optionItem = `
            <div class="checkbox checkbox-primary mb-2">
              <input class="filter-port-checkbox" id="${filterValue._id}" type="checkbox">
              <label for="${filterValue._id}" class="text-dark">${filterValue._id.toString().toUpperCase().trim()}
                <span class="text-muted float-right"><b>${filterValue.count}</b></span>
              </label>
            </div>`;
          filterPanelPortOptions.append(optionItem);
          currentFilteredPortCount++;
        });
      }
    } else {
      currentFilteredPortCount = 0;
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
                console.log(matchClauseFilterMonth);
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
    //paramsObj.tradeType = currentTradeType;
    //paramsObj.countryCode = currentCountryCode;
    //paramsObj.tradeYear = currentTradeYear;
    paramsObj.workspaceBucket = currentWorkspaceBucket;
    paramsObj.workspaceTotalRecords = currentTotalRecords;
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
    //console.log(JSON.stringify(obj));
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
    $("#container-definition-trade-shipment .card-disabled").show();

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
        url: API_HOST.concat(ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_RECORDS),
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

          //Explicit Casting decimal128: console.log(exploreShipmentSpecification.dataTypes_fields);
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

          $("#container-definition-trade-shipment .card-disabled").hide();
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
    window.location.assign(API_HOST.concat(ENDPOINT_WORKSPACE_ANALYTICS_PAGE, QUERY_PARAMS_INDICATOR,
      'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, currentTradeType, QUERY_PARAMS_SEPARATOR,
      'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, currentCountryCode, QUERY_PARAMS_SEPARATOR,
      'workspaceId', QUERY_PARAMS_VALUE_ASSIGNER, currentWorkspaceId, QUERY_PARAMS_SEPARATOR,
      'workspaceBucket', QUERY_PARAMS_VALUE_ASSIGNER, currentWorkspaceBucket, QUERY_PARAMS_SEPARATOR,
      'workspaceName', QUERY_PARAMS_VALUE_ASSIGNER, currentWorkspaceName));
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
        fetchExploreShipmentBuyerSellerPatternSearchAPIHandler(
          currentWorkspaceBucket, searchField, searchTerm, aliasType);
      }
    }, 300);
  }

  /*
  $(document).on('click', '.value-swapper .cta-search-term', function (e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    let searchBoxValueHolder = $(this).parent('.bs-searchbox').find('input');
    triggerSearchTerm(searchBoxValueHolder);
  });
  */

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

  function initiateFetchDataBuild(reloadType, isDefaultInit) {
    //currentTradeType = $(`#${semanticPanelTradeSelect.attr('id')} option:selected`).val();
    //currentCountryCode = $(`#${semanticPanelCountrySelect.attr('id')} option:selected`).val();
    //currentTradeYear = $(`#${semanticPanelYearSelect.attr('id')} option:selected`).val();
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

    switch (currentResultTemplate) {
      case SHIPMENT_RESULT_TYPE_RECORDS: {
        reloadExploreShipmentResults(reloadType);
        break;
      }
      case SHIPMENT_RESULT_TYPE_STATISTICS: {
        reloadExploreShipmentResults(reloadType);
        let paramsObj = formulateDataShipmentPayload(SHIPMENT_RESULT_TYPE_STATISTICS);
        //paramsObj.tradeType = currentTradeType;
        //paramsObj.countryCode = currentCountryCode;
        //paramsObj.tradeYear = currentTradeYear;
        paramsObj.workspaceBucket = currentWorkspaceBucket;
        paramsObj.workspaceTotalRecords = currentTotalRecords;
        triggerStatisticsDTListFetch(paramsObj);
        break;
      }
      default:
        break;
    }
  }

  searchPanelActionResetButton.on('click', function (e) {
    reloadExploreShipment();
  });

  searchPanelActionSearchButton.on('click', function (e) {
    revokeAnalyticsTabLoaders(true); // For Analytics
    isFilterRefresh = true;
    initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_SEARCH, false);
  });

  filterPanelGlobalActionApplyButton.on('click', function (e) {
    revokeAnalyticsTabLoaders(true); // For Analytics
    $('body').removeClass(`right-bar-action-data-column-enabled right-bar-filter-hscode-enabled right-bar-filter-country-enabled
    right-bar-filter-port-enabled right-bar-filter-quantity-enabled right-bar-filter-price-enabled right-bar-filter-month-enabled`);
    initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_FILTER, false);
  });

  $(document).on('keypress', '.value-swapper input[type="search"]', function (e) {
    if (e.keyCode === 13) {
      isFilterRefresh = true;
      initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_SEARCH, false);
    }
  });

  // Workspace Panel Section

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

  deleteWorkspaceSelectedRecordsButton.on('click', function (e) {
    currentWorkspaceAddRecordsType = WORKSPACE_ADD_TYPE_RECORDS_SELECTIONS;
    fetchUserWorkspacesAPIHandler(CLIENT_USER_ID, currentTradeType, currentCountryCode);
  });

  confirmWorkspaceRecordsDeleteButton.on('click', function (e) {
    let payload = packWorkspaceRecordsAdditionParams();
    Custombox.modal.close();
    let intervalID = window.setTimeout(function (e) {
      addWorkspaceRecordsAPIHandler(CLIENT_ACCOUNT_ID, CLIENT_USER_ID, payload);
      clearTimeout(intervalID);
    }, 100);

  });


  // Explore Panel Build

  function buildShipmentExplorePanel() {
    if (!exploreShipmentSpecification.data_bucket) {
      return;
    }
    buildExploreShipmentEstimate(exploreShipmentSpecification.totalRecords);
    revokeAnalyticsTabLoaders(true);
    isFilterRefresh = true;
    initiateFetchDataBuild(RESULT_EXPLORE_RELOAD_TYPE_SEARCH, true);
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


  function buildExploreShipmentTraders(shipmentTraders) {
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
  }


  // Workspace Analytics Specifications Response Section

  function buildWorkspaceAnalyticsSpecifications(workspaceAnalyticsSpecifications) {
    if (!workspaceAnalyticsSpecifications) {
      Swal.fire({
        title: "Workspace Analytics Unavailable",
        text: "No Shipment Records Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      exploreShipmentSpecification = workspaceAnalyticsSpecifications;
      //prepareSearchYearOptions();
      prepareSearchMonthStartOptions(false, null);
      prepareSearchMonthEndOptions(false, null);
      prepareSearchTermTypeOptions();
      prepareFilterTypeOptions();
      buildShipmentExplorePanel();
    }
  }


  /*  Analytics Component */


  // Correlation Analytics Section

  function updateChronologicalTradeFactorsCorrelationChartData(chartInstance, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateChronologicalTradeFactorsCorrelationAnalyticsPayload() {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_COMBINED) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_ALL
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields
      },
      timeboundaryRange: [{
          "year": 2019,
          "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        {
          "year": 2020,
          "months": [1, 2, 3]
        }
      ]
    };

    return payload;
  }

  function prepareChronologicalTradeFactorsCorrelationAnalyticsChart(chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-factor-chart').highcharts();
    updateChronologicalTradeFactorsCorrelationChartData(correlationChart, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-factor .card-disabled").hide();
  }

  function buildChronologicalTradeFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          currentAnalyticsCorrelationTradeFactors = JSON.parse(JSON.stringify(analyticsData));
          const analyticsCorrelationFactors = JSON.parse(JSON.stringify(currentAnalyticsCorrelationTradeFactors));
          let selectedLeftFactor = $("#content-correlation-trade-factor .plot-factor-left-select").children("option:selected").attr("data-factor");
          let selectedRightFactor = $("#content-correlation-trade-factor .plot-factor-right-select").children("option:selected").attr("data-factor");
          let chartDataLeftYAxis = JSON.parse(JSON.stringify(analyticsCorrelationFactors.factorPlotPoints.filter(data => data.factor === selectedLeftFactor)[0]));
          let chartDataRightYAxis = JSON.parse(JSON.stringify(analyticsCorrelationFactors.factorPlotPoints.filter(data => data.factor === selectedRightFactor)[0]));
          prepareChronologicalTradeFactorsCorrelationAnalyticsChart(chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-factor .custom-select').on('change', function (e) {
    const analyticsCorrelationFactors = JSON.parse(JSON.stringify(currentAnalyticsCorrelationTradeFactors));
    let selectedFactor = $(this).children("option:selected");
    let axisDirection = $(this).attr('data-axis-direction');
    let factor = selectedFactor.attr('data-factor');
    let factorVal = selectedFactor.val();
    if (axisDirection == "left") {
      $('#content-correlation-trade-factor .highcharts-axis-title').eq(0).find('tspan').text(factorVal);
      $('#content-correlation-trade-factor .label-selected-factor-left tspan').text(factorVal);
      const chartDataLeftYAxis = JSON.parse(JSON.stringify(analyticsCorrelationFactors.factorPlotPoints.filter(data => data.factor === factor)[0]));
      prepareChronologicalTradeFactorsCorrelationAnalyticsChart(JSON.parse(JSON.stringify(chartDataLeftYAxis)), null);
    } else if (axisDirection == "right") {
      $('#content-correlation-trade-factor .highcharts-axis-title').eq(1).find('tspan').text(factorVal);
      $('#content-correlation-trade-factor .label-selected-factor-right').text(factorVal);
      const chartDataRightYAxis = JSON.parse(JSON.stringify(analyticsCorrelationFactors.factorPlotPoints.filter(data => data.factor === factor)[0]));
      prepareChronologicalTradeFactorsCorrelationAnalyticsChart(null, JSON.parse(JSON.stringify(chartDataRightYAxis)));
    }

  });


  // Distribution Analytics Section


  function updateChronologicalTradeEntitiesFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateChronologicalTradeEntitiesFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let entityBlock = analyticsFactorBLock.component.entities.filter(entityBundle => entityBundle.entity == entity.toUpperCase())[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: entityBlock.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareChronologicalTradeEntityByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-entity-quantity-chart').highcharts();
    updateChronologicalTradeEntitiesFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-entity-quantity .card-disabled").hide();
  }

  function prepareChronologicalTradeEntityByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-entity-price-chart').highcharts();
    updateChronologicalTradeEntitiesFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-entity-price .card-disabled").hide();
  }

  function buildChronologicalTradeEntitiesFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareChronologicalTradeEntityByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareChronologicalTradeEntityByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-entity-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-entity-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-entity-quantity .label-selected-entity').text(entity);

    invokeChronologicalTradeEntityByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-entity-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-entity-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-entity-price .label-selected-entity').text(entity);

    invokeChronologicalTradeEntityByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });


  // Comparison Analytics Section

  function updateChronologicalTradeEntitiesFactorsComparisonChartData(chartInstance, chartData) {
    let comparisonChart = chartInstance;
    while (comparisonChart.series.length > 0) {
      comparisonChart.series[0].remove(false);
    }
    chartData.entityPlotPoints.forEach(seriesPoints => {
      comparisonChart.addSeries(seriesPoints, false);
    });
    comparisonChart.redraw();
  }

  function formulateChronologicalTradeEntitiesFactorsComparisonAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPARISON) {
        if (section.component.factor == factor.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let entityBlock = analyticsFactorBLock.component.entities.filter(entityBundle => entityBundle.entity == entity.toUpperCase())[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "LINE",
        classification: "BASIC"
      },
      specification: {
        type: "ANALYTICS_COMPARISON",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: entityBlock.analytics_fields,
        "order": order,
        "limit": cap
      },
      timeboundaryRange: [{
          "year": 2019,
          "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        },
        {
          "year": 2020,
          "months": [1, 2, 3]
        }
      ]
    };

    return payload;
  }

  function prepareChronologicalTradeEntityByQuantityComparisonAnalyticsChart(chartData) {
    let comparisonChart = $('#comparison-entity-quantity-chart').highcharts();
    updateChronologicalTradeEntitiesFactorsComparisonChartData(comparisonChart, chartData);
    $("#container-comparison-entity-quantity .card-disabled").hide();
  }

  function prepareChronologicalTradeEntityByPriceComparisonAnalyticsChart(chartData) {
    let comparisonChart = $('#comparison-entity-price-chart').highcharts();
    updateChronologicalTradeEntitiesFactorsComparisonChartData(comparisonChart, chartData);
    $("#container-comparison-entity-price .card-disabled").hide();
  }

  function prepareChronologicalTradeEntityByAverageUnitPriceComparisonAnalyticsChart(chartData) {
    let comparisonChart = $('#comparison-entity-average-unit-price-chart').highcharts();
    updateChronologicalTradeEntitiesFactorsComparisonChartData(comparisonChart, chartData);
    $("#container-comparison-entity-average-unit-price .card-disabled").hide();
  }

  function buildChronologicalTradeEntitiesFactorsComparisonAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Comparison Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareChronologicalTradeEntityByQuantityComparisonAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareChronologicalTradeEntityByPriceComparisonAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          prepareChronologicalTradeEntityByAverageUnitPriceComparisonAnalyticsChart(analyticsData);
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-comparison-entity-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-comparison-entity-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-comparison-entity-quantity .label-selected-entity').text(entity);

    invokeChronologicalTradeEntityByQuantityComparisonAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-comparison-entity-price .custom-select').on('change', function (e) {
    let contentId = $('#content-comparison-entity-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    invokeChronologicalTradeEntityByPriceComparisonAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  $('#content-comparison-entity-average-unit-price .custom-select').on('change', function (e) {
    let contentId = $('#content-comparison-entity-average-unit-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    invokeChronologicalTradeEntityByAverageUnitPriceComparisonAnalytics(entity, TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE, order, cap);
  });



  // Importer Distribution Analytics Section

  function updateTradeImporterFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateTradeImporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase() && section.component.entity == entity.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeImporterByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-trade-importer-quantity-chart').highcharts();
    updateTradeImporterFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-trade-importer-quantity .card-disabled").hide();
  }

  function prepareTradeImporterByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-trade-importer-price-chart').highcharts();
    updateTradeImporterFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-trade-importer-price .card-disabled").hide();
  }

  function buildTradeImporterFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareTradeImporterByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareTradeImporterByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-trade-importer-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-importer-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-importer-quantity .label-selected-entity').text(entity);

    invokeTradeImporterByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-trade-importer-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-importer-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-importer-price .label-selected-entity').text(entity);

    invokeTradeImporterByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  // Importer Correlation Analytics Section

  function updateTradeImporterFactorsCorrelationChartData(chartInstance, domainDataC, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (domainDataC != null) {
      correlationChart.xAxis[0].setCategories(domainDataC.plotPoints, true);
    }

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateTradeImporterFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_INDIVIDUAL && section.component.entity == TRADE_ENTITY_TYPE_IMPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_DUO,
        domain: TRADE_ENTITY_TYPE_IMPORTER,
        factorFirst: factorFirst.toUpperCase(),
        factorSecond: factorSecond.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeImporterFactorsCorrelationAnalyticsChart(domainDataCategories, chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-importer-factor-chart').highcharts();
    updateTradeImporterFactorsCorrelationChartData(correlationChart, domainDataCategories, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-importer-factor .card-disabled").hide();
  }

  function buildTradeImporterFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          let analyticsCorrelationTradeImporterFactors = JSON.parse(JSON.stringify(analyticsData));
          let chartDataCategoriesXAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeImporterFactors.domainPlotPoints))
          };
          let chartDataLeftYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeImporterFactors.factorPlotPoints.first))
          };
          let chartDataRightYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeImporterFactors.factorPlotPoints.second))
          };
          prepareTradeImporterFactorsCorrelationAnalyticsChart(chartDataCategoriesXAxis, chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-importer-factor .custom-select').on('change', function (e) {

    let contentId = $('#content-correlation-trade-importer-factor').attr('id');
    let selectedLeftFactor = $(`#${contentId} .plot-factor-left-select option:selected`);
    let selectedRightFactor = $(`#${contentId} .plot-factor-right-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorLeft = selectedLeftFactor.attr('data-factor');
    let factorRight = selectedRightFactor.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-correlation-trade-importer-factor .highcharts-axis-title').eq(0).find('tspan').text(selectedLeftFactor.val());
    $('#content-correlation-trade-importer-factor .label-selected-factor-left').text(selectedLeftFactor.val());
    $('#content-correlation-trade-importer-factor .highcharts-axis-title').eq(1).find('tspan').text(selectedRightFactor.val());
    $('#content-correlation-trade-importer-factor .label-selected-factor-right').text(selectedRightFactor.val());

    invokeTradeImporterFactorsCorrelationAnalytics(factorLeft, factorRight, order, cap);
  });

  // Importer Trade Contribution

  function formulateTradeImporterFactorsContributionAnalyticsPayload(factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION) {
        if (section.component.contrast == TRADE_CONTRAST_TYPE_DIFFERENTIAL && section.component.entity == TRADE_ENTITY_TYPE_IMPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredImporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_CONTRIBUTION",
        contrast: TRADE_CONTRAST_TYPE_DIFFERENTIAL,
        entity: TRADE_ENTITY_TYPE_IMPORTER,
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeImporterFactorsContributionAnalyticsFilterOptions() {
    let contentId = $('#content-contribution-trade-importer-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-contribution-trade-importer-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-contribution-trade-importer-factor .label-selected-factor').text(selectedFactorSort.val());

    return {
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-contribution-trade-importer-factor .custom-select').on('change', function (e) {
    if (tradeImporterFactorsContributionAnalysisTable != null) {
      tradeImporterFactorsContributionAnalysisTable.clear();
      tradeImporterFactorsContributionAnalysisTable.columns.adjust().draw();
    }
  });

  // Importer Trade Periodisation

  function formulateTradeImporterFactorsPeriodisationAnalyticsPayload(factor, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_PERIODISATION) {
        if (section.component.interval == TRADE_INTERVAL_TYPE_FIXED && section.component.entity == TRADE_ENTITY_TYPE_IMPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredImporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_PERIODISATION",
        interval: TRADE_INTERVAL_TYPE_FIXED,
        entity: TRADE_ENTITY_TYPE_IMPORTER,
        factor: factor.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      },
      timeboundaryRange: [{
        "year": 2019,
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }]
    };

    return payload;
  }

  function assessTradeImporterFactorsPeriodisationAnalyticsFilterOptions() {
    let contentId = $('#content-periodisation-trade-importer-factor').attr('id');
    let selectedFactorPLot = $(`#${contentId} .plot-factor-plot-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorPLot = selectedFactorPLot.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-periodisation-trade-importer-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-periodisation-trade-importer-factor .label-selected-factor').text(selectedFactorPLot.val());

    return {
      factorPlot: factorPLot,
      order: order
    };
  }

  $('#content-periodisation-trade-importer-factor .custom-select').on('change', function (e) {
    if (tradeImporterFactorsPeriodisationAnalysisTable != null) {
      tradeImporterFactorsPeriodisationAnalysisTable.clear();
      tradeImporterFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    }
  });

  // Importer Trade Composition

  function formulateTradeImporterFactorsCompositionAnalyticsPayload(entities, factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPOSITION) {
        if (section.component.pattern == TRADE_PATTERN_TYPE_TREE && section.component.entity == TRADE_ENTITY_TYPE_IMPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredImporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_COMPOSITION",
        pattern: TRADE_PATTERN_TYPE_TREE,
        entity: {
          primary: TRADE_ENTITY_TYPE_IMPORTER,
          secondary: entities.secondary,
          tertiary: entities.tertiary,
          quarternary: entities.quarternary
        },
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeImporterFactorsCompositionAnalyticsFilterOptions() {
    let contentId = $('#content-composition-trade-importer-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);
    let selectedEntityPatternPrimary = $(`#${contentId} .plot-entity-pattern-primary-select option:selected`);
    let selectedEntityPatternSecondary = $(`#${contentId} .plot-entity-pattern-secondary-select option:selected`);
    let selectedEntityPatternTertiary = $(`#${contentId} .plot-entity-pattern-tertiary-select option:selected`);
    let selectedEntityPatternQuarternary = $(`#${contentId} .plot-entity-pattern-quarternary-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let entityPrimary = selectedEntityPatternPrimary.attr('data-entity-primary');
    let entitySecondary = selectedEntityPatternSecondary.attr('data-entity-secondary');
    let entityTertiary = selectedEntityPatternTertiary.attr('data-entity-tertiary');
    let entityQuarternary = selectedEntityPatternQuarternary.attr('data-entity-quarternary');

    $('#content-composition-trade-importer-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-composition-trade-importer-factor .label-selected-entity-secondary').text(entitySecondary);
    $('#content-composition-trade-importer-factor .label-selected-entity-tertiary').text(entityTertiary);
    $('#content-composition-trade-importer-factor .label-selected-entity-quarternary').text(entityQuarternary);

    return {
      entities: {
        primary: entityPrimary,
        secondary: entitySecondary,
        tertiary: entityTertiary,
        quarternary: entityQuarternary
      },
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-composition-trade-importer-factor .custom-select').on('change', function (e) {
    if (tradeImporterFactorsCompositionAnalysisTable != null) {
      tradeImporterFactorsCompositionAnalysisTable.clear();
      tradeImporterFactorsCompositionAnalysisTable.columns.adjust().draw();
    }
  });


  // Exporter Distribution Analytics Section

  function updateTradeExporterFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateTradeExporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase() && section.component.entity == entity.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeExporterByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-trade-exporter-quantity-chart').highcharts();
    updateTradeExporterFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-trade-exporter-quantity .card-disabled").hide();
  }

  function prepareTradeExporterByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-trade-exporter-price-chart').highcharts();
    updateTradeExporterFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-trade-exporter-price .card-disabled").hide();
  }

  function buildTradeExporterFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareTradeExporterByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareTradeExporterByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-trade-exporter-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-exporter-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-exporter-quantity .label-selected-entity').text(entity);

    invokeTradeExporterByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-trade-exporter-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-exporter-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-exporter-price .label-selected-entity').text(entity);

    invokeTradeExporterByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  // Exporter Correlation Analytics Section

  function updateTradeExporterFactorsCorrelationChartData(chartInstance, domainDataC, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (domainDataC != null) {
      correlationChart.xAxis[0].setCategories(domainDataC.plotPoints, true);
    }

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateTradeExporterFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_INDIVIDUAL && section.component.entity == TRADE_ENTITY_TYPE_EXPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_DUO,
        domain: TRADE_ENTITY_TYPE_EXPORTER,
        factorFirst: factorFirst.toUpperCase(),
        factorSecond: factorSecond.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeExporterFactorsCorrelationAnalyticsChart(domainDataCategories, chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-exporter-factor-chart').highcharts();
    updateTradeExporterFactorsCorrelationChartData(correlationChart, domainDataCategories, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-exporter-factor .card-disabled").hide();
  }

  function buildTradeExporterFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          let analyticsCorrelationTradeExporterFactors = JSON.parse(JSON.stringify(analyticsData));
          let chartDataCategoriesXAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeExporterFactors.domainPlotPoints))
          };
          let chartDataLeftYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeExporterFactors.factorPlotPoints.first))
          };
          let chartDataRightYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeExporterFactors.factorPlotPoints.second))
          };
          prepareTradeExporterFactorsCorrelationAnalyticsChart(chartDataCategoriesXAxis, chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-exporter-factor .custom-select').on('change', function (e) {

    let contentId = $('#content-correlation-trade-exporter-factor').attr('id');
    let selectedLeftFactor = $(`#${contentId} .plot-factor-left-select option:selected`);
    let selectedRightFactor = $(`#${contentId} .plot-factor-right-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorLeft = selectedLeftFactor.attr('data-factor');
    let factorRight = selectedRightFactor.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-correlation-trade-exporter-factor .highcharts-axis-title').eq(0).find('tspan').text(selectedLeftFactor.val());
    $('#content-correlation-trade-exporter-factor .label-selected-factor-left').text(selectedLeftFactor.val());
    $('#content-correlation-trade-exporter-factor .highcharts-axis-title').eq(1).find('tspan').text(selectedRightFactor.val());
    $('#content-correlation-trade-exporter-factor .label-selected-factor-right').text(selectedRightFactor.val());

    invokeTradeExporterFactorsCorrelationAnalytics(factorLeft, factorRight, order, cap);
  });

  // Exporter Trade Contribution

  function formulateTradeExporterFactorsContributionAnalyticsPayload(factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION) {
        if (section.component.contrast == TRADE_CONTRAST_TYPE_DIFFERENTIAL && section.component.entity == TRADE_ENTITY_TYPE_EXPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredExporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_CONTRIBUTION",
        contrast: TRADE_CONTRAST_TYPE_DIFFERENTIAL,
        entity: TRADE_ENTITY_TYPE_EXPORTER,
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeExporterFactorsContributionAnalyticsFilterOptions() {
    let contentId = $('#content-contribution-trade-exporter-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-contribution-trade-exporter-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-contribution-trade-exporter-factor .label-selected-factor').text(selectedFactorSort.val());

    return {
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-contribution-trade-exporter-factor .custom-select').on('change', function (e) {
    if (tradeExporterFactorsContributionAnalysisTable != null) {
      tradeExporterFactorsContributionAnalysisTable.clear();
      tradeExporterFactorsContributionAnalysisTable.columns.adjust().draw();
    }
  });

  // Exporter Trade Periodisation

  function formulateTradeExporterFactorsPeriodisationAnalyticsPayload(factor, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_PERIODISATION) {
        if (section.component.interval == TRADE_INTERVAL_TYPE_FIXED && section.component.entity == TRADE_ENTITY_TYPE_EXPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredExporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_PERIODISATION",
        interval: TRADE_INTERVAL_TYPE_FIXED,
        entity: TRADE_ENTITY_TYPE_EXPORTER,
        factor: factor.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      },
      timeboundaryRange: [{
        "year": 2019,
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }]
    };

    return payload;
  }

  function assessTradeExporterFactorsPeriodisationAnalyticsFilterOptions() {
    let contentId = $('#content-periodisation-trade-exporter-factor').attr('id');
    let selectedFactorPLot = $(`#${contentId} .plot-factor-plot-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorPLot = selectedFactorPLot.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-periodisation-trade-exporter-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-periodisation-trade-exporter-factor .label-selected-factor').text(selectedFactorPLot.val());

    return {
      factorPlot: factorPLot,
      order: order
    };
  }

  $('#content-periodisation-trade-exporter-factor .custom-select').on('change', function (e) {
    if (tradeExporterFactorsPeriodisationAnalysisTable != null) {
      tradeExporterFactorsPeriodisationAnalysisTable.clear();
      tradeExporterFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    }
  });

  // Exporter Trade Composition

  function formulateTradeExporterFactorsCompositionAnalyticsPayload(entities, factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPOSITION) {
        if (section.component.pattern == TRADE_PATTERN_TYPE_TREE && section.component.entity == TRADE_ENTITY_TYPE_EXPORTER) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredExporterCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_COMPOSITION",
        pattern: TRADE_PATTERN_TYPE_TREE,
        entity: {
          primary: TRADE_ENTITY_TYPE_EXPORTER,
          secondary: entities.secondary,
          tertiary: entities.tertiary,
          quarternary: entities.quarternary
        },
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeExporterFactorsCompositionAnalyticsFilterOptions() {
    let contentId = $('#content-composition-trade-exporter-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);
    let selectedEntityPatternPrimary = $(`#${contentId} .plot-entity-pattern-primary-select option:selected`);
    let selectedEntityPatternSecondary = $(`#${contentId} .plot-entity-pattern-secondary-select option:selected`);
    let selectedEntityPatternTertiary = $(`#${contentId} .plot-entity-pattern-tertiary-select option:selected`);
    let selectedEntityPatternQuarternary = $(`#${contentId} .plot-entity-pattern-quarternary-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let entityPrimary = selectedEntityPatternPrimary.attr('data-entity-primary');
    let entitySecondary = selectedEntityPatternSecondary.attr('data-entity-secondary');
    let entityTertiary = selectedEntityPatternTertiary.attr('data-entity-tertiary');
    let entityQuarternary = selectedEntityPatternQuarternary.attr('data-entity-quarternary');

    $('#content-composition-trade-exporter-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-composition-trade-exporter-factor .label-selected-entity-secondary').text(entitySecondary);
    $('#content-composition-trade-exporter-factor .label-selected-entity-tertiary').text(entityTertiary);
    $('#content-composition-trade-exporter-factor .label-selected-entity-quarternary').text(entityQuarternary);

    return {
      entities: {
        primary: entityPrimary,
        secondary: entitySecondary,
        tertiary: entityTertiary,
        quarternary: entityQuarternary
      },
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-composition-trade-exporter-factor .custom-select').on('change', function (e) {
    if (tradeExporterFactorsCompositionAnalysisTable != null) {
      tradeExporterFactorsCompositionAnalysisTable.clear();
      tradeExporterFactorsCompositionAnalysisTable.columns.adjust().draw();
    }
  });


  // HS Code Distribution Analytics Section

  function updateTradeHsCodeFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateTradeHsCodeFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase() && section.component.entity == entity.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeHsCodeByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-trade-hscode-quantity-chart').highcharts();
    updateTradeHsCodeFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-trade-hscode-quantity .card-disabled").hide();
  }

  function prepareTradeHsCodeByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-trade-hscode-price-chart').highcharts();
    updateTradeHsCodeFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-trade-hscode-price .card-disabled").hide();
  }

  function buildTradeHsCodeFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareTradeHsCodeByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareTradeHsCodeByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-trade-hscode-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-hscode-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-hscode-quantity .label-selected-entity').text(entity);

    invokeTradeHsCodeByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-trade-hscode-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-hscode-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-hscode-price .label-selected-entity').text(entity);

    invokeTradeHsCodeByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  // HsCode Correlation Analytics Section

  function updateTradeHsCodeFactorsCorrelationChartData(chartInstance, domainDataC, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (domainDataC != null) {
      correlationChart.xAxis[0].setCategories(domainDataC.plotPoints, true);
    }

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateTradeHsCodeFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_INDIVIDUAL && section.component.entity == TRADE_ENTITY_TYPE_HSCODE) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_DUO,
        domain: TRADE_ENTITY_TYPE_HSCODE,
        factorFirst: factorFirst.toUpperCase(),
        factorSecond: factorSecond.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeHsCodeFactorsCorrelationAnalyticsChart(domainDataCategories, chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-hscode-factor-chart').highcharts();
    updateTradeHsCodeFactorsCorrelationChartData(correlationChart, domainDataCategories, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-hscode-factor .card-disabled").hide();
  }

  function buildTradeHsCodeFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          let analyticsCorrelationTradeHsCodeFactors = JSON.parse(JSON.stringify(analyticsData));
          let chartDataCategoriesXAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeHsCodeFactors.domainPlotPoints))
          };
          let chartDataLeftYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeHsCodeFactors.factorPlotPoints.first))
          };
          let chartDataRightYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeHsCodeFactors.factorPlotPoints.second))
          };
          prepareTradeHsCodeFactorsCorrelationAnalyticsChart(chartDataCategoriesXAxis, chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-hscode-factor .custom-select').on('change', function (e) {

    let contentId = $('#content-correlation-trade-hscode-factor').attr('id');
    let selectedLeftFactor = $(`#${contentId} .plot-factor-left-select option:selected`);
    let selectedRightFactor = $(`#${contentId} .plot-factor-right-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorLeft = selectedLeftFactor.attr('data-factor');
    let factorRight = selectedRightFactor.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-correlation-trade-hscode-factor .highcharts-axis-title').eq(0).find('tspan').text(selectedLeftFactor.val());
    $('#content-correlation-trade-hscode-factor .label-selected-factor-left').text(selectedLeftFactor.val());
    $('#content-correlation-trade-hscode-factor .highcharts-axis-title').eq(1).find('tspan').text(selectedRightFactor.val());
    $('#content-correlation-trade-hscode-factor .label-selected-factor-right').text(selectedRightFactor.val());

    invokeTradeHsCodeFactorsCorrelationAnalytics(factorLeft, factorRight, order, cap);
  });

  // HS Code Trade Contribution

  function formulateTradeHsCodeFactorsContributionAnalyticsPayload(factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION) {
        if (section.component.contrast == TRADE_CONTRAST_TYPE_DIFFERENTIAL && section.component.entity == TRADE_ENTITY_TYPE_HSCODE) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredHsCodeCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_CONTRIBUTION",
        contrast: TRADE_CONTRAST_TYPE_DIFFERENTIAL,
        entity: TRADE_ENTITY_TYPE_HSCODE,
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeHsCodeFactorsContributionAnalyticsFilterOptions() {
    let contentId = $('#content-contribution-trade-hscode-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-contribution-trade-hscode-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-contribution-trade-hscode-factor .label-selected-factor').text(selectedFactorSort.val());

    return {
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-contribution-trade-hscode-factor .custom-select').on('change', function (e) {
    if (tradeHsCodeFactorsContributionAnalysisTable != null) {
      tradeHsCodeFactorsContributionAnalysisTable.clear();
      tradeHsCodeFactorsContributionAnalysisTable.columns.adjust().draw();
    }
  });

  // HsCode Trade Periodisation

  function formulateTradeHsCodeFactorsPeriodisationAnalyticsPayload(factor, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_PERIODISATION) {
        if (section.component.interval == TRADE_INTERVAL_TYPE_FIXED && section.component.entity == TRADE_ENTITY_TYPE_HSCODE) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredHsCodeCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_PERIODISATION",
        interval: TRADE_INTERVAL_TYPE_FIXED,
        entity: TRADE_ENTITY_TYPE_HSCODE,
        factor: factor.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      },
      timeboundaryRange: [{
        "year": 2019,
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }]
    };

    return payload;
  }

  function assessTradeHsCodeFactorsPeriodisationAnalyticsFilterOptions() {
    let contentId = $('#content-periodisation-trade-hscode-factor').attr('id');
    let selectedFactorPLot = $(`#${contentId} .plot-factor-plot-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorPLot = selectedFactorPLot.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-periodisation-trade-hscode-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-periodisation-trade-hscode-factor .label-selected-factor').text(selectedFactorPLot.val());

    return {
      factorPlot: factorPLot,
      order: order
    };
  }

  $('#content-periodisation-trade-hscode-factor .custom-select').on('change', function (e) {
    if (tradeHsCodeFactorsPeriodisationAnalysisTable != null) {
      tradeHsCodeFactorsPeriodisationAnalysisTable.clear();
      tradeHsCodeFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    }
  });

  // HsCode Trade Composition

  function formulateTradeHsCodeFactorsCompositionAnalyticsPayload(entities, factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPOSITION) {
        if (section.component.pattern == TRADE_PATTERN_TYPE_TREE && section.component.entity == TRADE_ENTITY_TYPE_HSCODE) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredHsCodeCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_COMPOSITION",
        pattern: TRADE_PATTERN_TYPE_TREE,
        entity: {
          primary: TRADE_ENTITY_TYPE_HSCODE,
          secondary: entities.secondary,
          tertiary: entities.tertiary,
          quarternary: entities.quarternary
        },
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeHsCodeFactorsCompositionAnalyticsFilterOptions() {
    let contentId = $('#content-composition-trade-hscode-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);
    let selectedEntityPatternPrimary = $(`#${contentId} .plot-entity-pattern-primary-select option:selected`);
    let selectedEntityPatternSecondary = $(`#${contentId} .plot-entity-pattern-secondary-select option:selected`);
    let selectedEntityPatternTertiary = $(`#${contentId} .plot-entity-pattern-tertiary-select option:selected`);
    let selectedEntityPatternQuarternary = $(`#${contentId} .plot-entity-pattern-quarternary-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let entityPrimary = selectedEntityPatternPrimary.attr('data-entity-primary');
    let entitySecondary = selectedEntityPatternSecondary.attr('data-entity-secondary');
    let entityTertiary = selectedEntityPatternTertiary.attr('data-entity-tertiary');
    let entityQuarternary = selectedEntityPatternQuarternary.attr('data-entity-quarternary');

    $('#content-composition-trade-hscode-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-composition-trade-hscode-factor .label-selected-entity-secondary').text(entitySecondary);
    $('#content-composition-trade-hscode-factor .label-selected-entity-tertiary').text(entityTertiary);
    $('#content-composition-trade-hscode-factor .label-selected-entity-quarternary').text(entityQuarternary);

    return {
      entities: {
        primary: entityPrimary,
        secondary: entitySecondary,
        tertiary: entityTertiary,
        quarternary: entityQuarternary
      },
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-composition-trade-hscode-factor .custom-select').on('change', function (e) {
    if (tradeHsCodeFactorsCompositionAnalysisTable != null) {
      tradeHsCodeFactorsCompositionAnalysisTable.clear();
      tradeHsCodeFactorsCompositionAnalysisTable.columns.adjust().draw();
    }
  });


  // Port Distribution Analytics Section

  function updateTradePortFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateTradePortFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase() && section.component.entity == entity.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradePortByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-trade-port-quantity-chart').highcharts();
    updateTradePortFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-trade-port-quantity .card-disabled").hide();
  }

  function prepareTradePortByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-trade-port-price-chart').highcharts();
    updateTradePortFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-trade-port-price .card-disabled").hide();
  }

  function buildTradePortFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareTradePortByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareTradePortByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-trade-port-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-port-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-port-quantity .label-selected-entity').text(entity);

    invokeTradePortByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-trade-port-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-port-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-port-price .label-selected-entity').text(entity);

    invokeTradePortByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  // Port Correlation Analytics Section

  function updateTradePortFactorsCorrelationChartData(chartInstance, domainDataC, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (domainDataC != null) {
      correlationChart.xAxis[0].setCategories(domainDataC.plotPoints, true);
    }

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateTradePortFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_INDIVIDUAL && section.component.entity == TRADE_ENTITY_TYPE_PORT) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_DUO,
        domain: TRADE_ENTITY_TYPE_PORT,
        factorFirst: factorFirst.toUpperCase(),
        factorSecond: factorSecond.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradePortFactorsCorrelationAnalyticsChart(domainDataCategories, chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-port-factor-chart').highcharts();
    updateTradePortFactorsCorrelationChartData(correlationChart, domainDataCategories, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-port-factor .card-disabled").hide();
  }

  function buildTradePortFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          let analyticsCorrelationTradePortFactors = JSON.parse(JSON.stringify(analyticsData));
          let chartDataCategoriesXAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradePortFactors.domainPlotPoints))
          };
          let chartDataLeftYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradePortFactors.factorPlotPoints.first))
          };
          let chartDataRightYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradePortFactors.factorPlotPoints.second))
          };
          prepareTradePortFactorsCorrelationAnalyticsChart(chartDataCategoriesXAxis, chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-port-factor .custom-select').on('change', function (e) {

    let contentId = $('#content-correlation-trade-port-factor').attr('id');
    let selectedLeftFactor = $(`#${contentId} .plot-factor-left-select option:selected`);
    let selectedRightFactor = $(`#${contentId} .plot-factor-right-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorLeft = selectedLeftFactor.attr('data-factor');
    let factorRight = selectedRightFactor.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-correlation-trade-port-factor .highcharts-axis-title').eq(0).find('tspan').text(selectedLeftFactor.val());
    $('#content-correlation-trade-port-factor .label-selected-factor-left').text(selectedLeftFactor.val());
    $('#content-correlation-trade-port-factor .highcharts-axis-title').eq(1).find('tspan').text(selectedRightFactor.val());
    $('#content-correlation-trade-port-factor .label-selected-factor-right').text(selectedRightFactor.val());

    invokeTradePortFactorsCorrelationAnalytics(factorLeft, factorRight, order, cap);
  });

  // Port Trade Contribution

  function formulateTradePortFactorsContributionAnalyticsPayload(factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION) {
        if (section.component.contrast == TRADE_CONTRAST_TYPE_DIFFERENTIAL && section.component.entity == TRADE_ENTITY_TYPE_PORT) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredPortCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_CONTRIBUTION",
        contrast: TRADE_CONTRAST_TYPE_DIFFERENTIAL,
        entity: TRADE_ENTITY_TYPE_PORT,
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradePortFactorsContributionAnalyticsFilterOptions() {
    let contentId = $('#content-contribution-trade-port-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-contribution-trade-port-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-contribution-trade-port-factor .label-selected-factor').text(selectedFactorSort.val());

    return {
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-contribution-trade-port-factor .custom-select').on('change', function (e) {
    if (tradePortFactorsContributionAnalysisTable != null) {
      tradePortFactorsContributionAnalysisTable.clear();
      tradePortFactorsContributionAnalysisTable.columns.adjust().draw();
    }
  });

  // Port Trade Periodisation

  function formulateTradePortFactorsPeriodisationAnalyticsPayload(factor, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_PERIODISATION) {
        if (section.component.interval == TRADE_INTERVAL_TYPE_FIXED && section.component.entity == TRADE_ENTITY_TYPE_PORT) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredPortCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_PERIODISATION",
        interval: TRADE_INTERVAL_TYPE_FIXED,
        entity: TRADE_ENTITY_TYPE_PORT,
        factor: factor.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      },
      timeboundaryRange: [{
        "year": 2019,
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }]
    };

    return payload;
  }

  function assessTradePortFactorsPeriodisationAnalyticsFilterOptions() {
    let contentId = $('#content-periodisation-trade-port-factor').attr('id');
    let selectedFactorPLot = $(`#${contentId} .plot-factor-plot-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorPLot = selectedFactorPLot.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-periodisation-trade-port-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-periodisation-trade-port-factor .label-selected-factor').text(selectedFactorPLot.val());

    return {
      factorPlot: factorPLot,
      order: order
    };
  }

  $('#content-periodisation-trade-port-factor .custom-select').on('change', function (e) {
    if (tradePortFactorsPeriodisationAnalysisTable != null) {
      tradePortFactorsPeriodisationAnalysisTable.clear();
      tradePortFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    }
  });

  // Port Trade Composition

  function formulateTradePortFactorsCompositionAnalyticsPayload(entities, factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPOSITION) {
        if (section.component.pattern == TRADE_PATTERN_TYPE_TREE && section.component.entity == TRADE_ENTITY_TYPE_PORT) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredPortCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_COMPOSITION",
        pattern: TRADE_PATTERN_TYPE_TREE,
        entity: {
          primary: TRADE_ENTITY_TYPE_PORT,
          secondary: entities.secondary,
          tertiary: entities.tertiary,
          quarternary: entities.quarternary
        },
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradePortFactorsCompositionAnalyticsFilterOptions() {
    let contentId = $('#content-composition-trade-port-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);
    let selectedEntityPatternPrimary = $(`#${contentId} .plot-entity-pattern-primary-select option:selected`);
    let selectedEntityPatternSecondary = $(`#${contentId} .plot-entity-pattern-secondary-select option:selected`);
    let selectedEntityPatternTertiary = $(`#${contentId} .plot-entity-pattern-tertiary-select option:selected`);
    let selectedEntityPatternQuarternary = $(`#${contentId} .plot-entity-pattern-quarternary-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let entityPrimary = selectedEntityPatternPrimary.attr('data-entity-primary');
    let entitySecondary = selectedEntityPatternSecondary.attr('data-entity-secondary');
    let entityTertiary = selectedEntityPatternTertiary.attr('data-entity-tertiary');
    let entityQuarternary = selectedEntityPatternQuarternary.attr('data-entity-quarternary');

    $('#content-composition-trade-port-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-composition-trade-port-factor .label-selected-entity-secondary').text(entitySecondary);
    $('#content-composition-trade-port-factor .label-selected-entity-tertiary').text(entityTertiary);
    $('#content-composition-trade-port-factor .label-selected-entity-quarternary').text(entityQuarternary);

    return {
      entities: {
        primary: entityPrimary,
        secondary: entitySecondary,
        tertiary: entityTertiary,
        quarternary: entityQuarternary
      },
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-composition-trade-port-factor .custom-select').on('change', function (e) {
    if (tradePortFactorsCompositionAnalysisTable != null) {
      tradePortFactorsCompositionAnalysisTable.clear();
      tradePortFactorsCompositionAnalysisTable.columns.adjust().draw();
    }
  });


  // Country Distribution Analytics Section

  function updateTradeCountryFactorsDistributionChartData(chartInstance, chartData) {
    let distributionChart = chartInstance;
    distributionChart.series[0].setData(chartData.entityPlotPoints, true);
    distributionChart.redraw();
  }

  function formulateTradeCountryFactorsDistributionAnalyticsPayload(entity, factor, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_DISTRIBUTION) {

        if (section.component.factor == factor.toUpperCase() && section.component.entity == entity.toUpperCase()) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "PIE"
      },
      specification: {
        type: "ANALYTICS_DISTRIBUTION",
        factor: factor.toUpperCase(),
        entity: entity.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeCountryByQuantityDistributionAnalyticsChart(chartData) {
    let disributionChart = $('#distribution-trade-country-quantity-chart').highcharts();
    updateTradeCountryFactorsDistributionChartData(disributionChart, chartData);
    $("#container-distribution-trade-country-quantity .card-disabled").hide();
  }

  function prepareTradeCountryByPriceDistributionAnalyticsChart(chartData) {
    let distributionChart = $('#distribution-trade-country-price-chart').highcharts();
    updateTradeCountryFactorsDistributionChartData(distributionChart, chartData);
    $("#container-distribution-trade-country-price .card-disabled").hide();
  }

  function buildTradeCountryFactorsDistributionAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Distribution Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.factor) {
        case TRADE_FACTOR_TYPE_QUANTITY: {
          prepareTradeCountryByQuantityDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_PRICE: {
          prepareTradeCountryByPriceDistributionAnalyticsChart(analyticsData);
          break;
        }
        case TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-distribution-trade-country-quantity .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-country-quantity').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-country-quantity .label-selected-entity').text(entity);

    invokeTradeCountryByQuantityDistributionAnalytics(entity, TRADE_FACTOR_TYPE_QUANTITY, order, cap);
  });

  $('#content-distribution-trade-country-price .custom-select').on('change', function (e) {
    let contentId = $('#content-distribution-trade-country-price').attr('id');
    let selectedEntityUnit = $(`#${contentId} .plot-entity-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let entity = selectedEntityUnit.attr('data-entity');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-distribution-trade-country-price .label-selected-entity').text(entity);

    invokeTradeCountryByPriceDistributionAnalytics(entity, TRADE_FACTOR_TYPE_PRICE, order, cap);
  });

  // Country Correlation Analytics Section

  function updateTradeCountryFactorsCorrelationChartData(chartInstance, domainDataC, chartDataL, chartDataR) {
    let correlationChart = chartInstance;

    if (domainDataC != null) {
      correlationChart.xAxis[0].setCategories(domainDataC.plotPoints, true);
    }

    if (chartDataL != null) {
      correlationChart.series[1].setData(chartDataL.plotPoints, true);
    }

    if (chartDataR != null) {
      correlationChart.series[0].setData(chartDataR.plotPoints, true);
    }

    correlationChart.redraw();
  }

  function formulateTradeCountryFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CORRELATION) {
        if (section.component.factor == TRADE_FACTOR_TYPE_INDIVIDUAL && section.component.entity == TRADE_ENTITY_TYPE_COUNTRY) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      matchExpressions: [],
      chart: {
        type: "CHART",
        classification: "DUAL-AXES"
      },
      specification: {
        type: "ANALYTICS_CORRELATION",
        relation: TRADE_RELATION_TYPE_DUO,
        domain: TRADE_ENTITY_TYPE_COUNTRY,
        factorFirst: factorFirst.toUpperCase(),
        factorSecond: factorSecond.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order,
        "limit": cap
      }
    };

    return payload;
  }

  function prepareTradeCountryFactorsCorrelationAnalyticsChart(domainDataCategories, chartDataLeft, chartDataRight) {
    let correlationChart = $('#correlation-trade-country-factor-chart').highcharts();
    updateTradeCountryFactorsCorrelationChartData(correlationChart, domainDataCategories, chartDataLeft, chartDataRight);
    $("#container-correlation-trade-country-factor .card-disabled").hide();
  }

  function buildTradeCountryFactorsCorrelationAnalytics(analyticsData, analyticsChart, analyticsSpecification) {
    if (!analyticsData) {
      Swal.fire({
        title: "Analytics Unavailable",
        text: "No Correlation Available",
        showConfirmButton: false,
        allowOutsideClick: false
      });
    } else {
      switch (analyticsSpecification.relation) {
        case TRADE_RELATION_TYPE_ALL: {
          break;
        }
        case TRADE_RELATION_TYPE_DUO: {
          let analyticsCorrelationTradeCountryFactors = JSON.parse(JSON.stringify(analyticsData));
          let chartDataCategoriesXAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeCountryFactors.domainPlotPoints))
          };
          let chartDataLeftYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeCountryFactors.factorPlotPoints.first))
          };
          let chartDataRightYAxis = {
            plotPoints: JSON.parse(JSON.stringify(analyticsCorrelationTradeCountryFactors.factorPlotPoints.second))
          };
          prepareTradeCountryFactorsCorrelationAnalyticsChart(chartDataCategoriesXAxis, chartDataLeftYAxis, chartDataRightYAxis);
          break;
        }
        case TRADE_RELATION_TYPE_TRIO: {
          break;
        }
        default: {
          break;
        }
      }
      graceCloseSwal();
    }
  }

  $('#content-correlation-trade-country-factor .custom-select').on('change', function (e) {

    let contentId = $('#content-correlation-trade-country-factor').attr('id');
    let selectedLeftFactor = $(`#${contentId} .plot-factor-left-select option:selected`);
    let selectedRightFactor = $(`#${contentId} .plot-factor-right-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorLeft = selectedLeftFactor.attr('data-factor');
    let factorRight = selectedRightFactor.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let cap = selectedOrderCapUnit.attr('data-cap');

    $('#content-correlation-trade-country-factor .highcharts-axis-title').eq(0).find('tspan').text(selectedLeftFactor.val());
    $('#content-correlation-trade-country-factor .label-selected-factor-left').text(selectedLeftFactor.val());
    $('#content-correlation-trade-country-factor .highcharts-axis-title').eq(1).find('tspan').text(selectedRightFactor.val());
    $('#content-correlation-trade-country-factor .label-selected-factor-right').text(selectedRightFactor.val());

    invokeTradeCountryFactorsCorrelationAnalytics(factorLeft, factorRight, order, cap);
  });

  // Country Trade Contribution

  function formulateTradeCountryFactorsContributionAnalyticsPayload(factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_CONTRIBUTION) {
        if (section.component.contrast == TRADE_CONTRAST_TYPE_DIFFERENTIAL && section.component.entity == TRADE_ENTITY_TYPE_COUNTRY) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredCountryCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_CONTRIBUTION",
        contrast: TRADE_CONTRAST_TYPE_DIFFERENTIAL,
        entity: TRADE_ENTITY_TYPE_COUNTRY,
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeCountryFactorsContributionAnalyticsFilterOptions() {
    let contentId = $('#content-contribution-trade-country-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-contribution-trade-country-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-contribution-trade-country-factor .label-selected-factor').text(selectedFactorSort.val());

    return {
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-contribution-trade-country-factor .custom-select').on('change', function (e) {
    if (tradeCountryFactorsContributionAnalysisTable != null) {
      tradeCountryFactorsContributionAnalysisTable.clear();
      tradeCountryFactorsContributionAnalysisTable.columns.adjust().draw();
    }
  });

  // Country Trade Periodisation

  function formulateTradeCountryFactorsPeriodisationAnalyticsPayload(factor, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_PERIODISATION) {
        if (section.component.interval == TRADE_INTERVAL_TYPE_FIXED && section.component.entity == TRADE_ENTITY_TYPE_COUNTRY) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredCountryCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_PERIODISATION",
        interval: TRADE_INTERVAL_TYPE_FIXED,
        entity: TRADE_ENTITY_TYPE_COUNTRY,
        factor: factor.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      },
      timeboundaryRange: [{
        "year": 2019,
        "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      }]
    };

    return payload;
  }

  function assessTradeCountryFactorsPeriodisationAnalyticsFilterOptions() {
    let contentId = $('#content-periodisation-trade-country-factor').attr('id');
    let selectedFactorPLot = $(`#${contentId} .plot-factor-plot-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);

    let factorPLot = selectedFactorPLot.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');

    $('#content-periodisation-trade-country-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-periodisation-trade-country-factor .label-selected-factor').text(selectedFactorPLot.val());

    return {
      factorPlot: factorPLot,
      order: order
    };
  }

  $('#content-periodisation-trade-country-factor .custom-select').on('change', function (e) {
    if (tradeCountryFactorsPeriodisationAnalysisTable != null) {
      tradeCountryFactorsPeriodisationAnalysisTable.clear();
      tradeCountryFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    }
  });

  // Country Trade Composition

  function formulateTradeCountryFactorsCompositionAnalyticsPayload(entities, factorSort, order) {

    let analyticsGeneralFramework = exploreShipmentSpecification.analytics_framework.filter(framework => framework.type === ANALYTICS_FRAMEWORK_TYPE_GENERAL)[0];

    let analyticsFactorBLock = analyticsGeneralFramework.sections.filter(section => {
      if (section.type == ANALYTICS_SPECIFICATION_TYPE_COMPOSITION) {
        if (section.component.pattern == TRADE_PATTERN_TYPE_TREE && section.component.entity == TRADE_ENTITY_TYPE_COUNTRY) {
          return true;
        }
      }
    })[0];

    let payload = {
      workspaceBucket: currentWorkspaceBucket,
      workspaceEntitiesCount: currentFilteredCountryCount,
      matchExpressions: [],
      chart: {
        type: "TABULAR",
        classification: "LISTING"
      },
      specification: {
        type: "ANALYTICS_COMPOSITION",
        pattern: TRADE_PATTERN_TYPE_TREE,
        entity: {
          primary: TRADE_ENTITY_TYPE_COUNTRY,
          secondary: entities.secondary,
          tertiary: entities.tertiary,
          quarternary: entities.quarternary
        },
        factorSort: factorSort.toUpperCase()
      },
      definition: {
        filterExpression: {},
        fieldTerms: analyticsFactorBLock.component.analytics_fields,
        "order": order
      }
    };

    return payload;
  }

  function assessTradeCountryFactorsCompositionAnalyticsFilterOptions() {
    let contentId = $('#content-composition-trade-country-factor').attr('id');
    let selectedFactorSort = $(`#${contentId} .plot-factor-sort-select option:selected`);
    let selectedOrderCapUnit = $(`#${contentId} .plot-order-cap-select option:selected`);
    let selectedEntityPatternPrimary = $(`#${contentId} .plot-entity-pattern-primary-select option:selected`);
    let selectedEntityPatternSecondary = $(`#${contentId} .plot-entity-pattern-secondary-select option:selected`);
    let selectedEntityPatternTertiary = $(`#${contentId} .plot-entity-pattern-tertiary-select option:selected`);
    let selectedEntityPatternQuarternary = $(`#${contentId} .plot-entity-pattern-quarternary-select option:selected`);

    let factorSort = selectedFactorSort.attr('data-factor');
    let order = selectedOrderCapUnit.attr('data-order');
    let entityPrimary = selectedEntityPatternPrimary.attr('data-entity-primary');
    let entitySecondary = selectedEntityPatternSecondary.attr('data-entity-secondary');
    let entityTertiary = selectedEntityPatternTertiary.attr('data-entity-tertiary');
    let entityQuarternary = selectedEntityPatternQuarternary.attr('data-entity-quarternary');

    $('#content-composition-trade-country-factor .label-selected-order').text(selectedOrderCapUnit.val());
    $('#content-composition-trade-country-factor .label-selected-entity-secondary').text(entitySecondary);
    $('#content-composition-trade-country-factor .label-selected-entity-tertiary').text(entityTertiary);
    $('#content-composition-trade-country-factor .label-selected-entity-quarternary').text(entityQuarternary);

    return {
      entities: {
        primary: entityPrimary,
        secondary: entitySecondary,
        tertiary: entityTertiary,
        quarternary: entityQuarternary
      },
      factorSort: factorSort,
      order: order
    };
  }

  $('#content-composition-trade-country-factor .custom-select').on('change', function (e) {
    if (tradeCountryFactorsCompositionAnalysisTable != null) {
      tradeCountryFactorsCompositionAnalysisTable.clear();
      tradeCountryFactorsCompositionAnalysisTable.columns.adjust().draw();
    }
  });


  // Tabs Manager

  function revokeAnalyticsTabLoaders(isLoaded) {
    isReloadAnalyticsGeneral = isLoaded;
    isReloadAnalyticsImporter = isLoaded;
    isReloadAnalyticsExporter = isLoaded;
    isReloadAnalyticsHsCode = isLoaded;
    isReloadAnalyticsPort = isLoaded;
    isReloadAnalyticsCountry = isLoaded;
  }

  function applyDTColumnFieldSortModifiers(fieldPane, filter) {
    $(fieldPane).find(`th`).removeClass('text-danger text-success');
    $(fieldPane).find(`th`).each(function (index) {
      $(this).html($(this).attr('value'));
    });

    let currentHeader = $(fieldPane).find(`th[data-factor="${filter.factorSort}"]`);
    currentHeader.addClass(`${filter.order == RESULT_ORDER_TYPE_TOP ? 'text-success':'text-danger'}`);
    let headerContent = `${currentHeader.attr('value')}<i class='fas ${filter.order == RESULT_ORDER_TYPE_TOP ? 'fa-sort-amount-down':'fa-sort-amount-up'} ml-1'></i>`;
    currentHeader.html(headerContent);
  }

  $(".analytics-tab li").on('click', function (e) {
    const framework = $(this).attr("data-analysis-framework");
    if (framework == ANALYTICS_FRAMEWORK_TYPE_SHIPMENT) {
      searchPanelActionSearchButton.prop('disabled', false);
      filterPanelGlobalActionApplyButton.prop('disabled', false);
    } else {
      searchPanelActionSearchButton.prop('disabled', true);
      filterPanelGlobalActionApplyButton.prop('disabled', true);
    }

    switch (framework) {
      case ANALYTICS_FRAMEWORK_TYPE_SHIPMENT: {
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_GENERAL: {
        if (isReloadAnalyticsGeneral) {
          invokeChronologicalTradeFactorsCorrelationAnalytics();
          invokeChronologicalTradeEntityByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeChronologicalTradeEntityByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeChronologicalTradeEntityByQuantityComparisonAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeChronologicalTradeEntityByPriceComparisonAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeChronologicalTradeEntityByAverageUnitPriceComparisonAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_AVERAGE_UNIT_PRICE, "TOP", 3);
          isReloadAnalyticsGeneral = false;
        }
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_IMPORTER: {
        if (isReloadAnalyticsImporter) {
          invokeTradeImporterByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_IMPORTER, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeTradeImporterByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_IMPORTER, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeImporterFactorsCorrelationAnalytics(TRADE_FACTOR_TYPE_QUANTITY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeImporterFactorsContributionAnalytics();
          invokeTradeImporterFactorsPeriodisationAnalytics();
          //invokeTradeExporterFactorsCompositionAnalytics();
          isReloadAnalyticsImporter = false;
        }
        $("#composition-trade-exporter-factor-tree-container").html("");
        $("#composition-trade-hscode-factor-tree-container").html("");
        $("#composition-trade-port-factor-tree-container").html("");
        $("#composition-trade-country-factor-tree-container").html("");
        invokeTradeImporterFactorsCompositionAnalytics();
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_EXPORTER: {
        if (isReloadAnalyticsExporter) {
          invokeTradeExporterByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_EXPORTER, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeTradeExporterByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_EXPORTER, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeExporterFactorsCorrelationAnalytics(TRADE_FACTOR_TYPE_QUANTITY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeExporterFactorsContributionAnalytics();
          invokeTradeExporterFactorsPeriodisationAnalytics();
          isReloadAnalyticsExporter = false;
        }
        $("#composition-trade-importer-factor-tree-container").html("");
        $("#composition-trade-hscode-factor-tree-container").html("");
        $("#composition-trade-port-factor-tree-container").html("");
        $("#composition-trade-country-factor-tree-container").html("");
        invokeTradeExporterFactorsCompositionAnalytics();
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_HS_CODE: {
        if (isReloadAnalyticsHsCode) {
          invokeTradeHsCodeByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_HSCODE, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeTradeHsCodeByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_HSCODE, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeHsCodeFactorsCorrelationAnalytics(TRADE_FACTOR_TYPE_QUANTITY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeHsCodeFactorsContributionAnalytics();
          invokeTradeHsCodeFactorsPeriodisationAnalytics();
          isReloadAnalyticsHsCode = false;
        }
        $("#composition-trade-importer-factor-tree-container").html("");
        $("#composition-trade-exporter-factor-tree-container").html("");
        $("#composition-trade-port-factor-tree-container").html("");
        $("#composition-trade-country-factor-tree-container").html("");
        invokeTradeHsCodeFactorsCompositionAnalytics();
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_PORT: {
        if (isReloadAnalyticsPort) {
          invokeTradePortByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_PORT, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeTradePortByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_PORT, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradePortFactorsCorrelationAnalytics(TRADE_FACTOR_TYPE_QUANTITY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradePortFactorsContributionAnalytics();
          invokeTradePortFactorsPeriodisationAnalytics();
          isReloadAnalyticsPort = false;
        }
        $("#composition-trade-importer-factor-tree-container").html("");
        $("#composition-trade-exporter-factor-tree-container").html("");
        $("#composition-trade-hscode-factor-tree-container").html("");
        $("#composition-trade-country-factor-tree-container").html("");
        invokeTradePortFactorsCompositionAnalytics();
        break;
      }
      case ANALYTICS_FRAMEWORK_TYPE_COUNTRY: {
        if (isReloadAnalyticsCountry) {
          invokeTradeCountryByQuantityDistributionAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_QUANTITY, "TOP", 3);
          invokeTradeCountryByPriceDistributionAnalytics(TRADE_ENTITY_TYPE_COUNTRY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeCountryFactorsCorrelationAnalytics(TRADE_FACTOR_TYPE_QUANTITY, TRADE_FACTOR_TYPE_PRICE, "TOP", 3);
          invokeTradeCountryFactorsContributionAnalytics();
          invokeTradeCountryFactorsPeriodisationAnalytics();
          isReloadAnalyticsCountry = false;
        }
        $("#composition-trade-importer-factor-tree-container").html("");
        $("#composition-trade-exporter-factor-tree-container").html("");
        $("#composition-trade-hscode-factor-tree-container").html("");
        $("#composition-trade-port-factor-tree-container").html("");
        invokeTradeCountryFactorsCompositionAnalytics();
        break;
      }
      default: {
        break;
      }
    }
  });

  /* Analytics Component */


  /* Analytics Initializers */


  function invokeChronologicalTradeFactorsCorrelationAnalytics() {
    $("#container-correlation-trade-factor .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeFactorsCorrelationAnalyticsPayload();
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeChronologicalTradeEntityByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-entity-quantity .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeEntitiesFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeChronologicalTradeEntityByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-entity-price .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeEntitiesFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeChronologicalTradeEntityByQuantityComparisonAnalytics(entity, factor, order, cap) {
    $("#container-comparison-entity-quantity .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeEntitiesFactorsComparisonAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeEntitiesFactorsComparisonAPIHandler(analyticsAggregation);
  }

  function invokeChronologicalTradeEntityByPriceComparisonAnalytics(entity, factor, order, cap) {
    $("#container-comparison-entity-price .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeEntitiesFactorsComparisonAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeEntitiesFactorsComparisonAPIHandler(analyticsAggregation);
  }

  function invokeChronologicalTradeEntityByAverageUnitPriceComparisonAnalytics(entity, factor, order, cap) {
    $("#container-comparison-entity-average-unit-price .card-disabled").show();
    let analyticsAggregation = formulateChronologicalTradeEntitiesFactorsComparisonAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchChronologicalTradeEntitiesFactorsComparisonAPIHandler(analyticsAggregation);
  }




  function invokeTradeImporterByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-importer-quantity .card-disabled").show();
    let analyticsAggregation = formulateTradeImporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeImporterByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-importer-price .card-disabled").show();
    let analyticsAggregation = formulateTradeImporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeImporterFactorsCorrelationAnalytics(factorFirst, factorSecond, order, cap) {
    $("#container-correlation-trade-importer-factor .card-disabled").show();
    let analyticsAggregation = formulateTradeImporterFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeTradeImporterFactorsContributionAnalytics() {

    if (tradeImporterFactorsContributionAnalysisTable != null) {
      tradeImporterFactorsContributionAnalysisTable.clear();
      tradeImporterFactorsContributionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-contribution-trade-importer-factor .card-disabled").show();

      let tableFields = [{
          name: "Importer",
          data: "entity",
          identifier: "ENTITY"
        },
        {
          name: "Price",
          data: "price",
          identifier: "PRICE"
        },
        {
          name: "Unit Price",
          data: "unitPrice",
          identifier: "UNIT_PRICE"
        },
        {
          name: "Average Unit Price",
          data: "averageUnitPrice",
          identifier: "AVERAGE_UNIT_PRICE"
        },
        {
          name: "Quantity",
          data: "quantity",
          identifier: "QUANTITY"
        },
        {
          name: "Shipment",
          data: "shipment",
          identifier: "SHIPMENT"
        },
        {
          name: "Duty",
          data: "duty",
          identifier: "DUTY"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-factor="${field.identifier.toUpperCase().trim()}">${field.name.toUpperCase().trim()}</th>`;
        $(`#contribution-trade-importer-factor-table > thead > tr`).append(th);
        $(`#contribution-trade-importer-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.toUpperCase().trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeImporterFactorsContributionAnalysisTable = $(`#contribution-trade-importer-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeImporterFactorsContributionAnalyticsFilterOptions();
            let paramsObj = formulateTradeImporterFactorsContributionAnalyticsPayload(filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#contribution-trade-importer-factor-chart").show();
            $("#container-contribution-trade-importer-factor .card-disabled").hide();
            return json.data;
          }
        },
        columnDefs: [{
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 1
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 2
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"> N/A </div></div>`;
              return plotBox;
            },
            targets: 3
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 4
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 5
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 6
          }
        ],
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
        headerCallback: function (thead, data, start, end, display) {
          const filter = assessTradeImporterFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(thead, filter);
        },
        footerCallback: function (tfoot, data, start, end, display) {
          const filter = assessTradeImporterFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(tfoot, filter);
        },
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeImporterFactorsContributionAnalysisTable != null) {
            $("#contribution-trade-importer-factor-chart #contribution-trade-importer-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#contribution-trade-importer-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeImporterFactorsPeriodisationAnalytics() {

    if (tradeImporterFactorsPeriodisationAnalysisTable != null) {
      tradeImporterFactorsPeriodisationAnalysisTable.clear();
      tradeImporterFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-periodisation-trade-importer-factor .card-disabled").show();

      let tableFields = [{
          name: "IMPORTER",
          data: "entity",
          year: "",
          month: ""
        }, {
          name: "JAN-2019",
          data: "1-2019",
          year: "2019",
          month: "1"
        },
        {
          name: "FEB-2019",
          data: "2-2019",
          year: "2019",
          month: "2"
        },
        {
          name: "MAR-2019",
          data: "3-2019",
          year: "2019",
          month: "3"
        },
        {
          name: "APR-2019",
          data: "4-2019",
          year: "2019",
          month: "4"
        },
        {
          name: "MAY-2019",
          data: "5-2019",
          year: "2019",
          month: "5"
        },
        {
          name: "JUN-2019",
          data: "6-2019",
          year: "2019",
          month: "6"
        },
        {
          name: "JUL-2019",
          data: "7-2019",
          year: "2019",
          month: "7"
        },
        {
          name: "AUG-2019",
          data: "8-2019",
          year: "2019",
          month: "8"
        },
        {
          name: "SEP-2019",
          data: "9-2019",
          year: "2019",
          month: "9"
        },
        {
          name: "OCT-2019",
          data: "10-2019",
          year: "2019",
          month: "10"
        },
        {
          name: "NOV-2019",
          data: "11-2019",
          year: "2019",
          month: "11"
        },
        {
          name: "DEC-2019",
          data: "12-2019",
          year: "2019",
          month: "12"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-year="${field.year.trim()}" data-month="${field.year.trim()}">${field.name.trim()}</th>`;
        $(`#periodisation-trade-importer-factor-table > thead > tr`).append(th);
        $(`#periodisation-trade-importer-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeImporterFactorsPeriodisationAnalysisTable = $(`#periodisation-trade-importer-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeImporterFactorsPeriodisationAnalyticsFilterOptions();
            let paramsObj = formulateTradeImporterFactorsPeriodisationAnalyticsPayload(filterOptions.factorPlot, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#periodisation-trade-importer-factor-chart").show();
            $("#container-periodisation-trade-importer-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeImporterFactorsPeriodisationAnalysisTable != null) {
            $("#periodisation-trade-importer-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#periodisation-trade-importer-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeImporterFactorsCompositionAnalytics() {

    let collapsibleEl = $('#container-composition-trade-importer-factor .collapsible'); //collapsible element
    let buttonEl = $("#container-composition-trade-importer-factor .collapsible button "); //button inside element

    if (tradeImporterFactorsCompositionAnalysisTable != null) {
      tradeImporterFactorsCompositionAnalysisTable.clear();
      tradeImporterFactorsCompositionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-composition-trade-importer-factor .card-disabled").show();
      $("#composition-trade-importer-factor-table").css("cursor", "pointer");

      let tableFields = [{
        name: "IMPORTER",
        data: "entity"
      }];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}">${field.name.trim()}</th>`;
        $(`#composition-trade-importer-factor-table > thead > tr`).append(th);
        $(`#composition-trade-importer-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeImporterFactorsCompositionAnalysisTable = $(`#composition-trade-importer-factor-table`).DataTable({
        //deferLoading: -1,
        //dom: 't<"row"<"col-md-10 offset-1"<p>>>',
        lengthChange: false,
        info: false,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeImporterFactorsCompositionAnalyticsFilterOptions();
            let paramsObj = formulateTradeImporterFactorsCompositionAnalyticsPayload(filterOptions.entities, filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#composition-trade-importer-factor-chart").show();
            $("#container-composition-trade-importer-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeImporterFactorsCompositionAnalysisTable != null) {
            $("#composition-trade-importer-factor-table").show();
            //console.log(tradeImporterFactorsCompositionAnalysisTable.page.info());
            let currentPageStartPosition = tradeImporterFactorsCompositionAnalysisTable.page.info().start;
            let rData = tradeImporterFactorsCompositionAnalysisTable.row(0).data();
            //console.log(rData);
            $("#composition-trade-importer-factor-tree-container").html("");
            let jsonData = {
              "tree": JSON.parse(JSON.stringify(rData))
            };
            //buildImporterCompositionHierarchyTree('', jsonData.tree, "composition-trade-importer-factor-tree-container");
            buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-importer-factor-tree-container");

            buttonEl.css('left', collapsibleEl.innerWidth());
            buttonEl.css('top', collapsibleEl.innerHeight() / 2 - 20);
            buttonEl.show();
          }
        }
      });

      $(buttonEl).click(function () {
        hideWidth = $(this).parent().innerWidth();
        let curwidth = $(this).parent().offset(); //get offset value of the parent element
        if (curwidth.left > 0) //compare margin-left value
        {
          //animate margin-left value to -490px
          $(this).parent().animate({
            marginLeft: -hideWidth
          }, 300);
          $(this).html('<i class="far fa-hand-point-right"></i>');
        } else {
          //animate margin-left value 0px
          $(this).parent().animate({
            marginLeft: "0"
          }, 300);
          $(this).html('<i class="far fa-hand-point-left"></i>');
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#composition-trade-importer-factor-table').wrap('<div class="dataTables_scroll" />');

      $('#composition-trade-importer-factor-table tbody').on('click', 'td', function () {
        var tr = $(this).closest('tr');
        var row = tradeImporterFactorsCompositionAnalysisTable.row(tr);
        let rData = row.data();
        $("#composition-trade-importer-factor-tree-container").html("");
        let jsonData = {
          "tree": JSON.parse(JSON.stringify(rData))
        };
        //buildImporterCompositionHierarchyTree('', jsonData.tree, "composition-trade-importer-factor-tree-container");
        buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-importer-factor-tree-container");
      });

    }

  }


  function invokeTradeExporterByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-exporter-quantity .card-disabled").show();
    let analyticsAggregation = formulateTradeExporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeExporterByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-exporter-price .card-disabled").show();
    let analyticsAggregation = formulateTradeExporterFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeExporterFactorsCorrelationAnalytics(factorFirst, factorSecond, order, cap) {
    $("#container-correlation-trade-exporter-factor .card-disabled").show();
    let analyticsAggregation = formulateTradeExporterFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeTradeExporterFactorsContributionAnalytics() {

    if (tradeExporterFactorsContributionAnalysisTable != null) {
      tradeExporterFactorsContributionAnalysisTable.clear();
      tradeExporterFactorsContributionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-contribution-trade-exporter-factor .card-disabled").show();

      let tableFieldsA = [{
          name: "Importer",
          data: "entity"
        },
        {
          name: "Price",
          data: "totalPrice"
        },
        {
          name: "Price %",
          data: "totalPriceDifferential"
        },
        {
          name: "Unit Price",
          data: "totalUnitPrice"
        },
        {
          name: "Unit Price %",
          data: "totalUnitPriceDifferential"
        },
        {
          name: "Avg Unit Price",
          data: "averageUnitPrice"
        },
        {
          name: "Avg Unit Price %",
          data: "averageUnitPriceDifferential"
        },
        {
          name: "Quantity",
          data: "totalQuantity"
        },
        {
          name: "Quantity %",
          data: "totalQuantityDifferential"
        },
        {
          name: "Shipment",
          data: "totalShipment"
        },
        {
          name: "Shipment %",
          data: "totalShipmentDifferential"
        },
        {
          name: "Duty",
          data: "totalDuty"
        },
        {
          name: "Duty %",
          data: "totalDutyDifferential"
        }
      ];

      let tableFields = [{
          name: "Exporter",
          data: "entity",
          identifier: "ENTITY"
        },
        {
          name: "Price",
          data: "price",
          identifier: "PRICE"
        },
        {
          name: "Unit Price",
          data: "unitPrice",
          identifier: "UNIT_PRICE"
        },
        {
          name: "Average Unit Price",
          data: "averageUnitPrice",
          identifier: "AVERAGE_UNIT_PRICE"
        },
        {
          name: "Quantity",
          data: "quantity",
          identifier: "QUANTITY"
        },
        {
          name: "Shipment",
          data: "shipment",
          identifier: "SHIPMENT"
        },
        {
          name: "Duty",
          data: "duty",
          identifier: "DUTY"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-factor="${field.identifier.toUpperCase().trim()}">${field.name.toUpperCase().trim()}</th>`;
        $(`#contribution-trade-exporter-factor-table > thead > tr`).append(th);
        $(`#contribution-trade-exporter-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.toUpperCase().trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeExporterFactorsContributionAnalysisTable = $(`#contribution-trade-exporter-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeExporterFactorsContributionAnalyticsFilterOptions();
            let paramsObj = formulateTradeExporterFactorsContributionAnalyticsPayload(filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#contribution-trade-exporter-factor-chart").show();
            $("#container-contribution-trade-exporter-factor .card-disabled").hide();
            return json.data;
          }
        },
        columnDefs: [{
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 1
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 2
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"> N/A </div></div>`;
              return plotBox;
            },
            targets: 3
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 4
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 5
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 6
          }
        ],
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
        headerCallback: function (thead, data, start, end, display) {
          const filter = assessTradeExporterFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(thead, filter);
        },
        footerCallback: function (tfoot, data, start, end, display) {
          const filter = assessTradeExporterFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(tfoot, filter);
        },
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeExporterFactorsContributionAnalysisTable != null) {
            $("#contribution-trade-exporter-factor-chart #contribution-trade-exporter-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#contribution-trade-exporter-factor-table').wrap('<div class="dataTables_scroll" />');

    }
  }

  function invokeTradeExporterFactorsPeriodisationAnalytics() {

    if (tradeExporterFactorsPeriodisationAnalysisTable != null) {
      tradeExporterFactorsPeriodisationAnalysisTable.clear();
      tradeExporterFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-periodisation-trade-exporter-factor .card-disabled").show();

      let tableFields = [{
          name: "EXPORTER",
          data: "entity",
          year: "",
          month: ""
        }, {
          name: "JAN-2019",
          data: "1-2019",
          year: "2019",
          month: "1"
        },
        {
          name: "FEB-2019",
          data: "2-2019",
          year: "2019",
          month: "2"
        },
        {
          name: "MAR-2019",
          data: "3-2019",
          year: "2019",
          month: "3"
        },
        {
          name: "APR-2019",
          data: "4-2019",
          year: "2019",
          month: "4"
        },
        {
          name: "MAY-2019",
          data: "5-2019",
          year: "2019",
          month: "5"
        },
        {
          name: "JUN-2019",
          data: "6-2019",
          year: "2019",
          month: "6"
        },
        {
          name: "JUL-2019",
          data: "7-2019",
          year: "2019",
          month: "7"
        },
        {
          name: "AUG-2019",
          data: "8-2019",
          year: "2019",
          month: "8"
        },
        {
          name: "SEP-2019",
          data: "9-2019",
          year: "2019",
          month: "9"
        },
        {
          name: "OCT-2019",
          data: "10-2019",
          year: "2019",
          month: "10"
        },
        {
          name: "NOV-2019",
          data: "11-2019",
          year: "2019",
          month: "11"
        },
        {
          name: "DEC-2019",
          data: "12-2019",
          year: "2019",
          month: "12"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-year="${field.year.trim()}" data-month="${field.year.trim()}">${field.name.trim()}</th>`;
        $(`#periodisation-trade-exporter-factor-table > thead > tr`).append(th);
        $(`#periodisation-trade-exporter-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeExporterFactorsPeriodisationAnalysisTable = $(`#periodisation-trade-exporter-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeExporterFactorsPeriodisationAnalyticsFilterOptions();
            let paramsObj = formulateTradeExporterFactorsPeriodisationAnalyticsPayload(filterOptions.factorPlot, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#periodisation-trade-exporter-factor-chart").show();
            $("#container-periodisation-trade-exporter-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeExporterFactorsPeriodisationAnalysisTable != null) {
            $("#periodisation-trade-exporter-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#periodisation-trade-exporter-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeExporterFactorsCompositionAnalytics() {

    let collapsibleEl = $('#container-composition-trade-exporter-factor .collapsible'); //collapsible element
    let buttonEl = $("#container-composition-trade-exporter-factor .collapsible button "); //button inside element

    if (tradeExporterFactorsCompositionAnalysisTable != null) {
      tradeExporterFactorsCompositionAnalysisTable.clear();
      tradeExporterFactorsCompositionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-composition-trade-exporter-factor .card-disabled").show();
      $("#composition-trade-exporter-factor-table").css("cursor", "pointer");

      let tableFields = [{
        name: "EXPORTER",
        data: "entity"
      }];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}">${field.name.trim()}</th>`;
        $(`#composition-trade-exporter-factor-table > thead > tr`).append(th);
        $(`#composition-trade-exporter-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeExporterFactorsCompositionAnalysisTable = $(`#composition-trade-exporter-factor-table`).DataTable({
        //deferLoading: -1,
        //dom: 't<"row"<"col-md-10 offset-1"<p>>>',
        lengthChange: false,
        info: false,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeExporterFactorsCompositionAnalyticsFilterOptions();
            let paramsObj = formulateTradeExporterFactorsCompositionAnalyticsPayload(filterOptions.entities, filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#composition-trade-exporter-factor-chart").show();
            $("#container-composition-trade-exporter-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeExporterFactorsCompositionAnalysisTable != null) {
            $("#composition-trade-exporter-factor-table").show();
            //console.log(tradeExporterFactorsCompositionAnalysisTable.page.info());
            let currentPageStartPosition = tradeExporterFactorsCompositionAnalysisTable.page.info().start;
            let rData = tradeExporterFactorsCompositionAnalysisTable.row(0).data();
            //console.log(rData);
            $("#composition-trade-exporter-factor-tree-container").html("");
            let jsonData = {
              "tree": JSON.parse(JSON.stringify(rData))
            };
            //buildExporterCompositionHierarchyTree('', jsonData.tree, "composition-trade-exporter-factor-tree-container");
            buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-exporter-factor-tree-container");

            buttonEl.css('left', collapsibleEl.innerWidth());
            buttonEl.css('top', collapsibleEl.innerHeight() / 2 - 20);
            buttonEl.show();
          }
        }
      });

      $(buttonEl).click(function () {
        hideWidth = $(this).parent().innerWidth();
        let curwidth = $(this).parent().offset(); //get offset value of the parent element
        if (curwidth.left > 0) //compare margin-left value
        {
          //animate margin-left value to -490px
          $(this).parent().animate({
            marginLeft: -hideWidth
          }, 300);
          $(this).html('<i class="far fa-hand-point-right"></i>');
        } else {
          //animate margin-left value 0px
          $(this).parent().animate({
            marginLeft: "0"
          }, 300);
          $(this).html('<i class="far fa-hand-point-left"></i>');
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#composition-trade-exporter-factor-table').wrap('<div class="dataTables_scroll" />');

      $('#composition-trade-exporter-factor-table tbody').on('click', 'td', function () {
        var tr = $(this).closest('tr');
        var row = tradeExporterFactorsCompositionAnalysisTable.row(tr);
        let rData = row.data();
        $("#composition-trade-exporter-factor-tree-container").html("");
        let jsonData = {
          "tree": JSON.parse(JSON.stringify(rData))
        };
        //buildExporterCompositionHierarchyTree('', jsonData.tree, "composition-trade-exporter-factor-tree-container");
        buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-exporter-factor-tree-container");
      });

    }

  }


  function invokeTradeHsCodeByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-hscode-quantity .card-disabled").show();
    let analyticsAggregation = formulateTradeHsCodeFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeHsCodeByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-hscode-price .card-disabled").show();
    let analyticsAggregation = formulateTradeHsCodeFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeHsCodeFactorsCorrelationAnalytics(factorFirst, factorSecond, order, cap) {
    $("#container-correlation-trade-hscode-factor .card-disabled").show();
    let analyticsAggregation = formulateTradeHsCodeFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeTradeHsCodeFactorsContributionAnalytics() {

    if (tradeHsCodeFactorsContributionAnalysisTable != null) {
      tradeHsCodeFactorsContributionAnalysisTable.clear();
      tradeHsCodeFactorsContributionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-contribution-trade-hscode-factor .card-disabled").show();

      let tableFieldsA = [{
          name: "Importer",
          data: "entity"
        },
        {
          name: "Price",
          data: "totalPrice"
        },
        {
          name: "Price %",
          data: "totalPriceDifferential"
        },
        {
          name: "Unit Price",
          data: "totalUnitPrice"
        },
        {
          name: "Unit Price %",
          data: "totalUnitPriceDifferential"
        },
        {
          name: "Avg Unit Price",
          data: "averageUnitPrice"
        },
        {
          name: "Avg Unit Price %",
          data: "averageUnitPriceDifferential"
        },
        {
          name: "Quantity",
          data: "totalQuantity"
        },
        {
          name: "Quantity %",
          data: "totalQuantityDifferential"
        },
        {
          name: "Shipment",
          data: "totalShipment"
        },
        {
          name: "Shipment %",
          data: "totalShipmentDifferential"
        },
        {
          name: "Duty",
          data: "totalDuty"
        },
        {
          name: "Duty %",
          data: "totalDutyDifferential"
        }
      ];

      let tableFields = [{
          name: "HS Code",
          data: "entity",
          identifier: "ENTITY"
        },
        {
          name: "Price",
          data: "price",
          identifier: "PRICE"
        },
        {
          name: "Unit Price",
          data: "unitPrice",
          identifier: "UNIT_PRICE"
        },
        {
          name: "Average Unit Price",
          data: "averageUnitPrice",
          identifier: "AVERAGE_UNIT_PRICE"
        },
        {
          name: "Quantity",
          data: "quantity",
          identifier: "QUANTITY"
        },
        {
          name: "Shipment",
          data: "shipment",
          identifier: "SHIPMENT"
        },
        {
          name: "Duty",
          data: "duty",
          identifier: "DUTY"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-factor="${field.identifier.toUpperCase().trim()}">${field.name.toUpperCase().trim()}</th>`;
        $(`#contribution-trade-hscode-factor-table > thead > tr`).append(th);
        $(`#contribution-trade-hscode-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.toUpperCase().trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeHsCodeFactorsContributionAnalysisTable = $(`#contribution-trade-hscode-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeHsCodeFactorsContributionAnalyticsFilterOptions();
            let paramsObj = formulateTradeHsCodeFactorsContributionAnalyticsPayload(filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#contribution-trade-hscode-factor-chart").show();
            $("#container-contribution-trade-hscode-factor .card-disabled").hide();
            return json.data;
          }
        },
        columnDefs: [{
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 1
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 2
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"> N/A </div></div>`;
              return plotBox;
            },
            targets: 3
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 4
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 5
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 6
          }
        ],
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
        headerCallback: function (thead, data, start, end, display) {
          const filter = assessTradeHsCodeFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(thead, filter);
        },
        footerCallback: function (tfoot, data, start, end, display) {
          const filter = assessTradeHsCodeFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(tfoot, filter);
        },
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeHsCodeFactorsContributionAnalysisTable != null) {
            $("#contribution-trade-hscode-factor-chart #contribution-trade-hscode-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#contribution-trade-hscode-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeHsCodeFactorsPeriodisationAnalytics() {

    if (tradeHsCodeFactorsPeriodisationAnalysisTable != null) {
      tradeHsCodeFactorsPeriodisationAnalysisTable.clear();
      tradeHsCodeFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-periodisation-trade-hscode-factor .card-disabled").show();

      let tableFields = [{
          name: "HS CODE",
          data: "entity",
          year: "",
          month: ""
        }, {
          name: "JAN-2019",
          data: "1-2019",
          year: "2019",
          month: "1"
        },
        {
          name: "FEB-2019",
          data: "2-2019",
          year: "2019",
          month: "2"
        },
        {
          name: "MAR-2019",
          data: "3-2019",
          year: "2019",
          month: "3"
        },
        {
          name: "APR-2019",
          data: "4-2019",
          year: "2019",
          month: "4"
        },
        {
          name: "MAY-2019",
          data: "5-2019",
          year: "2019",
          month: "5"
        },
        {
          name: "JUN-2019",
          data: "6-2019",
          year: "2019",
          month: "6"
        },
        {
          name: "JUL-2019",
          data: "7-2019",
          year: "2019",
          month: "7"
        },
        {
          name: "AUG-2019",
          data: "8-2019",
          year: "2019",
          month: "8"
        },
        {
          name: "SEP-2019",
          data: "9-2019",
          year: "2019",
          month: "9"
        },
        {
          name: "OCT-2019",
          data: "10-2019",
          year: "2019",
          month: "10"
        },
        {
          name: "NOV-2019",
          data: "11-2019",
          year: "2019",
          month: "11"
        },
        {
          name: "DEC-2019",
          data: "12-2019",
          year: "2019",
          month: "12"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-year="${field.year.trim()}" data-month="${field.year.trim()}">${field.name.trim()}</th>`;
        $(`#periodisation-trade-hscode-factor-table > thead > tr`).append(th);
        $(`#periodisation-trade-hscode-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeHsCodeFactorsPeriodisationAnalysisTable = $(`#periodisation-trade-hscode-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeHsCodeFactorsPeriodisationAnalyticsFilterOptions();
            let paramsObj = formulateTradeHsCodeFactorsPeriodisationAnalyticsPayload(filterOptions.factorPlot, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#periodisation-trade-hscode-factor-chart").show();
            $("#container-periodisation-trade-hscode-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeHsCodeFactorsPeriodisationAnalysisTable != null) {
            $("#periodisation-trade-hscode-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#periodisation-trade-hscode-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeHsCodeFactorsCompositionAnalytics() {

    let collapsibleEl = $('#container-composition-trade-hscode-factor .collapsible'); //collapsible element
    let buttonEl = $("#container-composition-trade-hscode-factor .collapsible button "); //button inside element

    if (tradeHsCodeFactorsCompositionAnalysisTable != null) {
      tradeHsCodeFactorsCompositionAnalysisTable.clear();
      tradeHsCodeFactorsCompositionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-composition-trade-hscode-factor .card-disabled").show();
      $("#composition-trade-hscode-factor-table").css("cursor", "pointer");

      let tableFields = [{
        name: "HS CODE",
        data: "entity"
      }];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}">${field.name.trim()}</th>`;
        $(`#composition-trade-hscode-factor-table > thead > tr`).append(th);
        $(`#composition-trade-hscode-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeHsCodeFactorsCompositionAnalysisTable = $(`#composition-trade-hscode-factor-table`).DataTable({
        //deferLoading: -1,
        //dom: 't<"row"<"col-md-10 offset-1"<p>>>',
        lengthChange: false,
        info: false,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeHsCodeFactorsCompositionAnalyticsFilterOptions();
            let paramsObj = formulateTradeHsCodeFactorsCompositionAnalyticsPayload(filterOptions.entities, filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#composition-trade-hscode-factor-chart").show();
            $("#container-composition-trade-hscode-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeHsCodeFactorsCompositionAnalysisTable != null) {
            $("#composition-trade-hscode-factor-table").show();
            //console.log(tradeHsCodeFactorsCompositionAnalysisTable.page.info());
            let currentPageStartPosition = tradeHsCodeFactorsCompositionAnalysisTable.page.info().start;
            let rData = tradeHsCodeFactorsCompositionAnalysisTable.row(0).data();
            //console.log(rData);
            $("#composition-trade-hscode-factor-tree-container").html("");
            let jsonData = {
              "tree": JSON.parse(JSON.stringify(rData))
            };
            buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-hscode-factor-tree-container");

            buttonEl.css('left', collapsibleEl.innerWidth());
            buttonEl.css('top', collapsibleEl.innerHeight() / 2 - 20);
            buttonEl.show();
          }
        }
      });

      $(buttonEl).click(function () {
        hideWidth = $(this).parent().innerWidth();
        let curwidth = $(this).parent().offset(); //get offset value of the parent element
        if (curwidth.left > 0) //compare margin-left value
        {
          //animate margin-left value to -490px
          $(this).parent().animate({
            marginLeft: -hideWidth
          }, 300);
          $(this).html('<i class="far fa-hand-point-right"></i>');
        } else {
          //animate margin-left value 0px
          $(this).parent().animate({
            marginLeft: "0"
          }, 300);
          $(this).html('<i class="far fa-hand-point-left"></i>');
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#composition-trade-hscode-factor-table').wrap('<div class="dataTables_scroll" />');

      $('#composition-trade-hscode-factor-table tbody').on('click', 'td', function () {
        var tr = $(this).closest('tr');
        var row = tradeHsCodeFactorsCompositionAnalysisTable.row(tr);
        let rData = row.data();
        $("#composition-trade-hscode-factor-tree-container").html("");
        let jsonData = {
          "tree": JSON.parse(JSON.stringify(rData))
        };
        buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-hscode-factor-tree-container");
      });

    }

  }


  function invokeTradePortByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-port-quantity .card-disabled").show();
    let analyticsAggregation = formulateTradePortFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradePortByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-port-price .card-disabled").show();
    let analyticsAggregation = formulateTradePortFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradePortFactorsCorrelationAnalytics(factorFirst, factorSecond, order, cap) {
    $("#container-correlation-trade-port-factor .card-disabled").show();
    let analyticsAggregation = formulateTradePortFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeTradePortFactorsContributionAnalytics() {

    if (tradePortFactorsContributionAnalysisTable != null) {
      tradePortFactorsContributionAnalysisTable.clear();
      tradePortFactorsContributionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-contribution-trade-port-factor .card-disabled").show();

      let tableFieldsA = [{
          name: "Importer",
          data: "entity"
        },
        {
          name: "Price",
          data: "totalPrice"
        },
        {
          name: "Price %",
          data: "totalPriceDifferential"
        },
        {
          name: "Unit Price",
          data: "totalUnitPrice"
        },
        {
          name: "Unit Price %",
          data: "totalUnitPriceDifferential"
        },
        {
          name: "Avg Unit Price",
          data: "averageUnitPrice"
        },
        {
          name: "Avg Unit Price %",
          data: "averageUnitPriceDifferential"
        },
        {
          name: "Quantity",
          data: "totalQuantity"
        },
        {
          name: "Quantity %",
          data: "totalQuantityDifferential"
        },
        {
          name: "Shipment",
          data: "totalShipment"
        },
        {
          name: "Shipment %",
          data: "totalShipmentDifferential"
        },
        {
          name: "Duty",
          data: "totalDuty"
        },
        {
          name: "Duty %",
          data: "totalDutyDifferential"
        }
      ];

      let tableFields = [{
          name: "Port",
          data: "entity",
          identifier: "ENTITY"
        },
        {
          name: "Price",
          data: "price",
          identifier: "PRICE"
        },
        {
          name: "Unit Price",
          data: "unitPrice",
          identifier: "UNIT_PRICE"
        },
        {
          name: "Average Unit Price",
          data: "averageUnitPrice",
          identifier: "AVERAGE_UNIT_PRICE"
        },
        {
          name: "Quantity",
          data: "quantity",
          identifier: "QUANTITY"
        },
        {
          name: "Shipment",
          data: "shipment",
          identifier: "SHIPMENT"
        },
        {
          name: "Duty",
          data: "duty",
          identifier: "DUTY"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-factor="${field.identifier.toUpperCase().trim()}">${field.name.toUpperCase().trim()}</th>`;
        $(`#contribution-trade-port-factor-table > thead > tr`).append(th);
        $(`#contribution-trade-port-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.toUpperCase().trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradePortFactorsContributionAnalysisTable = $(`#contribution-trade-port-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradePortFactorsContributionAnalyticsFilterOptions();
            let paramsObj = formulateTradePortFactorsContributionAnalyticsPayload(filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#contribution-trade-port-factor-chart").show();
            $("#container-contribution-trade-port-factor .card-disabled").hide();
            return json.data;
          }
        },
        columnDefs: [{
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 1
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 2
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"> N/A </div></div>`;
              return plotBox;
            },
            targets: 3
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 4
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 5
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 6
          }
        ],
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
        headerCallback: function (thead, data, start, end, display) {
          const filter = assessTradePortFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(thead, filter);
        },
        footerCallback: function (tfoot, data, start, end, display) {
          const filter = assessTradePortFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(tfoot, filter);
        },
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradePortFactorsContributionAnalysisTable != null) {
            $("#contribution-trade-port-factor-chart #contribution-trade-port-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#contribution-trade-port-factor-table').wrap('<div class="dataTables_scroll" />');

    }
  }

  function invokeTradePortFactorsPeriodisationAnalytics() {

    if (tradePortFactorsPeriodisationAnalysisTable != null) {
      tradePortFactorsPeriodisationAnalysisTable.clear();
      tradePortFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-periodisation-trade-port-factor .card-disabled").show();

      let tableFields = [{
          name: "PORT",
          data: "entity",
          year: "",
          month: ""
        }, {
          name: "JAN-2019",
          data: "1-2019",
          year: "2019",
          month: "1"
        },
        {
          name: "FEB-2019",
          data: "2-2019",
          year: "2019",
          month: "2"
        },
        {
          name: "MAR-2019",
          data: "3-2019",
          year: "2019",
          month: "3"
        },
        {
          name: "APR-2019",
          data: "4-2019",
          year: "2019",
          month: "4"
        },
        {
          name: "MAY-2019",
          data: "5-2019",
          year: "2019",
          month: "5"
        },
        {
          name: "JUN-2019",
          data: "6-2019",
          year: "2019",
          month: "6"
        },
        {
          name: "JUL-2019",
          data: "7-2019",
          year: "2019",
          month: "7"
        },
        {
          name: "AUG-2019",
          data: "8-2019",
          year: "2019",
          month: "8"
        },
        {
          name: "SEP-2019",
          data: "9-2019",
          year: "2019",
          month: "9"
        },
        {
          name: "OCT-2019",
          data: "10-2019",
          year: "2019",
          month: "10"
        },
        {
          name: "NOV-2019",
          data: "11-2019",
          year: "2019",
          month: "11"
        },
        {
          name: "DEC-2019",
          data: "12-2019",
          year: "2019",
          month: "12"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-year="${field.year.trim()}" data-month="${field.year.trim()}">${field.name.trim()}</th>`;
        $(`#periodisation-trade-port-factor-table > thead > tr`).append(th);
        $(`#periodisation-trade-port-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradePortFactorsPeriodisationAnalysisTable = $(`#periodisation-trade-port-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradePortFactorsPeriodisationAnalyticsFilterOptions();
            let paramsObj = formulateTradePortFactorsPeriodisationAnalyticsPayload(filterOptions.factorPlot, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#periodisation-trade-port-factor-chart").show();
            $("#container-periodisation-trade-port-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradePortFactorsPeriodisationAnalysisTable != null) {
            $("#periodisation-trade-port-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#periodisation-trade-port-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradePortFactorsCompositionAnalytics() {

    let collapsibleEl = $('#container-composition-trade-port-factor .collapsible'); //collapsible element
    let buttonEl = $("#container-composition-trade-port-factor .collapsible button "); //button inside element

    if (tradePortFactorsCompositionAnalysisTable != null) {
      tradePortFactorsCompositionAnalysisTable.clear();
      tradePortFactorsCompositionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-composition-trade-port-factor .card-disabled").show();
      $("#composition-trade-port-factor-table").css("cursor", "pointer");

      let tableFields = [{
        name: "PORT",
        data: "entity"
      }];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}">${field.name.trim()}</th>`;
        $(`#composition-trade-port-factor-table > thead > tr`).append(th);
        $(`#composition-trade-port-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradePortFactorsCompositionAnalysisTable = $(`#composition-trade-port-factor-table`).DataTable({
        //deferLoading: -1,
        //dom: 't<"row"<"col-md-10 offset-1"<p>>>',
        lengthChange: false,
        info: false,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradePortFactorsCompositionAnalyticsFilterOptions();
            let paramsObj = formulateTradePortFactorsCompositionAnalyticsPayload(filterOptions.entities, filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#composition-trade-port-factor-chart").show();
            $("#container-composition-trade-port-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradePortFactorsCompositionAnalysisTable != null) {
            $("#composition-trade-port-factor-table").show();
            //console.log(tradePortFactorsCompositionAnalysisTable.page.info());
            let currentPageStartPosition = tradePortFactorsCompositionAnalysisTable.page.info().start;
            let rData = tradePortFactorsCompositionAnalysisTable.row(0).data();
            //console.log(rData);
            $("#composition-trade-port-factor-tree-container").html("");
            let jsonData = {
              "tree": JSON.parse(JSON.stringify(rData))
            };
            buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-port-factor-tree-container");

            buttonEl.css('left', collapsibleEl.innerWidth());
            buttonEl.css('top', collapsibleEl.innerHeight() / 2 - 20);
            buttonEl.show();
          }
        }
      });

      $(buttonEl).click(function () {
        hideWidth = $(this).parent().innerWidth();
        let curwidth = $(this).parent().offset(); //get offset value of the parent element
        if (curwidth.left > 0) //compare margin-left value
        {
          //animate margin-left value to -490px
          $(this).parent().animate({
            marginLeft: -hideWidth
          }, 300);
          $(this).html('<i class="far fa-hand-point-right"></i>');
        } else {
          //animate margin-left value 0px
          $(this).parent().animate({
            marginLeft: "0"
          }, 300);
          $(this).html('<i class="far fa-hand-point-left"></i>');
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#composition-trade-port-factor-table').wrap('<div class="dataTables_scroll" />');

      $('#composition-trade-port-factor-table tbody').on('click', 'td', function () {
        var tr = $(this).closest('tr');
        var row = tradePortFactorsCompositionAnalysisTable.row(tr);
        let rData = row.data();
        $("#composition-trade-port-factor-tree-container").html("");
        let jsonData = {
          "tree": JSON.parse(JSON.stringify(rData))
        };
        buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-port-factor-tree-container");
      });

    }

  }


  function invokeTradeCountryByQuantityDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-country-quantity .card-disabled").show();
    let analyticsAggregation = formulateTradeCountryFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeCountryByPriceDistributionAnalytics(entity, factor, order, cap) {
    $("#container-distribution-trade-country-price .card-disabled").show();
    let analyticsAggregation = formulateTradeCountryFactorsDistributionAnalyticsPayload(entity, factor, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation);
  }

  function invokeTradeCountryFactorsCorrelationAnalytics(factorFirst, factorSecond, order, cap) {
    $("#container-correlation-trade-country-factor .card-disabled").show();
    let analyticsAggregation = formulateTradeCountryFactorsCorrelationAnalyticsPayload(factorFirst, factorSecond, order, cap);
    const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
    analyticsAggregation.matchExpressions = filterExpressions.matchExpressions;
    fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation);
  }

  function invokeTradeCountryFactorsContributionAnalytics() {

    if (tradeCountryFactorsContributionAnalysisTable != null) {
      tradeCountryFactorsContributionAnalysisTable.clear();
      tradeCountryFactorsContributionAnalysisTable.columns.adjust().draw();
    } else {



      $("#container-contribution-trade-country-factor .card-disabled").show();

      let tableFieldsA = [{
          name: "Importer",
          data: "entity"
        },
        {
          name: "Price",
          data: "totalPrice"
        },
        {
          name: "Price %",
          data: "totalPriceDifferential"
        },
        {
          name: "Unit Price",
          data: "totalUnitPrice"
        },
        {
          name: "Unit Price %",
          data: "totalUnitPriceDifferential"
        },
        {
          name: "Avg Unit Price",
          data: "averageUnitPrice"
        },
        {
          name: "Avg Unit Price %",
          data: "averageUnitPriceDifferential"
        },
        {
          name: "Quantity",
          data: "totalQuantity"
        },
        {
          name: "Quantity %",
          data: "totalQuantityDifferential"
        },
        {
          name: "Shipment",
          data: "totalShipment"
        },
        {
          name: "Shipment %",
          data: "totalShipmentDifferential"
        },
        {
          name: "Duty",
          data: "totalDuty"
        },
        {
          name: "Duty %",
          data: "totalDutyDifferential"
        }
      ];

      let tableFields = [{
          name: "Country",
          data: "entity",
          identifier: "ENTITY"
        },
        {
          name: "Price",
          data: "price",
          identifier: "PRICE"
        },
        {
          name: "Unit Price",
          data: "unitPrice",
          identifier: "UNIT_PRICE"
        },
        {
          name: "Average Unit Price",
          data: "averageUnitPrice",
          identifier: "AVERAGE_UNIT_PRICE"
        },
        {
          name: "Quantity",
          data: "quantity",
          identifier: "QUANTITY"
        },
        {
          name: "Shipment",
          data: "shipment",
          identifier: "SHIPMENT"
        },
        {
          name: "Duty",
          data: "duty",
          identifier: "DUTY"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-factor="${field.identifier.toUpperCase().trim()}">${field.name.toUpperCase().trim()}</th>`;
        $(`#contribution-trade-country-factor-table > thead > tr`).append(th);
        $(`#contribution-trade-country-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.toUpperCase().trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeCountryFactorsContributionAnalysisTable = $(`#contribution-trade-country-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CONTRIBUTION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeCountryFactorsContributionAnalyticsFilterOptions();
            let paramsObj = formulateTradeCountryFactorsContributionAnalyticsPayload(filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#contribution-trade-country-factor-chart").show();
            $("#container-contribution-trade-country-factor .card-disabled").hide();
            return json.data;
          }
        },
        columnDefs: [{
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 1
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 2
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"> N/A </div></div>`;
              return plotBox;
            },
            targets: 3
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 4
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 5
          },
          {
            render: function (data, type, row) {
              const factor = data;
              let plotBox = `<div><div style="display:block;font-weight:700">${factor.value}</div><div class="text-primary" style="display:block;font-weight: 700;font-size: 85%;"><i class="mdi mdi-equal"></i> ${factor.percentile} <i class="fe-percent"></i></div></div>`;
              return plotBox;
            },
            targets: 6
          }
        ],
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
        headerCallback: function (thead, data, start, end, display) {
          const filter = assessTradeCountryFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(thead, filter);
        },
        footerCallback: function (tfoot, data, start, end, display) {
          const filter = assessTradeCountryFactorsContributionAnalyticsFilterOptions();
          applyDTColumnFieldSortModifiers(tfoot, filter);
        },
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeCountryFactorsContributionAnalysisTable != null) {
            $("#contribution-trade-country-factor-chart #contribution-trade-country-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#contribution-trade-country-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeCountryFactorsPeriodisationAnalytics() {

    if (tradeCountryFactorsPeriodisationAnalysisTable != null) {
      tradeCountryFactorsPeriodisationAnalysisTable.clear();
      tradeCountryFactorsPeriodisationAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-periodisation-trade-country-factor .card-disabled").show();

      let tableFields = [{
          name: "COUNTRY",
          data: "entity",
          year: "",
          month: ""
        }, {
          name: "JAN-2019",
          data: "1-2019",
          year: "2019",
          month: "1"
        },
        {
          name: "FEB-2019",
          data: "2-2019",
          year: "2019",
          month: "2"
        },
        {
          name: "MAR-2019",
          data: "3-2019",
          year: "2019",
          month: "3"
        },
        {
          name: "APR-2019",
          data: "4-2019",
          year: "2019",
          month: "4"
        },
        {
          name: "MAY-2019",
          data: "5-2019",
          year: "2019",
          month: "5"
        },
        {
          name: "JUN-2019",
          data: "6-2019",
          year: "2019",
          month: "6"
        },
        {
          name: "JUL-2019",
          data: "7-2019",
          year: "2019",
          month: "7"
        },
        {
          name: "AUG-2019",
          data: "8-2019",
          year: "2019",
          month: "8"
        },
        {
          name: "SEP-2019",
          data: "9-2019",
          year: "2019",
          month: "9"
        },
        {
          name: "OCT-2019",
          data: "10-2019",
          year: "2019",
          month: "10"
        },
        {
          name: "NOV-2019",
          data: "11-2019",
          year: "2019",
          month: "11"
        },
        {
          name: "DEC-2019",
          data: "12-2019",
          year: "2019",
          month: "12"
        }
      ];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}" data-year="${field.year.trim()}" data-month="${field.year.trim()}">${field.name.trim()}</th>`;
        $(`#periodisation-trade-country-factor-table > thead > tr`).append(th);
        $(`#periodisation-trade-country-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeCountryFactorsPeriodisationAnalysisTable = $(`#periodisation-trade-country-factor-table`).DataTable({
        //deferLoading: -1,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_PERIODISATION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeCountryFactorsPeriodisationAnalyticsFilterOptions();
            let paramsObj = formulateTradeCountryFactorsPeriodisationAnalyticsPayload(filterOptions.factorPlot, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#periodisation-trade-country-factor-chart").show();
            $("#container-periodisation-trade-country-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeCountryFactorsPeriodisationAnalysisTable != null) {
            $("#periodisation-trade-country-factor-table").show();
          }
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#periodisation-trade-country-factor-table').wrap('<div class="dataTables_scroll" />');
    }
  }

  function invokeTradeCountryFactorsCompositionAnalytics() {

    let collapsibleEl = $('#container-composition-trade-country-factor .collapsible'); //collapsible element
    let buttonEl = $("#container-composition-trade-country-factor .collapsible button "); //button inside element

    if (tradeCountryFactorsCompositionAnalysisTable != null) {
      tradeCountryFactorsCompositionAnalysisTable.clear();
      tradeCountryFactorsCompositionAnalysisTable.columns.adjust().draw();
    } else {

      $("#container-composition-trade-country-factor .card-disabled").show();
      $("#composition-trade-country-factor-table").css("cursor", "pointer");

      let tableFields = [{
        name: "COUNTRY",
        data: "entity"
      }];

      let fieldAssigners = [];

      tableFields.forEach(field => {

        let th = `<th value="${field.name.toUpperCase().trim()}">${field.name.trim()}</th>`;
        $(`#composition-trade-country-factor-table > thead > tr`).append(th);
        $(`#composition-trade-country-factor-table > tfoot > tr`).append(th);

        fieldAssigners.push({
          "name": field.name.trim(),
          "data": field.data.trim(),
          "orderable": false,
          "searchable": false,
        });
      });

      tradeCountryFactorsCompositionAnalysisTable = $(`#composition-trade-country-factor-table`).DataTable({
        //deferLoading: -1,
        //dom: 't<"row"<"col-md-10 offset-1"<p>>>',
        lengthChange: false,
        info: false,
        autoWidth: true,
        processing: true,
        serverSide: true,
        searching: false,
        ordering: false,
        //fixedHeader: {
        //  footer: true
        // },
        ajax: {
          url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_COMPOSITION),
          contentType: "application/json",
          type: "POST",
          data: function (d) {
            let filterOptions = assessTradeCountryFactorsCompositionAnalyticsFilterOptions();
            let paramsObj = formulateTradeCountryFactorsCompositionAnalyticsPayload(filterOptions.entities, filterOptions.factorSort, filterOptions.order);
            const filterExpressions = formulateDataShipmentPayload(currentResultTemplate);
            paramsObj.matchExpressions = filterExpressions.matchExpressions;
            paramsObj.draw = d.draw;
            paramsObj.start = d.start;
            paramsObj.length = d.length;
            return JSON.stringify(paramsObj);
          },
          dataSrc: function (json) {
            graceCloseSwal();
            $("#composition-trade-country-factor-chart").show();
            $("#container-composition-trade-country-factor .card-disabled").hide();
            return json.data;
          }
        },
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
        headerCallback: function (thead, data, start, end, display) {},
        footerCallback: function (tfoot, data, start, end, display) {},
        drawCallback: function () {
          $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
          if (tradeCountryFactorsCompositionAnalysisTable != null) {
            $("#composition-trade-country-factor-table").show();
            //console.log(tradeCountryFactorsCompositionAnalysisTable.page.info());
            let currentPageStartPosition = tradeCountryFactorsCompositionAnalysisTable.page.info().start;
            let rData = tradeCountryFactorsCompositionAnalysisTable.row(0).data();
            //console.log(rData);
            $("#composition-trade-country-factor-tree-container").html("");
            let jsonData = {
              "tree": JSON.parse(JSON.stringify(rData))
            };
            buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-country-factor-tree-container");

            buttonEl.css('left', collapsibleEl.innerWidth());
            buttonEl.css('top', collapsibleEl.innerHeight() / 2 - 20);
            buttonEl.show();
          }
        }
      });

      $(buttonEl).click(function () {
        hideWidth = $(this).parent().innerWidth();
        let curwidth = $(this).parent().offset(); //get offset value of the parent element
        if (curwidth.left > 0) //compare margin-left value
        {
          //animate margin-left value to -490px
          $(this).parent().animate({
            marginLeft: -hideWidth
          }, 300);
          $(this).html('<i class="far fa-hand-point-right"></i>');
        } else {
          //animate margin-left value 0px
          $(this).parent().animate({
            marginLeft: "0"
          }, 300);
          $(this).html('<i class="far fa-hand-point-left"></i>');
        }
      });

      /* Overrides Scroll X For Datatables*/
      $('#composition-trade-country-factor-table').wrap('<div class="dataTables_scroll" />');

      $('#composition-trade-country-factor-table tbody').on('click', 'td', function () {
        var tr = $(this).closest('tr');
        var row = tradeCountryFactorsCompositionAnalysisTable.row(tr);
        let rData = row.data();
        $("#composition-trade-country-factor-tree-container").html("");
        let jsonData = {
          "tree": JSON.parse(JSON.stringify(rData))
        };
        buildCompositionHierarchyTree('', jsonData.tree, "composition-trade-country-factor-tree-container");
      });

    }

  }

  /* Analytics Initializers */


  // API CALLS

  function fetchExploreShipmentBuyerSellerPatternSearchAPIHandler(
    workspaceBucket, searchField, searchTerm, aliasType) {
    /*Swal.fire({
      title: "Matching Traders",
      text: "Preparing Data-Points For Exploring Traders",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_BUYER_SELLER_SEARCH, QUERY_PARAMS_INDICATOR,
        'workspaceBucket', QUERY_PARAMS_VALUE_ASSIGNER, workspaceBucket, QUERY_PARAMS_SEPARATOR,
        'searchField', QUERY_PARAMS_VALUE_ASSIGNER, searchField, QUERY_PARAMS_SEPARATOR,
        'searchTerm', QUERY_PARAMS_VALUE_ASSIGNER, searchTerm),
      type: 'GET',
      success: function (payload) {
        graceCloseSwal();
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
        //buildExploreShipmentTraders(payload.data);
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
      url: API_HOST.concat(ENDPOINT_FETCH_WORKSPACE_ANALYTICS_SHIPMENT_STATISTICS),
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

  function fetchWorkspaceAnalyticsSpecificationsAPIHandler(userId, workspaceId, tradeType, countryCode) {
    Swal.fire({
      title: "Retrieving Workspaces",
      text: "Preparing Data-Points For Exploring Shipments",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    let preparedUrl = ENDPOINT_FETCH_USER_WORKSPACE_ANALYTICS_SPECIFICATIONS.replace('{userId}', userId).replace('{workspaceId}', workspaceId);
    $.ajax({
      url: API_HOST.concat(preparedUrl, QUERY_PARAMS_INDICATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, tradeType, QUERY_PARAMS_SEPARATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode),
      type: 'GET',
      success: function (payload) {
        //graceCloseSwal();
        buildWorkspaceAnalyticsSpecifications(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }


  /* >> Analytics API */

  function fetchChronologicalTradeFactorsCorrelationAPIHandler(analyticsAggregation) {
    // Swal.fire({
    //   title: "Retrieving Chronological Trade Factors Comparison",
    //   text: "Preparing Data-Points For Correlation Analytics",
    //   showConfirmButton: false,
    //   allowOutsideClick: false
    // });
    // Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_FACTORS_CORRELATION),
      type: 'POST',
      data: JSON.stringify(analyticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        buildChronologicalTradeFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchChronologicalTradeEntitiesFactorsComparisonAPIHandler(analyticsAggregation) {
    // Swal.fire({
    //   title: "Retrieving Chronological Entities Trade Comparison",
    //   text: "Preparing Data-Points For Comparison Analytics",
    //   showConfirmButton: false,
    //   allowOutsideClick: false
    // });
    // Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_ENTITIES_COMPARISON),
      type: 'POST',
      data: JSON.stringify(analyticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        buildChronologicalTradeEntitiesFactorsComparisonAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchChronologicalTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation) {
    // Swal.fire({
    //   title: "Retrieving Chronological Entities Trade Distribution",
    //   text: "Preparing Data-Points For Distribution Analytics",
    //   showConfirmButton: false,
    //   allowOutsideClick: false
    // });
    // Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_ENTITIES_DISTRIBUTION),
      type: 'POST',
      data: JSON.stringify(analyticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        buildChronologicalTradeEntitiesFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }


  function fetchTradeEntitiesFactorsCorrelationAPIHandler(analyticsAggregation) {
    // Swal.fire({
    //   title: "Retrieving Chronological Trade Factors Comparison",
    //   text: "Preparing Data-Points For Correlation Analytics",
    //   showConfirmButton: false,
    //   allowOutsideClick: false
    // });
    // Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_TRADE_ENTITIES_FACTORS_CORRELATION),
      type: 'POST',
      data: JSON.stringify(analyticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        let domain = analyticsAggregation.specification.domain;
        switch (domain) {
          case TRADE_ENTITY_TYPE_IMPORTER: {
            buildTradeImporterFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_EXPORTER: {
            buildTradeExporterFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_HSCODE: {
            buildTradeHsCodeFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_PORT: {
            buildTradePortFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_COUNTRY: {
            buildTradeCountryFactorsCorrelationAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          default: {
            break;
          }
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }

  function fetchTradeEntitiesFactorsDistributionAPIHandler(analyticsAggregation) {
    // Swal.fire({
    //   title: "Retrieving Chronological Entities Trade Distribution",
    //   text: "Preparing Data-Points For Distribution Analytics",
    //   showConfirmButton: false,
    //   allowOutsideClick: false
    // });
    // Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_ANALYTICS_CHRONOLOGICAL_TRADE_ENTITIES_DISTRIBUTION),
      type: 'POST',
      data: JSON.stringify(analyticsAggregation),
      contentType: "application/json",
      success: function (payload) {
        //graceCloseSwal();
        let domain = analyticsAggregation.specification.entity;
        switch (domain) {
          case TRADE_ENTITY_TYPE_IMPORTER: {
            buildTradeImporterFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_EXPORTER: {
            buildTradeExporterFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_HSCODE: {
            buildTradeHsCodeFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_PORT: {
            buildTradePortFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          case TRADE_ENTITY_TYPE_COUNTRY: {
            buildTradeCountryFactorsDistributionAnalytics(payload.data, analyticsAggregation.chart, analyticsAggregation.specification);
            break;
          }
          default: {
            break;
          }
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      }
    });
  }


  /* << Analytics API */


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


  // Workspace Semantic Templating Section
  function extractWorkspaceSemanticParams() {
    const parsedUrl = new URL(window.location.href);
    currentTradeType = parsedUrl.searchParams.get(QUERY_PARAM_TERM_TRADE_TYPE);
    currentCountryCode = parsedUrl.searchParams.get(QUERY_PARAM_TERM_COUNTRY_CODE);
    currentWorkspaceId = parsedUrl.searchParams.get(QUERY_PARAM_TERM_WORKSPACE_ID);
    currentWorkspaceBucket = parsedUrl.searchParams.get(QUERY_PARAM_TERM_WORKSPACE_BUCKET);
    currentWorkspaceName = parsedUrl.searchParams.get(QUERY_PARAM_TERM_WORKSPACE_NAME);
    $(".label-worksapce-name").text(currentWorkspaceName);
    searchPanelBarSection.hide();
    summaryPanelBarSection.hide();
    filterPanelBarSection.hide();
    resultPanelBarSection.hide();
    recordsPanelBarSection.hide();
    statisticsPanelBarSection.hide();
    Swal.fire({
      title: "Configuring Workspace For Analytics",
      text: "Preparing Data-Points For Analytics",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    fetchWorkspaceAnalyticsSpecificationsAPIHandler(CLIENT_USER_ID, currentWorkspaceId, currentTradeType, currentCountryCode);
  }

  // INIT API CALLS
  extractWorkspaceSemanticParams();

});
