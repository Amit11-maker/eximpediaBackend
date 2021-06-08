const TAG = 'dateHelper';

// Output => [2017, 2018, 2019]
const getDateDifferenceAsYears = (startDate, endDate) => {
  let date1 = new Date(startDate);
  let date2 = new Date(endDate);
  let yearsDiff = date2.getFullYear() - date1.getFullYear();

  let dateDiffYearArr = [];
  for (let i = 0; i <= yearsDiff; i++) {
    dateDiffYearArr[i] = date1.getFullYear() + i;
  }

  return dateDiffYearArr;
};

// Output => [3,4,5,6]
const getYearInternalDifferenceAsMonths = (startDate, endDate) => {
  let date1 = new Date(startDate);
  let date2 = new Date(endDate);
  let monthsDiff = (date2.getMonth() + 1) - (date1.getMonth() + 1);

  let dateDiffMonthArr = [];
  for (let i = 0; i <= monthsDiff; i++) {
    dateDiffMonthArr[i] = (date1.getMonth() + 1) + i;
  }

  return dateDiffMonthArr;
};

// Output => [{year:2017, months: [1,2,3]}]
const getProjectedYearMonthsFromDateInterval = (projectedYear, startDate, endDate) => {
  let date1 = new Date(startDate);
  let date2 = new Date(endDate);
  let year = projectedYear;
  let yearMonthPack = {
    year: year
  };

  if (year < date1.getFullYear() || year > date2.getFullYear()) {
    let monthsArr = [];
    yearMonthPack.months = monthsArr;
  } else if (year >= date1.getFullYear() && year <= date2.getFullYear()) {

    if (year > date1.getFullYear() && year < date2.getFullYear()) {
      let monthsArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      yearMonthPack.months = monthsArr;
    } else if (year == date1.getFullYear()) {
      let barrierDate = new Date("".concat(date1.getFullYear(), "-", 12, "-", 1));
      let monthsArr = getYearInternalDifferenceAsMonths(date1, barrierDate);
      yearMonthPack.months = monthsArr;
    } else if (year == date2.getFullYear()) {
      let barrierDate = new Date("".concat(date2.getFullYear(), "-", 1, "-", 31));
      let monthsArr = getYearInternalDifferenceAsMonths(barrierDate, date2);
      yearMonthPack.months = monthsArr;
    }

  }

  return yearMonthPack;
};

module.exports = {
  getDateDifferenceAsYears,
  getProjectedYearMonthsFromDateInterval
};
