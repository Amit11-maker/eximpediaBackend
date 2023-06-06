Dropzone.autoDiscover = false;
Dropzone.options.fileDropZone = {
  url: "  ",
  autoProcessQueue: false,
  autoQueue: false,
  createImageThumbnails: false,
  clickable: true,
  addRemoveLinks: true,
  maxFilesize: 500, // MB
  maxFiles: 3,
  accept: function (file, done) {
    done();
  },
};

const mediaStoreOptions = {
  dataBucketName: "seair-exim-workload-test",
  rootFolder: "raw-data",
  containerFolder: "stage", // 'release', // 'stage',
  bucketRegion: "ap-southeast-1",
  identityPoolId: "ap-southeast-1:c3c32947-9c38-4de5-b79e-4af0ee8eebbb",
};

AWS.config.update({
  region: mediaStoreOptions.bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: mediaStoreOptions.identityPoolId,
  }),
});

const S3Client = new AWS.S3({
  apiVersion: "2006-03-01",
  params: {
    Bucket: mediaStoreOptions.dataBucketName,
  },
});

const PATH_RESOURCE_SEPARATOR = "/";
const QUERY_PARAMS_INDICATOR = "?";
const QUERY_PARAMS_VALUE_ASSIGNER = "=";
const QUERY_PARAMS_SEPARATOR = "&";
const API_HOST = "http://localhost:3010"; //'http://18.138.163.242:3010'; //'http://localhost:3010';
const ENDPOINT_FETCH_TAXONOMY = "/taxonomies";
const ENDPOINT_FETCH_EXPLORE_COUNTRIES = "/explore";
const ENDPOINT_VERIFY_FILES_EXISTENCE = "/ledger/files/verify";
const ENDPOINT_ADD_LEDGER_FILES = "/ledger/files";
const ENDPOINT_UPDATE_FILE_DATA_STAGE = "/ledger/files/:fileId/stage";
const ENDPOINT_INGEST_FILE_DATA = "/ledger/files/:fileId/ingest";
const ENDPOINT_FETCH_FILE_DATA_STAGE = "/ledger/files/stage";

const IMPORT_FILE_FIELD_RECORDS_TAG = "RECORDS_TAG";

const IMPORT_STAGE_REGISTER = "REGISTER";
const IMPORT_STAGE_EXAMINE = "EXAMINE";
const IMPORT_STAGE_UPLOAD = "UPLOAD";
const IMPORT_STAGE_INGEST = "INGEST";
const IMPORT_STAGE_TERMINATE = "TERMINATE";

const IMPORT_STATUS_UNKNOWN = "U";
const IMPORT_STATUS_PENDING = "P";
const IMPORT_STATUS_ONGOING = "O";
const IMPORT_STATUS_FAILED = "F";
const IMPORT_STATUS_COMPLETED = "S";

const IMPORT_INGEST_MODE_MANUAL = 0;
const IMPORT_INGEST_MODE_AUTOMATIC = 1;

const IMPORT_ERROR_MISSING_FIELDS = "MISSING HEADERS";
const IMPORT_ERROR_PARSE_VALIDATIONS = "INCOMPATIBLE DATA FILE";
const IMPORT_ERROR_UPLOAD_UNSUCCESSFUL = "UPLOAD UNSUCCESSFUL";

const statusBlockConfig = [
  {
    status: IMPORT_STATUS_UNKNOWN,
    indicatorVariant: "dark",
    text: "UNKNOWN",
  },
  {
    status: IMPORT_STATUS_PENDING,
    indicatorVariant: "secondary",
    text: "PENDING",
  },
  {
    status: IMPORT_STATUS_ONGOING,
    indicatorVariant: "warning",
    text: "ONGOING",
  },
  {
    status: IMPORT_STATUS_FAILED,
    indicatorVariant: "danger",
    text: "FAILED",
  },
  {
    status: IMPORT_STATUS_COMPLETED,
    indicatorVariant: "success",
    text: "COMPLETED",
  },
];

var taxonomyStandards = [];

var rawFiles = [];
var fileImportQueue = [];

var fileEntries = [
  {
    _id: "5db41ff3f250fc08e8d48a00",
    taxonomy_id: "5dad993d39de8c540071cc87",
    file: "Imp_Jan-18-1.csv",
    data_bucket: "bucket_import_IND_2019",
    country: "India",
    code_iso_3: "IND",
    code_iso_2: "IN",
    trade: "IMPORT",
    records: 1000,
    year: 2018,
    data_stages: {
      examine: {
        rank: 1,
        term: "EXAMINE",
        status: "FAILED",
        errors: [],
        occured_ts: 1572089982038.0,
      },
      upload: {
        rank: 2,
        term: "UPLOAD",
        status: "PENDING",
        errors: [],
        occured_ts: 1572089986909.0,
      },
      ingest: {
        rank: 3,
        term: "INGEST",
        status: "PENDING",
        errors: [],
        occured_ts: 1572090063481.0,
      },
      terminate: {
        rank: 4,
        term: "TERMINATE",
        status: "PENDING",
        errors: [],
        occured_ts: 1572089996191.0,
      },
    },
    is_published: 0,
    is_override: 1,
    created_ts: 1572085747778.0,
    modified_ts: 1572090063481.0,
    records_tag: "ABCDEFGH",
  },
];

var fileImportEntry = {
  fileId: "",
  stage: "",
  status: "",
};

var fileImportManager = [];

var fileDropZone = new Dropzone("div#fileDropZone", fileDropZone);

fileDropZone.on("addedfile", function (file) {
  if (this.files.length >= Dropzone.options.fileDropZone.maxFiles - 1) {
    this.disable();
  }
});

fileDropZone.on("maxfilesexceeded", function (file) {
  this.removeFile(file);
});

fileDropZone.on("removedfile", function (file) {
  //fileDropZone.removeFile(file);
  if (this.files.length < Dropzone.options.fileDropZone.maxFiles) {
    this.enable();
  }
});

fileDropZone.on("error", function (file, errorMessage) {
  var fileDropPreviews = document.getElementsByClassName("dz-error");
  for (var i = 0; i < fileDropPreviews.length; i++) {
    fileDropPreviews[i].classList.remove("dz-error");
  }
});

function accessRawFiles() {
  return fileDropZone.files;
}

function accessAcceptedFiles() {
  return fileDropZone.getAcceptedFiles();
}

function accessAcceptedFilePack() {
  let accessAcceptedFilePackArr = [];
  accessRawFiles().forEach((rawFile) => {
    accessAcceptedFiles().forEach((accessAcceptedFile) => {
      if (rawFile.name === accessAcceptedFile.name)
        accessAcceptedFilePackArr.push(rawFile);
    });
  });
  return accessAcceptedFilePackArr;
}

function accessAcceptedFilePackEntry(rawfileUUID) {
  let accessAcceptedFilePackEntryArr = accessAcceptedFilePack().filter(
    (accessAcceptedFile) => accessAcceptedFile.upload.uuid === rawfileUUID
  );
  return accessAcceptedFilePackEntryArr[0];
}

function accessRejectedFiles() {
  return fileDropZone.getRejectedFiles();
}

function removeFiles() {
  fileDropZone.removeAllFiles(true);
}

$(document).ready(function () {
  function getFileEntry(fileId) {
    return fileEntries.filter((fileEntry) => fileEntry._id === fileId)[0];
  }

  function getFileImportQueueEntry(fileId) {
    return fileImportQueue.filter((fileEntry) => fileEntry._id === fileId)[0];
  }

  function markFileImportStats(fileId, stage, status) {
    for (let i in fileImportManager) {
      if (fileImportManager[i].fileId == fileId) {
        fileImportManager[i].stage = stage;
        fileImportManager[i].status = status;
        break;
      }
    }
  }

  function buildFileImportManager() {
    fileEntries.forEach((fileEntry) => {
      let entry = JSON.parse(JSON.stringify(fileImportEntry));
      entry.fileId = fileEntry._id;
      entry.stage = IMPORT_STAGE_EXAMINE;
      entry.status = IMPORT_STATUS_PENDING;
      fileImportManager.push(entry);
    });
  }

  function prepareImportCountryOptions() {
    let addedOptionsArr = [];
    taxonomyStandards.forEach((taxonomy) => {
      if (!addedOptionsArr.includes(taxonomy.code_iso_3)) {
        let option = `<option value="${taxonomy.code_iso_3}">${taxonomy.country
          .toUpperCase()
          .trim()}</option>`;
        $("#country-select").append(option);
        addedOptionsArr.push(taxonomy.code_iso_3);
      }
    });
  }

  function prepareImportYearOptions() {
    let currentYear = new Date().getFullYear();
    for (let index = 0; index < 25; index++) {
      let optionYear = currentYear - index;
      let option = `<option value="${optionYear}">${optionYear}</option>`;
      $("#year-select").append(option);
    }
  }

  function buildTaxonomyManager(taxonomies) {
    taxonomyStandards = taxonomies;
    prepareImportCountryOptions();
    prepareImportYearOptions();
  }

  function accessTaxonomyStandard(taxonomyId) {
    let taxonomyStandardsArr = taxonomyStandards.filter(
      (taxonomyStandard) => taxonomyStandard._id === taxonomyId
    );
    return taxonomyStandardsArr[0];
  }

  // Upload Section

  function updateUploadStatusBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_status .progress-loader`
      ).hide();
      $(`#fileUploadCard table tbody tr#${fileId} td.label_status .content`)
        .html(
          `
      <span class="badge bg-soft-${stageStatus.indicatorVariant} text-${stageStatus.indicatorVariant} p-1 shadow-none">${stageStatus.text}</span>`
        )
        .show();
    }
  }

  function updateUploadProgressBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      switch (status) {
        case IMPORT_STATUS_PENDING: {
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_progress .progress-loader`
          ).hide();
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_progress .content`
          ).show();
          break;
        }
        case IMPORT_STATUS_FAILED: {
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_progress .progress-loader`
          ).hide();
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_progress .content`
          )
            .html(
              `
             <span class="badge bg-soft-${stageStatus.indicatorVariant} text-${stageStatus.indicatorVariant} p-1 shadow-none">${stageStatus.text}</span>`
            )
            .show();
          break;
        }
        default:
          break;
      }
    }
  }

  function updateUploadProgressCounter(fileId, progressCounter) {
    $(
      `#fileUploadCard table tbody tr#${fileId} td.label_progress .content .progress-counter`
    ).text(`${progressCounter}%`);
    $(
      `#fileUploadCard table tbody tr#${fileId} td.label_progress .content .progress-bar`
    )
      .attr("aria-valuenow", `${progressCounter}`)
      .css("width", `${progressCounter}%`);
  }

  function updateUploadActionBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      switch (status) {
        case IMPORT_STATUS_PENDING: {
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_action .content`
          ).show();
          break;
        }
        case IMPORT_STATUS_FAILED: {
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(`#fileUploadCard table tbody tr#${fileId} td.label_action .content`)
            .html(
              `
              <div class="btn-group btn-group-sm" style="float: none;">
                <button type="button" class="failedFileDiscard tabledit-edit-button btn btn-danger" style="float: none;"><span class="">Discard</span></button>
              </div>`
            )
            .show();
          break;
        }
        case IMPORT_STATUS_COMPLETED: {
          $(
            `#fileUploadCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(`#fileUploadCard table tbody tr#${fileId} td.label_action .content`)
            .html(
              `
          <div class="btn-group btn-group-sm" style="float: none;">
            <button type="button" class="completedFileProcess tabledit-edit-button btn btn-${stageStatus.indicatorVariant}" style="float: none;"><span class="">Ingest</span></button>
          </div>`
            )
            .show();
          break;
        }
        default:
          break;
      }
    }
  }

  function updateUploadSyncProcess(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    if (fileEntry.status === IMPORT_STATUS_COMPLETED) {
      //(fileId, IMPORT_STAGE_UPLOAD, IMPORT_STATUS_COMPLETED);
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Upload Success");
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html('<small class="summary_passed">No Issues Detected</small>');

      updateUploadStatusBlock(fileId, fileEntry.status);
      updateUploadProgressBlock(fileId, fileEntry.status);
      updateUploadActionBlock(fileId, fileEntry.status);
    } else {
      //markFileImportStats(fileId, IMPORT_STAGE_UPLOAD, IMPORT_STATUS_FAILED);

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content`
      ).show();
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Upload Failed");
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html(
        `<a href="javascript: void(0);" class="issueUploadPreview" file-id="${fileId}">
          <small class="text-danger">${fileEntry.errors.length} Issues Detected</small>
        </a>`
      );

      updateUploadStatusBlock(fileId, fileEntry.status);
      updateUploadProgressBlock(fileId, fileEntry.status);
      updateUploadActionBlock(fileId, fileEntry.status);
    }
  }

  function uploadFile(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    let uploadFile = accessAcceptedFilePackEntry(fileEntry.upload_uuid);

    var meta = {
      file_id: fileEntry._id.toString(),
      file_name: fileEntry.file.toString(),
      taxonomy_id: fileEntry.taxonomy_id.toString(),
      trade: fileEntry.trade_type.toString(),
      country: fileEntry.country.toString(),
      code_iso_3: fileEntry.code_iso_3.toString(),
      code_iso_2: fileEntry.code_iso_2.toString(),
      year: fileEntry.trade_year.toString(),
      records: fileEntry.trade_records.toString(),
      type: "csv".toString(),
      modified_ts: Date.now().toString(),
    };

    var params = {
      Key: encodeURIComponent(mediaStoreOptions.rootFolder)
        .concat("/")
        .concat(encodeURIComponent(mediaStoreOptions.containerFolder))
        .concat("/")
        .concat(fileEntry._id),
      Metadata: meta,
      Body: uploadFile,
      //ACL: 'public-read'
    };

    updateUploadStatusBlock(fileId, fileEntry.status);
    updateUploadProgressBlock(fileId, fileEntry.status);

    let evaluateStatus = IMPORT_STATUS_UNKNOWN;
    let errorsArr = [];

    S3Client.upload(params, function (err, data) {
      if (err) {
        let errorBody = {};
        errorBody.type = IMPORT_ERROR_UPLOAD_UNSUCCESSFUL;
        errorBody.code = err.code;
        errorBody.message = err.message;
        errorBody.extras = err;
        errorsArr.push(errorBody);
        let updateUploadDataStage = null;
        for (let i in fileImportQueue) {
          if (
            fileImportQueue[i].stage === IMPORT_STAGE_UPLOAD &&
            fileImportQueue[i].status === IMPORT_STATUS_PENDING
          ) {
            fileImportQueue[i].status = IMPORT_STATUS_FAILED;
            fileImportQueue[i].errors = errorsArr;
            updateUploadDataStage = fileImportQueue[i];
            break;
          }
        }
        updateUploadSyncProcess(fileId, false);
        if (updateUploadDataStage) {
          updateFileDataStageAPIHandler(updateUploadDataStage);
        }
      } else {
        updateUploadProgressCounter(fileId, 100);
        let updateUploadDataStage = null;
        for (let i in fileImportQueue) {
          if (
            fileImportQueue[i].stage === IMPORT_STAGE_UPLOAD &&
            fileImportQueue[i].status === IMPORT_STATUS_PENDING
          ) {
            fileImportQueue[i].status = IMPORT_STATUS_COMPLETED;
            fileImportQueue[i].errors = errorsArr;
            updateUploadDataStage = fileImportQueue[i];
            break;
          }
        }
        updateUploadSyncProcess(fileId, true);
        if (updateUploadDataStage) {
          updateFileDataStageAPIHandler(updateUploadDataStage);
        }
      }
    }).on("httpUploadProgress", function (evt) {
      let uploadMeter = parseInt((evt.loaded * 100) / evt.total);
      updateUploadProgressCounter(fileId, uploadMeter);
    });
  }

  //Validation Section

  function displayFileValidationIssues(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    $("#accordion").empty();
    let errorCounter = 1;
    fileEntry.errors.forEach((error) => {
      let errorItem = `
        <div class="card mb-0">
          <div class="card-header" id="heading${errorCounter}">
            <h5 class="m-0">
              <a href="#collapse${errorCounter}" class="text-dark" data-toggle="collapse" aria-expanded="true" aria-controls="collapse${errorCounter}">
                ${error.type}${error.code}
              </a>
            </h5>
          </div>

          <div id="collapse${errorCounter}" class="collapse show" aria-labelledby="heading${errorCounter}" data-parent="#accordion">
            <div class="card-body">
              ${error.message}${JSON.stringify(error.extras)}
            </div>
          </div>
        </div>`;
      $("#accordion").append(errorItem);
    });
  }

  function updateUploadValidationProcess(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);

    $(`#fileUploadCard table tbody tr#${fileId} td.label_records`).text(
      fileEntry.trade_records
    );

    if (fileEntry.status === IMPORT_STATUS_COMPLETED) {
      //markFileImportStats(fileId, IMPORT_STAGE_EXAMINE, IMPORT_STATUS_COMPLETED);

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content`
      ).show();
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Formats Passed");
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html('<small class="summary_passed">No Issues Detected</small>');

      //markFileImportStats(fileId, IMPORT_STAGE_UPLOAD, IMPORT_STATUS_ONGOING);

      //updateUploadStatusBlock(fileId, fileEntry.status);
      //updateUploadProgressBlock(fileId, fileEntry.status);

      //initiateFileUpload(fileId);
    } else {
      //markFileImportStats(fileId, IMPORT_STAGE_EXAMINE, IMPORT_STATUS_FAILED);

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();

      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content`
      ).show();
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Formats Failed");
      $(
        `#fileUploadCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html(
        `<a href="javascript: void(0);" class="issueValidationPreview" file-id="${fileId}">
          <small class="text-danger">${fileEntry.errors.length} Issues Detected</small>
        </a>`
      );

      updateUploadStatusBlock(fileId, fileEntry.status);
      updateUploadProgressBlock(fileId, fileEntry.status);
      updateUploadActionBlock(fileId, fileEntry.status);
    }
  }

  // Import Upload Entries Section

  function prepareFileUploadEntry(fileEntry) {
    let html = `
      <tr id="${fileEntry._id}">
        <td class="label_file">${fileEntry.file}</td>
        <td class="label_ingest_date">${fileEntry.started_date.toDateString()}</td>
        <td class="label_trade">${fileEntry.trade_type}</td>
        <td class="label_country">${fileEntry.country}</td>
        <td class="label_year">${fileEntry.trade_year}</td>
        <td class="label_records">${fileEntry.trade_records}</td>
        <td class="label_validation">
          <div class="progress-loader spinner-grow text-warning m-2" role="status"></div>
          <div class="content" style="display:none">
          <h5 class="m-0 font-weight-normal title">Pending</h5>
            <p class="mb-0 text-muted summary">
              <small class="">Not Initiated</small>
            </p>
          </div>
        </td>
        <td class="label_status">
          <div class="progress-loader spinner-grow text-warning m-2" role="status"></div>
          <div class="content" style="display:none"><span class="badge bg-soft-info text-info p-1 shadow-none"></span></div>
        </td>
        <td class="label_progress">
          <div class="progress-loader spinner-grow text-warning m-2" role="status"></div>
          <div class="content" style="display:none">
              <h6 class="text-uppercase mt-0">Target <span
                      class="float-right progress-counter"></span></h6>
              <div class="progress progress-sm m-0">
                  <div class="progress-bar bg-info" role="progressbar"
                      aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"
                      style="width: 0%">
                      <span class="sr-only">-</span>
                  </div>
              </div>
          </div>
        </td>
        <td class="label_action">
        <div class="progress-loader spinner-grow text-warning m-2" role="status"></div>
        <div class="content" style="display:none">
          <div class="btn-group btn-group-sm" style="float: none;"><button
                  type="button" disabled
                  class="tabledit-edit-button btn btn-info"
                  style="float: none;"><span class=""></span></button>
          </div>
        </div>
        </td>
      </tr>`;
    return html;
  }

  function addOngoingUploadEntry(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    $("#fileUploadCard table tbody").append(prepareFileUploadEntry(fileEntry));
  }

  // Ingest Section

  function updateIngestStatusBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_status .progress-loader`
      ).hide();
      $(`#fileIngestCard table tbody tr#${fileId} td.label_status .content`)
        .html(
          `
      <span class="badge bg-soft-${stageStatus.indicatorVariant} text-${stageStatus.indicatorVariant} p-1 shadow-none">${stageStatus.text}</span>`
        )
        .show();
    }
  }

  function updateIngestProgressBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      switch (status) {
        case IMPORT_STATUS_ONGOING: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .progress-loader`
          ).hide();
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .content`
          ).show();
          break;
        }
        case IMPORT_STATUS_FAILED: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .progress-loader`
          ).hide();
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .content`
          )
            .html(
              `
             <span class="badge bg-soft-${stageStatus.indicatorVariant} text-${stageStatus.indicatorVariant} p-1 shadow-none">${stageStatus.text}</span>`
            )
            .show();
          break;
        }
        case IMPORT_STATUS_COMPLETED: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .progress-loader`
          ).hide();
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .content`
          ).show();
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_progress .content .progress-bar`
          ).removeClass("progress-bar-animated");
          break;
        }
        default:
          break;
      }
    }
  }

  function updateIngestActionBlock(fileId, status) {
    let stageStatus = null;
    let stageStatusArr = statusBlockConfig.filter(
      (stageConfig) => stageConfig.status === status
    );
    if (stageStatusArr.length > 0) stageStatus = stageStatusArr[0];
    if (stageStatus) {
      switch (status) {
        case IMPORT_STATUS_ONGOING: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_action .content`
          ).show();
          break;
        }
        case IMPORT_STATUS_FAILED: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(`#fileIngestCard table tbody tr#${fileId} td.label_action .content`)
            .html(
              `
              <div class="btn-group btn-group-sm" style="float: none;">
                <button type="button" class="failedFileDiscard tabledit-edit-button btn btn-danger" style="float: none;"><span class="">Discard</span></button>
              </div>`
            )
            .show();
          break;
        }
        case IMPORT_STATUS_COMPLETED: {
          $(
            `#fileIngestCard table tbody tr#${fileId} td.label_action .progress-loader`
          ).hide();
          $(`#fileIngestCard table tbody tr#${fileId} td.label_action .content`)
            .html(
              `
          <div class="btn-group btn-group-sm" style="float: none;">
            <button type="button" disabled class="completedFileProcess tabledit-edit-button btn btn-${stageStatus.indicatorVariant}" style="float: none;"><span class="">Published</span></button>
          </div>`
            )
            .show();
          break;
        }
        default:
          break;
      }
    }
  }

  function updateIngestionProcess(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    if (fileEntry.status === IMPORT_STATUS_COMPLETED) {
      //markFileImportStats(fileId, IMPORT_STAGE_INGEST, IMPORT_STATUS_COMPLETED);

      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();

      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content`
      ).show();
      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Passed");
      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html('<small class="summary_passed">No Issues Detected</small>');

      updateIngestStatusBlock(fileId, fileEntry.status);
      updateIngestProgressBlock(fileId, fileEntry.status);
      updateIngestActionBlock(fileId, fileEntry.status);
    } else {
      //markFileImportStats(fileId, IMPORT_STAGE_EXAMINE, IMPORT_STATUS_FAILED);

      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .progress-loader`
      ).hide();

      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content`
      ).show();
      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content .title`
      ).text("Failed");
      $(
        `#fileIngestCard table tbody tr#${fileId} td.label_validation .content .summary`
      ).html(
        `<a href="javascript: void(0);" class="issueValidationPreview" file-id="${fileId}">
          <small class="text-danger">${fileEntry.errors.length} Issues Detected</small>
        </a>`
      );

      updateIngestStatusBlock(fileId, fileEntry.status);
      updateIngestProgressBlock(fileId, fileEntry.status);
      updateIngestActionBlock(fileId, fileEntry.status);
    }
  }

  function prepareFileIngestEntry(fileEntry) {
    let html = `
      <tr id="${fileEntry._id}">
        <td class="label_file">${fileEntry.file}</td>
        <td class="label_ingest_date">${fileEntry.started_date.toDateString()}</td>
        <td class="label_trade">${fileEntry.trade_type}</td>
        <td class="label_country">${fileEntry.country}</td>
        <td class="label_year">${fileEntry.trade_year}</td>
        <td class="label_records">${fileEntry.trade_records}</td>
        <td class="label_validation">
          <div class="progress-loader spinner-grow text-success m-2" role="status"></div>
          <div class="content" style="display:none">
          <h5 class="m-0 font-weight-normal title">Pending</h5>
            <p class="mb-0 text-muted summary">
              <small class="">Not Initiated</small>
            </p>
          </div>
        </td>
        <td class="label_status">
          <div class="progress-loader spinner-grow text-danger m-2" role="status"></div>
          <div class="content" style="display:none"><span class="badge bg-soft-info text-info p-1 shadow-none"></span></div>
        </td>
        <td class="label_progress">
          <div class="progress-loader spinner-grow text-warning m-2" role="status"></div>
          <div class="content" style="display:none">
              <div class="progress mb-0">
                <div class="progress-bar progress-bar-striped progress-bar-animated"
                    role="progressbar" aria-valuenow="100" aria-valuemin="0"
                    aria-valuemax="100" style="width: 100%"></div>
              </div>
          </div>
        </td>
        <td class="label_action">
        <div class="progress-loader spinner-grow text-info m-2" role="status"></div>
        <div class="content" style="display:none">
          <div class="btn-group btn-group-sm" style="float: none;"><button
                  type="button" disabled
                  class="tabledit-edit-button btn btn-info"
                  style="float: none;"><span class=""></span></button>
          </div>
        </div>
        </td>
      </tr>`;
    return html;
  }

  function addOngoingIngestEntry(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    $("#fileIngestCard table tbody").append(prepareFileIngestEntry(fileEntry));
  }

  function addImportIngestFileBlock(fileId) {
    $(`#fileUploadCard table tbody tr#${fileId}`).remove();
    addOngoingIngestEntry(fileId);
  }

  function ingestFile(ingestMode, fileId) {
    if (ingestMode === IMPORT_INGEST_MODE_MANUAL) {
      let fileEntry = {};
      if (fileId) fileEntry = getFileImportQueueEntry(fileId);
      ingestDataFileAPIHandler(fileEntry);
    } else if (ingestMode === IMPORT_INGEST_MODE_AUTOMATIC) {
      let isFileIngestRemaining = false;
      for (let i in fileImportQueue) {
        //if (fileImportQueue[i]._id === fileId) {
        if (
          fileImportQueue[i].stage === IMPORT_STAGE_INGEST &&
          (fileImportQueue[i].status === IMPORT_STATUS_PENDING ||
            fileImportQueue[i].status === IMPORT_STATUS_ONGOING)
        ) {
          ingestDataFileAPIHandler(fileImportQueue[i]);
          isFileIngestRemaining = true;
          break;
        }
        //}
      }
      if (!isFileIngestRemaining) {
        sendImportCompletion();
      }
    }
  }

  // Verification Section

  function buildFileVerificationProcess() {
    let attachedFiles = accessAcceptedFiles();
    let verifyFileArr = [];
    attachedFiles.forEach((file) => {
      verifyFileArr.push(file.name);
    });
    verifyFilesExistenceAPIHandler(verifyFileArr.toString());
  }

  function updateVerifiedFiles(verifiedFiles) {
    let attachedFiles = accessAcceptedFiles();
    let removedFiles = [];
    attachedFiles.forEach((attachedFile) => {
      verifiedFiles.forEach((verifiedfile) => {
        if (verifiedfile.file === attachedFile.name) {
          if (verifiedfile.exists) {
            removedFiles.push(attachedFile.name);
            fileDropZone.removeFile(attachedFile);
          }
        }
      });
    });

    if (removedFiles.length > 0) {
      Swal.fire({
        title: "Duplicate Files Auto-Remover",
        text: `Files Discarded: ${removedFiles.toString()}`,
        allowOutsideClick: false,
        showConfirmButton: false,
      });
    }

    var intervalID = window.setTimeout(function () {
      Swal.close();
      if (accessAcceptedFiles().length > 0) {
        disableUploadZone();
        registerLedgerFiles();
      }
      clearTimeout(intervalID);
    }, 3000);
  }

  function registerLedgerFiles() {
    let verifiedFiles = accessAcceptedFiles();
    let codeISO3 = $("#country-select option:selected").val();
    let tradeType = $("#trade-select option:selected").val();
    let tradeYear = $("#year-select option:selected").val();
    let ingestMode = $("#ingest-select option:selected").val();
    let codeISO2 = "";
    let country = "";
    let tradeRecords = 0;
    let taxonomyId = "";
    let fileRecordsTag = "";
    let is_override = 1;
    let started_date = new Date();

    if (codeISO3 && tradeType && tradeYear && ingestMode) {
      let taxonomyIdArr = taxonomyStandards.filter(
        (taxonomy) =>
          taxonomy.code_iso_3 == codeISO3.toUpperCase().trim() &&
          taxonomy.trade == tradeType.toUpperCase().trim()
      );
      if (taxonomyIdArr.length > 0) {
        taxonomyId = taxonomyIdArr[0]._id;
        codeISO2 = taxonomyIdArr[0].code_iso_2;
        country = taxonomyIdArr[0].country;

        let count = 0;
        verifiedFiles.forEach((verifiedfile) => {
          const pushFile = {
            taxonomy_id: taxonomyId,
            file: verifiedfile.name,
            country: country,
            code_iso_3: codeISO3,
            code_iso_2: codeISO2,
            trade_type: tradeType,
            trade_records: tradeRecords,
            trade_year: tradeYear,
            file_records_tag: fileRecordsTag,
            is_override: is_override,
            upload_uuid: verifiedfile.upload.uuid,
            stage: IMPORT_STAGE_REGISTER,
            status: IMPORT_STATUS_PENDING,
            errors: [],
            started_date: started_date,
          };
          fileImportQueue.push(pushFile);
        });
        sendFileForRegistration();
      } else {
        Swal.fire({
          title: "Taxonomy Guard Alert",
          text: `Taxonomy Abandoned For : ${codeISO3.toUpperCase()}`,
          allowOutsideClick: false,
          showConfirmButton: true,
        });
      }
    } else {
      Swal.fire({
        title: "Import Configuration Insufficient",
        text: `Kindly select all configuration before starting the upload process!`,
        allowOutsideClick: false,
        showConfirmButton: true,
      });
    }
  }

  function examineTradeFileCompatibilityChecks(fileEntry, results, issues) {
    //let headerFields = results.meta.fields.map(x => x.split('.')[0]);
    let headerFields = results.meta.fields;
    //// console.log(headerFields);
    let taxonomyStandard = accessTaxonomyStandard(fileEntry.taxonomy_id);
    let missingFields = [];

    taxonomyStandard.fields.showcase.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });
    taxonomyStandard.fields.explore.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });
    taxonomyStandard.fields.search.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });
    taxonomyStandard.fields.filter.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });
    taxonomyStandard.fields.analytics.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });
    taxonomyStandard.fields.all.forEach((field) => {
      if (!headerFields.includes(field)) {
        if (!missingFields.includes(field)) {
          missingFields.push(field);
        }
      }
    });

    let columnTypedHeaders = [];
    headerFields.forEach((headerField) => {
      let dataTypeArr = taxonomyStandard.fields.dataTypes.filter(
        (type) => type.field === headerField
      );
      if (dataTypeArr != null && dataTypeArr != undefined) {
        if (dataTypeArr.length == 1) {
          columnTypedHeaders.push(
            dataTypeArr[0].field.concat(".", dataTypeArr[0].type)
          );
        } else {
          columnTypedHeaders.push(headerField.concat(".", "auto()"));
        }
      } else {
        missingFields.push(headerField);
      }
    });

    let fileRecordsReference = "NO_TAG";
    if (headerFields.includes(IMPORT_FILE_FIELD_RECORDS_TAG)) {
      const dataRow = results.data[0];
      fileRecordsReference = dataRow[IMPORT_FILE_FIELD_RECORDS_TAG];
    }

    let evaluateStatus = IMPORT_STATUS_UNKNOWN;
    let errorsArr = [];
    if (missingFields.length === 0 && results.errors.length === 0) {
      evaluateStatus = IMPORT_STATUS_COMPLETED;
    } else {
      evaluateStatus = IMPORT_STATUS_FAILED;
      if (missingFields.length > 0) {
        let errorBody = {};
        errorBody.type = IMPORT_ERROR_MISSING_FIELDS;
        errorBody.code = missingFields.length;
        errorBody.message = missingFields.toString();
        errorBody.extras = {};
        errorsArr.push(errorBody);
      }
      results.errors.forEach((error) => {
        let errorBody = {};
        errorBody.type = error.type;
        errorBody.code = error.code;
        errorBody.message = error.message;
        errorBody.extras = {
          row: error.row,
        };
        errorsArr.push(errorBody);
      });
    }

    let updateDataStageFile = null;
    for (let i in fileImportQueue) {
      if (fileImportQueue[i]._id === fileEntry._id) {
        if (
          fileImportQueue[i].stage === IMPORT_STAGE_EXAMINE &&
          fileImportQueue[i].status === IMPORT_STATUS_PENDING
        ) {
          fileImportQueue[i].status = evaluateStatus;
          fileImportQueue[i].errors = errorsArr;
          fileImportQueue[i].trade_records = results.data.length;
          fileImportQueue[i].file_records_tag = fileRecordsReference;
          fileImportQueue[i].column_typed_headers = columnTypedHeaders;
          updateDataStageFile = fileImportQueue[i];
          break;
        }
      }
    }

    if (updateDataStageFile) {
      // console.log(headerFields);
      // console.log(columnTypedHeaders);

      updateUploadValidationProcess(updateDataStageFile._id);
      updateFileDataStageAPIHandler(updateDataStageFile);
    }
  }

  function parseFileCompatibility(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    let parseFile = accessAcceptedFilePackEntry(fileEntry.upload_uuid);

    Papa.parse(parseFile, {
      worker: false,
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ",",
      encoding: "utf-8",
      complete: function (results) {
        examineTradeFileCompatibilityChecks(fileEntry, results, null);
      },
      error: function (error, file) {
        examineTradeFileCompatibilityChecks(fileEntry, null, error);
      },
    });
  }

  // Polling Mechanism

  function processFileDataStageIngest(fileId, stage, status, errors, pollerId) {
    if (stage === IMPORT_STAGE_INGEST) {
      let processDataStageFile = null;
      for (let i in fileImportQueue) {
        if (fileImportQueue[i]._id === fileId) {
          if (
            fileImportQueue[i].stage === IMPORT_STAGE_INGEST &&
            (fileImportQueue[i].status === IMPORT_STATUS_PENDING ||
              fileImportQueue[i].status === IMPORT_STATUS_ONGOING)
          ) {
            if (fileImportQueue[i].status != status) {
              fileImportQueue[i].status = status;
              fileImportQueue[i].errors = errors;
              processDataStageFile = fileImportQueue[i];
            }
            break;
          }
        }
      }
      if (
        processDataStageFile &&
        (processDataStageFile.status === IMPORT_STATUS_COMPLETED ||
          processDataStageFile.status === IMPORT_STATUS_FAILED)
      ) {
        window.clearInterval(pollerId);
        updateIngestionProcess(fileId);
        sendFileForIngestion(IMPORT_INGEST_MODE_AUTOMATIC, null);
      }
    }
  }

  function activateIngestFileStageQueuePoller(fileId) {
    var pollerId = window.setInterval(function () {
      fetchFileDataStageAPIHandler(fileId, IMPORT_STAGE_INGEST, pollerId);
    }, 15000);
  }

  // File Stage Emitters

  function sendImportCompletion() {
    Swal.fire({
      title: "Import Process Completed",
      confirmButtonClass: "btn btn-confirm mt-2",
      allowOutsideClick: false,
      timer: 2000,
    });

    fileDropZone.removeAllFiles();
    enableUploadZone();
    //fileImportQueue = [];
  }

  function sendFileForIngestion(ingestMode, fileId) {
    let isPendingIngestions = false;
    for (let i in fileImportQueue) {
      if (
        fileImportQueue[i].stage === IMPORT_STAGE_UPLOAD &&
        fileImportQueue[i].status === IMPORT_STATUS_COMPLETED
      ) {
        fileImportQueue[i].stage = IMPORT_STAGE_INGEST;
        fileImportQueue[i].status = IMPORT_STATUS_PENDING;
        isPendingIngestions = true;
        addImportIngestFileBlock(fileImportQueue[i]._id);
        break;
      }
    }

    if (ingestMode === IMPORT_INGEST_MODE_AUTOMATIC) {
      if (isPendingIngestions) {
        sendFileForIngestion(IMPORT_INGEST_MODE_AUTOMATIC, null);
      } else {
        ingestFile(ingestMode, null);
      }
    } else if (ingestMode === IMPORT_INGEST_MODE_MANUAL) {
      if (!isPendingIngestions) {
        ingestFile(ingestMode, fileId);
      }
    }
  }

  function sendFileForUpload() {
    let isPendingUploads = false;
    for (let i in fileImportQueue) {
      if (
        fileImportQueue[i].stage === IMPORT_STAGE_EXAMINE &&
        fileImportQueue[i].status === IMPORT_STATUS_COMPLETED
      ) {
        fileImportQueue[i].stage = IMPORT_STAGE_UPLOAD;
        fileImportQueue[i].status = IMPORT_STATUS_PENDING;
        isPendingUploads = true;
        uploadFile(fileImportQueue[i]._id);
        break;
      }
    }
    if (!isPendingUploads) {
      graceCloseSwal();
      sendFileForIngestion(IMPORT_INGEST_MODE_AUTOMATIC, null);
    }
  }

  function sendFileForValidation() {
    let isPendingValidations = false;
    for (let i in fileImportQueue) {
      if (
        fileImportQueue[i].stage === IMPORT_STAGE_REGISTER &&
        fileImportQueue[i].status === IMPORT_STATUS_COMPLETED
      ) {
        fileImportQueue[i].stage = IMPORT_STAGE_EXAMINE;
        fileImportQueue[i].status = IMPORT_STATUS_PENDING;
        isPendingValidations = true;
        parseFileCompatibility(fileImportQueue[i]._id);
        break;
      }
    }
    if (!isPendingValidations) {
      graceCloseSwal();
      sendFileForUpload();
    }
  }

  function sendFileForRegistration() {
    let fileImportQueuePendingRegistration = fileImportQueue.filter(
      (file) =>
        file.stage === IMPORT_STAGE_REGISTER &&
        file.status === IMPORT_STATUS_PENDING
    );
    if (fileImportQueuePendingRegistration.length > 0) {
      for (let i in fileImportQueuePendingRegistration) {
        addLedgerFilesAPIHandler(fileImportQueuePendingRegistration[i]);
        break;
      }
    } else {
      prepareImportProcess();
    }
  }

  function populateFileUploadQueue(registeredFile, id) {
    for (let i in fileImportQueue) {
      if (fileImportQueue[i].file == registeredFile.file) {
        fileImportQueue[i]._id = id;
        fileImportQueue[i].stage = IMPORT_STAGE_REGISTER;
        fileImportQueue[i].status = IMPORT_STATUS_COMPLETED;
        break;
      }
    }
  }

  function disableUploadZone() {
    $("#startUpload").attr("disabled", true);
    fileDropZone.disable();
    $("#fileDropZone a.dz-remove").hide();
  }

  function enableUploadZone() {
    $("#startUpload").attr("disabled", false);
    fileDropZone.enable();
  }

  // Import Process Initiator

  function discardImportFile(fileId) {
    let fileEntry = getFileImportQueueEntry(fileId);
    fileImportQueue = fileImportQueue.filter(
      (queueFile) => queueFile._id != fileId
    );
    fileDropZone.removeFile(accessAcceptedFilePackEntry(fileEntry.upload_uuid));
    if (fileImportQueue.length === 0) {
      document.location.reload(true);
      //enableUploadZone();
    }
  }

  function prepareImportProcess() {
    $("html, body").animate(
      {
        scrollTop:
          $("#importProcessSection").offset().top - $("#topnav").height(),
      },
      1000
    );
    fileImportQueue.forEach((uploadFile) => {
      if (
        uploadFile.stage === IMPORT_STAGE_REGISTER &&
        uploadFile.status === IMPORT_STATUS_COMPLETED
      ) {
        addOngoingUploadEntry(uploadFile._id);
      }
    });

    sendFileForValidation();
  }

  $("#startUpload").on("click", function (e) {
    let attachedFiles = accessAcceptedFiles();
    if (attachedFiles && attachedFiles.length > 0) {
      $(this).attr("disabled", "");
      buildFileVerificationProcess();
    } else {
      Swal.fire({
        title: "Files Missing",
        text: "Did you forget to drop files?",
        type: "question",
        confirmButtonClass: "btn btn-confirm mt-2",
        allowOutsideClick: false,
      });
    }
  });

  $("#resetFileDropZone").on("click", function (e) {
    removeFiles();
    accessAcceptedFiles();
    //$('#expcolFileDropZone').click();
  });

  $("#fileUploadCard").on("click", ".issueValidationPreview", function (e) {
    let fileId = $(this).attr("file-id");
    displayFileValidationIssues(fileId);
    $("#issueModalTrigger").trigger("click");
  });

  $("#fileIngestCard").on("click", ".issueValidationPreview", function (e) {
    let fileId = $(this).attr("file-id");
    displayFileValidationIssues(fileId);
    $("#issueModalTrigger").trigger("click");
  });

  $("#fileUploadCard").on("click", ".failedFileDiscard", function (e) {
    let fileId = $(this).closest("tr").attr("id");
    $(`#fileUploadCard table tbody tr#${fileId}`).remove();
    discardImportFile(fileId);
  });

  $("#fileUploadCard").on("click", ".completedFileProcess", function (e) {
    //let fileId = $(this).closest('tr').attr('id');
    //sendFileForIngestion(IMPORT_INGEST_MODE_MANUAL, fileId);
  });

  $("#fileIngestCard").on("click", ".failedFileDiscard", function (e) {
    let fileId = $(this).closest("tr").attr("id");
    $(`#fileIngestCard table tbody tr#${fileId}`).remove();
    discardImportFile(fileId);
  });

  // API DATA MANAGERS

  function fetchFileDataStageAPIHandler(fileId, dataStage, pollerId) {
    $.ajax({
      url: API_HOST.concat(
        ENDPOINT_FETCH_FILE_DATA_STAGE,
        QUERY_PARAMS_INDICATOR,
        "file_id",
        QUERY_PARAMS_VALUE_ASSIGNER,
        fileId,
        QUERY_PARAMS_SEPARATOR,
        "data_stage",
        QUERY_PARAMS_VALUE_ASSIGNER,
        dataStage
      ),
      type: "GET",
      success: function (payload) {
        switch (dataStage) {
          case IMPORT_STAGE_EXAMINE:
            break;
          case IMPORT_STAGE_UPLOAD:
            break;
          case IMPORT_STAGE_INGEST:
            processFileDataStageIngest(
              payload.data.file_id,
              dataStage,
              payload.data.status_code,
              payload.data.errors,
              pollerId
            );
            break;
          default:
            break;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        showApiError(textStatus, errorThrown);
      },
    });
  }

  function ingestDataFileAPIHandler(file) {
    /*Swal.fire({
      title: "Data Stage Ingestion",
      text: `Ingesting File: ${file.file}`,
      showConfirmButton: false,
      allowOutsideClick: false
    });
    Swal.showLoading();*/

    let columnTypes = file.column_typed_headers.toString();
    // console.log(columnTypes);

    $.ajax({
      url: API_HOST.concat(ENDPOINT_INGEST_FILE_DATA).replace(
        ":fileId",
        file._id
      ),
      type: "PUT",
      data: {
        payload: JSON.stringify({
          column_typed_headers: columnTypes,
        }),
      },
      success: function (payload) {
        graceCloseSwal();
        activateIngestFileStageQueuePoller(file._id);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      },
    });
  }

  function updateFileDataStageAPIHandler(file) {
    Swal.fire({
      title: "Data Stage Updation",
      text: `Updating File: ${file.file}`,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    Swal.showLoading();

    let dataStage = {
      level: file.stage,
      status: file.status,
      errors: file.errors,
      meta: {},
    };

    if (file.stage === IMPORT_STAGE_EXAMINE) {
      dataStage.meta.trade_records = file.trade_records;
      dataStage.meta.file_records_tag = file.file_records_tag;
    }

    $.ajax({
      url: API_HOST.concat(ENDPOINT_UPDATE_FILE_DATA_STAGE).replace(
        ":fileId",
        file._id
      ),
      type: "PUT",
      data: {
        payload: JSON.stringify({
          stage: dataStage,
        }),
      },
      success: function (payload) {
        graceCloseSwal();
        switch (file.stage) {
          case IMPORT_STAGE_EXAMINE:
            sendFileForValidation();
            break;
          case IMPORT_STAGE_UPLOAD:
            sendFileForUpload();
            break;
          case IMPORT_STAGE_INGEST:
            sendFileForIngestion();
            break;
          default:
            break;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      },
    });
  }

  function addLedgerFilesAPIHandler(file) {
    Swal.fire({
      title: "Ledger Registration",
      text: `Registering File: ${file.file}`,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_ADD_LEDGER_FILES),
      type: "POST",
      data: file,
      success: function (payload) {
        graceCloseSwal();
        populateFileUploadQueue(file, payload.id);
        sendFileForRegistration();
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
        sendFileForRegistration();
      },
    });
  }

  function fetchTaxonomyAPIHandler() {
    Swal.fire({
      title: "Retrieving Taxonomies",
      text: "Preparing Standards For Import Process",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(ENDPOINT_FETCH_TAXONOMY),
      type: "GET",
      success: function (payload) {
        graceCloseSwal();
        buildTaxonomyManager(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      },
    });
  }

  function verifyFilesExistenceAPIHandler(filesParams) {
    Swal.fire({
      title: "Files Acceptance",
      text: "Checking if file with same name already exists!",
      showConfirmButton: false,
      allowOutsideClick: false,
    });
    Swal.showLoading();
    $.ajax({
      url: API_HOST.concat(
        ENDPOINT_VERIFY_FILES_EXISTENCE,
        QUERY_PARAMS_INDICATOR,
        "files",
        QUERY_PARAMS_VALUE_ASSIGNER,
        filesParams
      ),
      type: "GET",
      success: function (payload) {
        graceCloseSwal();
        updateVerifiedFiles(payload.data);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        graceCloseSwal();
        showApiError(textStatus, errorThrown);
      },
    });
  }

  function showApiError(textStatus, errorThrown) {
    Swal.fire({
      type: "error",
      title: textStatus,
      text: errorThrown,
      showConfirmButton: false,
      footer: '<a href="">Why do I have this issue?</a>',
    });
  }

  function graceCloseSwal() {
    var intervalID = window.setTimeout(function () {
      Swal.close();
      clearTimeout(intervalID);
    }, 2000);
  }

  // INIT API CALLS
  fetchTaxonomyAPIHandler();
});
