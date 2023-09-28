// @ts-check
const TAG = 'sourceDateManipulatorUtil';

const QUERY_FIELD_TERM_SPLITTED_YEAR = 'splitYear';
const QUERY_FIELD_TERM_SPLITTED_MONTH = 'splitMonth';
const QUERY_FIELD_TERM_SPLITTED_DAY = 'splitDay';

// Custom Interpretation For Date Pattern (Ex:01-Jan-19) From Source Data-Sets
const buildRawDateYMDSplitterExpression = (dateTerm) => {

  let dateSplitterExpression = {
    splitYear: {
      "$toUpper": {
        "$arrayElemAt": [{
          "$split": ["$" + dateTerm, "-"]
        }, 2]
      }
    },
    splitMonth: {
      "$toUpper": {
        "$arrayElemAt": [{
          "$split": ["$" + dateTerm, "-"]
        }, 1]
      }
    },
    splitDay: {
      "$toUpper": {
        "$arrayElemAt": [{
          "$split": ["$" + dateTerm, "-"]
        }, 0]
      }
    }
  };

  return dateSplitterExpression;
};

const buildDateMonthSwitcherExpression = (monthTerm) => {

  let dateMonthSwitcherExpression = {
    $switch: {
      branches: [{
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "JAN"]
        },
        then: "01"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "FEB"]
        },
        then: "02"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "MAR"]
        },
        then: "03"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "APR"]
        },
        then: "04"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "MAY"]
        },
        then: "05"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "JUN"]
        },
        then: "06"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "JUL"]
        },
        then: "07"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "AUG"]
        },
        then: "08"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "SEP"]
        },
        then: "09"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "OCT"]
        },
        then: "10"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "NOV"]
        },
        then: "11"
      },
      {
        case: {
          $eq: [{
            $toUpper: "$" + monthTerm
          }, "DEC"]
        },
        then: "12"
      }
      ],
      default: "01"
    }
  };

  return dateMonthSwitcherExpression;
};

const formulateSourceDateManipulationStages = (datefieldTerm, additionalProjectionExpressions) => {

  let stages = [];

  let dateSplitterExpression = buildRawDateYMDSplitterExpression(datefieldTerm);
  stages.push({
    $addFields: dateSplitterExpression
  });

  let dateMonthSwitcherExpression = buildDateMonthSwitcherExpression(QUERY_FIELD_TERM_SPLITTED_MONTH);
  let dateMonthComputedProjections = {};
  dateMonthComputedProjections = additionalProjectionExpressions;
  dateMonthComputedProjections.formattedYear = "$" + QUERY_FIELD_TERM_SPLITTED_YEAR;
  dateMonthComputedProjections.formattedMonth = dateMonthSwitcherExpression;
  dateMonthComputedProjections.formattedDay = "$" + QUERY_FIELD_TERM_SPLITTED_DAY;
  stages.push({
    $project: dateMonthComputedProjections
  });

  let computedDateExpression = {
    tradeDate: {
      $toDate: {
        $concat: ["20", "$formattedYear", "-", "$formattedMonth", "-", "$formattedDay"]
      }
    },
  };
  stages.push({
    $addFields: computedDateExpression
  });

  return stages;
};

module.exports = {
  buildRawDateYMDSplitterExpression,
  buildDateMonthSwitcherExpression,
  formulateSourceDateManipulationStages
};
