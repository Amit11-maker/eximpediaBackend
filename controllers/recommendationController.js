const TAG = 'recommendationController';


const EnvConfig = require('../config/envConfig');
const recommendationModel = require('../models/recommendationModel');
const recommendationSchema = require('../schemas/recommendationSchema');
const EmailHelper = require('../helpers/emailHelper');
const { Logger } = require('mongodb/lib/core');

var CronJob = require('cron').CronJob;


const createCompanyRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  let max_count = req.plan.max_favorite_company_count;

  const count = recommendationSchema.fetchCountSchema(payload);
  recommendationModel.countCompany(count, (error, totalCount) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (totalCount < max_count) {
        const companyRecommendation = recommendationSchema.createCompanyRecommendationSchema(payload);
        recommendationModel.createCompanyRecommendation(companyRecommendation, (error, recommendation) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              id: recommendation.insertedId,
              count: totalCount + 1
            });
          }
        });
      } else {
        res.status(200).json({
          message: "Limit Reached"
        });
      }
    }
  });
};


const createShipmentRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;
  let max_count = req.plan.max_favorite_shipment_count

  const count = recommendationSchema.fetchCountSchema(payload);
  recommendationModel.countShipment(count, (error, totalCount) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (totalCount < max_count) {
        const shipmentRecommendation = recommendationSchema.createShipmentRecommendationSchema(payload);
        recommendationModel.createShipmentRecommendation(shipmentRecommendation, (error, shipment) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              id: shipment.insertedId,
              count: totalCount + 1
            });
          }
        });
      } else {
        res.status(200).json({
          message: "Limit Reached"
        });
      }
    }
  });
};


const updateCompanyRecommendation = (req, res) => {

  let payload = req.body;
  // payload.user_id = req.user.user_id

  const companyRecommendationData = recommendationSchema.fetchRecommendationSchema(payload);
  recommendationModel.findCompany(companyRecommendationData, (error, results) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (results.length > 0) {
        results[0].user_id = req.user.user_id;
        const updateRecommendation = recommendationSchema.updateRecommendationSchema(results[0]);
        recommendationModel.updateCompanyRecommendation(updateRecommendation, (error, updateCount) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              updateCount: updateCount
            });
          }
        });
      }
      else {
        res.status(404).json({
          message: 'Data not found',
        });
      }
    };
  });
};


const updateShipmentRecommendation = (req, res) => {

  let payload = req.body;

  const shipmentRecommendationData = recommendationSchema.fetchRecommendationSchema(payload);
  recommendationModel.findShipment(shipmentRecommendationData, (error, results) => {
    if (error) {
      res.status(404).json({
        message: 'Data not found',
      });
    } else {
      if (results.length > 0) {
        const updateShipment = recommendationSchema.updateRecommendationSchema(results[0]);
        recommendationModel.updateShipmentRecommendation(updateShipment, (error, updateCount) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              updateCount: updateCount
            });
          }
        });
      }
      else {
        res.status(404).json({
          message: 'Data not found',
        });
      };
    };
  });
};


const fetchCompanyRecommendationList = async (req, res) => {

  let payload = req.query;
  payload.user_id = req.user.user_id
  payload.account_id = req.user.account_id

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }

  const companyList = recommendationSchema.fetchRecommendationListSchema(payload);
  try {
    const companies = await recommendationModel.findCompanyRecommendationList(companyList, offset, limit)
    if (!companies) {
      res.status(404).json({
        message: 'Data not found'
      });
    } else {
      for (let company in companies) {
        let esMetaData = {
          country: companies[company].country,
          tradeType: companies[company].tradeType,
          columnName: (companies[company].tradeType) === "IMPORT" ? "IMPORTER_NAME.keyword" : "EXPORTER_NAME.keyword",
          columnValue: companies[company].columnValue
        }

        const esData = recommendationSchema.esListSchema(esMetaData);

        const results = await recommendationModel.esListCount(esData)
        console.log(results);
        if (results) {
          companies[company].count = results;
        } else {
          companies[company].count = "";
        }
      }
      res.status(200).json({
        favoriteShipment: companies
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Internal Server Error"
    });
  };
};


const fetchShipmentRecommendationList = (req, res) => {

  let payload = req.query;
  payload.user_id = req.user.user_id
  payload.account_id = req.user.account_id

  const pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = payload.start != null ? payload.start : 0;
    limit = payload.length != null ? payload.length : 10;
  } else {
    offset = payload.offset != null ? payload.offset : 0;
    limit = payload.limit != null ? payload.limit : 10;
  }

  const shipmentList = recommendationSchema.fetchRecommendationListSchema(payload);
  recommendationModel.findShipmentRecommendationList(shipmentList, offset, limit, (error, list) => {
    if (error) {
      res.status(404).json({
        message: 'Data not found'
      });
    } else {

      res.status(200).json({
        favoriteShipment: list
      });
    }
  });
};


const sendCompanyRecommendationEmail = async (data, resultCount, companyName) => {


  let templateData = {
    recipientEmail: data.email_id,
    recipientName: data.first_name + " " + data.last_name,
    count: resultCount.body.count,
    companyName: companyName,
  };

  const emailTemplate = EmailHelper.buildEmailShowRecommendationTemplate(templateData);

  let emailData = {
    recipientEmail: data.email_id,
    subject: 'Recommendations',
    html: emailTemplate
  };
  try {
    const result = await EmailHelper.triggerSupportEmail(emailData);
    return result

  } catch (e) {
    console.log(e);
  }
};



const usersLoop = async (users) => {
  try {
    for (let user in users) {
      console.log("round :" + user);
      // count = count + 1
      if (users[user].rec.length > 0) {

        let companies = users[user].rec;

        let userDetails = {
          first_name: users[user].first_name,
          last_name: users[user].last_name,
          email_id: users[user].email_id,
        }
        // console.log(userDetails);
        let x = await companyLoop(companies, userDetails);

      } else {
        console.log("No favorites");
      }
    }
  } catch (e) {
    throw e
  }

}

const companyLoop = async (companies, userDetails) => {
  try {
    for (let company in companies) {

      if (companies[company].isFavorite === true) {

        let data = {};
        data.favorite_id = companies[company]._id;
        data.user_id = companies[company].user_id;
        data.country = companies[company].country;
        data.tradeType = companies[company].tradeType;
        data.taxonomy_id = companies[company].taxonomy_id;

        let esMetaData = {
          country: companies[company].country,
          tradeType: companies[company].tradeType,
          columnName: (companies[company].tradeType) === "IMPORT" ? "IMPORTER_NAME.keyword" : "EXPORTER_NAME.keyword",
          columnValue: companies[company].columnValue,
          date_type: (companies[company].tradeType) === "IMPORT" ? "IMP_DATE" : "EXP_DATE"
        }

        userDetails.tradeType = companies[company].tradeType;

        let CDR_endDate = await fetchCDR_EndDate(data.taxonomy_id);
        let mail_endDate = await fetchMail_EndDate(data.user_id, data.favorite_id);


        //sending email

        if (CDR_endDate != '' && mail_endDate != '' && CDR_endDate != undefined && mail_endDate != undefined && CDR_endDate != mail_endDate) {

          let esCount = await fetch_esCount(esMetaData, CDR_endDate, mail_endDate)
          let updateCount = await updateMail_EndDate(companies[company]._id, CDR_endDate)
          if (updateCount.modifiedCount > 0) {
            let mailResult = await sendCompanyRecommendationEmail(userDetails, esCount, esMetaData.columnValue);
          }
        } else if (CDR_endDate != '' && mail_endDate === undefined) {

          let addEndDate = await insertMail_EndDate(companies[company], CDR_endDate)
          console.log('Added ---------' + addEndDate.insertedCount);
        }
      }
    }
  } catch (e) {
    throw e
  }

}

const fetchCDR_EndDate = async (taxonomy_id) => {
  try {
    let country_date_range = recommendationSchema.fetchCDNRecommendationSchema(taxonomy_id);
    let countryDateRangeResults = await recommendationModel.findCountryDateRangeEndDate(country_date_range);
    if (countryDateRangeResults.length > 0) {
      return countryDateRangeResults[0].end_date;
    }
  } catch (e) {
    throw e
  }
}

const fetchMail_EndDate = async (user_id, favorite_id) => {
  try {
    let recommendationMail = recommendationSchema.fetchRecommendationMailSchema(user_id, favorite_id);
    let recommendationMailResults = await recommendationModel.findRecommendationEmailEndDate(recommendationMail)
    if (recommendationMailResults.length > 0) {
      return recommendationMailResults[0].endDate
    }
  } catch (e) {
    throw e
  }

}

const updateMail_EndDate = async (id, CDR_endDate) => {
  try {
    let recommendationEmailUpdateData = recommendationSchema.updateRecommendationEmailSchema(id, CDR_endDate)
    let result = await recommendationModel.updateRecommendationEmail(recommendationEmailUpdateData);
    return result
  } catch (e) {
    throw e
  }

}

const fetch_esCount = async (esMetaData, CDR_endDate, mail_endDate) => {
  try {
    let esData = recommendationSchema.esSchema(esMetaData, CDR_endDate, mail_endDate);
    let esResults = await recommendationModel.esCount(esData);
    if (esResults) {
      return esResults
    } else {
      console.log('cannot fetch data from elastic search');
    }
  } catch (e) {
    throw e
  }

}

const insertMail_EndDate = async (data, CDR_endDate) => {
  try {
    let emailData = recommendationSchema.addRecommendationEmailSchema(data, CDR_endDate)
    let result = await recommendationModel.addRecommendationEmail(emailData);
    return result
  } catch (e) {
    throw e
  }

}


const job = new CronJob({
  cronTime: ' 0 20 13 * * *', onTick: async () => {
    try {
      let users = await recommendationModel.fetchbyUser();
      console.log("users length--", users.length);
      if (users.length < 0) {
        throw new Error('No Data Found');
      } else {
        let x = await usersLoop(users)
      }
      console.log("end of this cron job");
    } catch (e) {
      throw e
    }

  }, start: false, timeZone:'Asia/Kolkata' //'Asia/Singapore'
});
job.start();


module.exports = {
  createCompanyRecommendation,
  updateCompanyRecommendation,
  createShipmentRecommendation,
  updateShipmentRecommendation,
  fetchCompanyRecommendationList,
  fetchShipmentRecommendationList

}