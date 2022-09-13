const TAG = 'fileHelper';
var Transform = require('stream').Transform;
var util = require('util');
const FSHandler = require('fs');
const CreateCsvWriter = require('csv-writer').createObjectCsvWriter;

const PATH_SEPARATOR_SLASH = '/';

// Transform sctreamer to remove first line
function RemoveFirstLine(args) {
  if (!(this instanceof RemoveFirstLine)) {
    return new RemoveFirstLine(args);
  }
  Transform.call(this, args);
  this._buff = '';
  this._removed = false;
}
util.inherits(RemoveFirstLine, Transform);

RemoveFirstLine.prototype._transform = function (chunk, encoding, done) {
  if (this._removed) { // if already removed
    this.push(chunk); // just push through buffer
  } else {
    // collect string into buffer
    this._buff += chunk.toString();

    // check if string has newline symbol
    if (this._buff.indexOf('\n') !== -1) {
      // push to stream skipping first line
      this.push(this._buff.slice(this._buff.indexOf('\n') + 2));
      // clear string buffer
      this._buff = null;
      // mark as removed
      this._removed = true;
    }
  }
  done();
};

// Write Data To CSV File
function writeDataToCSVFile(filePath, fileName, headers, data, cb) {

  /*
  headers = [{
      id: 'RECORDS_TAG',
      title: 'RECORDS_TAG'
    },
    {
      id: 'CUSH',
      title: 'CUSH'
    },
    {
      id: 'INDIAN_PORT',
      title: 'INDIAN_PORT'
    },
    {
      id: 'BE_NO',
      title: 'BE_NO'
    },
    {
      id: 'IMP_DATE',
      title: 'IMP_DATE'
    },
    {
      id: 'IEC',
      title: 'IEC'
    },
    {
      id: 'IMPORTER_NAME',
      title: 'IMPORTER_NAME'
    },
    {
      id: 'ADDRESS',
      title: 'ADDRESS'
    },
    {
      id: 'CITY',
      title: 'CITY'
    },
    {
      id: 'CHA_NO',
      title: 'CHA_NO'
    },
    {
      id: 'CHA_NAME',
      title: 'CHA_NAME'
    },
    {
      id: 'ORIGIN_COUNTRY',
      title: 'ORIGIN_COUNTRY'
    },
    {
      id: 'HS_CODE',
      title: 'HS_CODE'
    },
    {
      id: 'PRODUCT_DESCRIPTION',
      title: 'PRODUCT_DESCRIPTION'
    },
    {
      id: 'QUANTITY',
      title: 'QUANTITY'
    },
    {
      id: 'UNIT',
      title: 'UNIT'
    },
    {
      id: 'UNIT_VALUE_INR',
      title: 'UNIT_VALUE_INR'
    },
    {
      id: 'TOTAL_ASSESSABLE_VALUE_INR',
      title: 'TOTAL_ASSESSABLE_VALUE_INR'
    },
    {
      id: 'UNIT_PRICE_USD',
      title: 'UNIT_PRICE_USD'
    },
    {
      id: 'TOTAL_ASSESS_USD',
      title: 'TOTAL_ASSESS_USD'
    },
    {
      id: 'TOTAL_DUTY_PAID',
      title: 'TOTAL_DUTY_PAID'
    },
    {
      id: 'APPRAISING_GROUP',
      title: 'APPRAISING_GROUP'
    },
    {
      id: 'PORT_OF_SHIPMENT',
      title: 'PORT_OF_SHIPMENT'
    },
    {
      id: 'INVOICE_CURRENCY',
      title: 'INVOICE_CURRENCY'
    },
    {
      id: 'SUPPLIER_NAME',
      title: 'SUPPLIER_NAME'
    },
    {
      id: 'SUPPLIER_ADDRESS',
      title: 'SUPPLIER_ADDRESS'
    },
    {
      id: 'INVOICE_UNITPRICE_FC',
      title: 'INVOICE_UNITPRICE_FC'
    },
    {
      id: 'TYPE',
      title: 'TYPE'
    },
    {
      id: 'INVOICE_NO',
      title: 'INVOICE_NO'
    },
    {
      id: 'id',
      title: 'id'
    }
  ];
  */

  // header: headers
  const csvWriter = CreateCsvWriter({
    path: filePath.concat(fileName, '.csv'),
    header: headers
  });

  //logger.info(data);

  csvWriter
    .writeRecords(data)
    .catch((err) => logger.error(JSON.stringify(err)))
    .then(() => {
      logger.info('The ' + fileName + '.csv file was written successfully');
      cb(filePath.concat(fileName, '.csv'));
    });
}


module.exports = {
  RemoveFirstLine,
  writeDataToCSVFile
};
