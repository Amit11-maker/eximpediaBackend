const PATH_RESOURCE_SEPARATOR = '/';
const QUERY_PARAMS_INDICATOR = '?';
const QUERY_PARAMS_VALUE_ASSIGNER = '=';
const QUERY_PARAMS_SEPARATOR = '&';
const API_HOST = 'http://localhost:3010'; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_LEDGER_FILES = '/ledger/files/stats';

const DEFAULT_ALL = '';
const TRADE_TYPE_IMPORT = 'IMPORT';
const TRADE_TYPE_EXPORT = 'EXPORT';

$(document).ready(function () {

  var recordsTable = null;

  $('#filterAll').on('click', function (e) {
    fetchLedgerFilesAPIHandler(DEFAULT_ALL, DEFAULT_ALL, DEFAULT_ALL);
  });

  $('#filterImport').on('click', function (e) {
    fetchLedgerFilesAPIHandler(DEFAULT_ALL, TRADE_TYPE_IMPORT, DEFAULT_ALL);
  });

  $('#filterExport').on('click', function (e) {
    fetchLedgerFilesAPIHandler(DEFAULT_ALL, TRADE_TYPE_EXPORT, DEFAULT_ALL);
  });

  $('.right-bar-action-data-column-toggle').on('click', function (e) {
    $('body').toggleClass('right-bar-action-data-column-enabled');
  });

  $('.right-bar-filter-country-toggle').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-country-enabled');
  });

  $('.right-bar-filter-records-toggle').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-records-enabled');
  });

  $('.right-bar-filter-year-toggle').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-year-enabled');
  });

  $('.right-bar-filter-month-toggle').on('click', function (e) {
    $('body').toggleClass('right-bar-filter-month-enabled');
  });

  $(document).on('click', 'body', function (e) {
    if ($(e.target).closest('.right-bar-action-data-column-toggle').length > 0) {
      return;
    }
    if ($(e.target).closest('.right-bar-filter-country-toggle, .right-bar-filter-records-toggle, .right-bar-filter-year-toggle, .right-bar-filter-month-toggle, .right-bar').length > 0) {
      return;
    }
    $('body').removeClass('right-bar-action-data-column-enabled');
    $('body').removeClass('right-bar-filter-year-enabled');
    $('body').removeClass('right-bar-filter-country-enabled');
    $('body').removeClass('right-bar-filter-records-enabled');
    $('body').removeClass('right-bar-filter-month-enabled');
    return;
  });

  function buildLedgerBundle(ledgerBundlePack) {
    if (ledgerBundlePack.data.length === 0) {
      detachSummarization();
      freshenDTList();
      Swal.fire({
        title: "Ledger Empty",
        text: "You have not Imported any files yet! Go to Data-Manager and import files",
        showConfirmButton: false,
        allowOutsideClick: true
      });
    } else {
      if (ledgerBundlePack.data[0].summary.length === 0 || ledgerBundlePack.data[0].ledger_files.length === 0) {
        detachSummarization();
        freshenDTList();
        Swal.fire({
          title: "Ledger Empty",
          text: "You have not Imported any files yet! Go to Data-Manager and import files",
          showConfirmButton: false,
          allowOutsideClick: true
        });
      } else {
        let ledgerBundle = ledgerBundlePack.data[0];
        attachSummarization(ledgerBundle.summary[0]);
        attachDTList(ledgerBundle.ledger_files);
      }
    }
  }

  function attachSummarization(summarization) {
    $('#summarization-bar .label_file .progress-loader').hide();
    $('#summarization-bar .label_file .content').show();
    $('#summarization-bar .label_file .content span').text(summarization.totalFiles);

    $('#summarization-bar .label_country .progress-loader').hide();
    $('#summarization-bar .label_country .content').show();
    $('#summarization-bar .label_country .content span').text(summarization.totalCountries);

    $('#summarization-bar .label_records .progress-loader').hide();
    $('#summarization-bar .label_records .content').show();
    $('#summarization-bar .label_records .content span').text(summarization.totalRecords);

    $('#summarization-bar .label_year .progress-loader').hide();
    $('#summarization-bar .label_year .content').show();
    $('#summarization-bar .label_year .content span').text(summarization.totalYears);

    /*$('#summarization-bar .label_recent_addition .progress-loader').hide();
    $('#summarization-bar .label_recent_addition .content').show();
    $('#summarization-bar .label_recent_addition .content span').text(new Date(summarization.recentRecordsAddition).toDateString());*/
  }

  function detachSummarization(summarization) {
    $('#summarization-bar .label_file .progress-loader').show();
    $('#summarization-bar .label_file .content').hide();
    $('#summarization-bar .label_file .content span').text('');

    $('#summarization-bar .label_country .progress-loader').show();
    $('#summarization-bar .label_country .content').hide();
    $('#summarization-bar .label_country .content span').text('');

    $('#summarization-bar .label_records .progress-loader').show();
    $('#summarization-bar .label_records .content').hide();
    $('#summarization-bar .label_records .content span').text('');

    $('#summarization-bar .label_year .progress-loader').show();
    $('#summarization-bar .label_year .content').hide();
    $('#summarization-bar .label_year .content span').text('');

    /* $('#summarization-bar .label_recent_addition .progress-loader').show();
     $('#summarization-bar .label_recent_addition .content').hide();
     $('#summarization-bar .label_recent_addition .content span').text('');*/
  }

  function intitialiseDTList() {
    recordsTable = $("#records-table").DataTable({
      //data: ledgerFiles,
      columnDefs: [{
          targets: [0],
          visible: false,
        },
        {
          render: function (data, type, row) {
            let checkBox =
              '<button type="button" disabled class="tabledit-edit-button btn btn-info" style="float: none;"><span class="">UnPublish</span></button>';
            return checkBox;
          },
          orderable: false,
          targets: 8
        }
      ],
      columns: [{
          "data": "_id"
        },
        {
          "data": "file"
        },
        {
          "data": "ingested_at"
        },
        {
          "data": "trade"
        },
        {
          "data": "country"
        },
        {
          "data": "year"
        },
        {
          "data": "records"
        },
        {
          "data": "data_bucket"
        },
        {
          "data": "is_published"
        }
      ],
      order: [
        [2, 'desc']
      ],
      scrollX: true,
      language: {
        paginate: {
          previous: "<i class='mdi mdi-chevron-left'>",
          next: "<i class='mdi mdi-chevron-right'>"
        }
      },
      drawCallback: function () {
        $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
      }
    });
  }

  function freshenDTList() {
    recordsTable.clear().draw();
  }

  function attachDTList(ledgerFiles) {
    freshenDTList();
    recordsTable.rows.add(ledgerFiles).draw();

  }

  function fetchLedgerFilesAPIHandler(countryCode, trade, year) {
    Swal.fire({
      title: "Retrieving Ledger Files",
      text: "Preparing Ledger Stats",
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_LEDGER_FILES, QUERY_PARAMS_INDICATOR,
        'countryCode', QUERY_PARAMS_VALUE_ASSIGNER, countryCode, QUERY_PARAMS_SEPARATOR,
        'tradeType', QUERY_PARAMS_VALUE_ASSIGNER, trade, QUERY_PARAMS_SEPARATOR,
        'tradeYear', QUERY_PARAMS_VALUE_ASSIGNER, year),
      type: 'GET',
      success: function (payload) {
        graceCloseSwal();
        buildLedgerBundle(payload);
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

  intitialiseDTList();
  // INIT API CALLS
  fetchLedgerFilesAPIHandler(DEFAULT_ALL, DEFAULT_ALL, DEFAULT_ALL);

});
