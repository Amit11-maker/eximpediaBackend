const TAG = 'recommendationController';


const EnvConfig = require('../config/envConfig');
const recommendationModel = require('../models/recommendationModel');
const recommendationSchema = require('../schemas/recommendationSchema');
const EmailHelper = require('../helpers/emailHelper');
const cron = require('node-cron');
const { Logger } = require('mongodb/lib/core');


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
    await EmailHelper.triggerSupportEmail(emailData, function (error, results) {
      return results
    });
  } catch (e) {
    throw new Error("Internal Server Error")
  }
};



cron.schedule('0 0 0 * * *', async () => {
  try {
    const users = await recommendationModel.fetchbyUser();
    if (users.length < 0) {
      throw new Error('No Data Found');
    } else {
      for (let user in users) {
        console.log("round :" + user);
        if (users[user].rec.length > 0) {

          let endDate = {
            CDR_endDate: '',
            mail_endDate: ''
          }
          let companies = users[user].rec
          let userDetails = {
            first_name: users[user].first_name,
            last_name: users[user].last_name,
            email_id: users[user].email_id,
          }
          // console.log(userDetails);
          for (let company in companies) {

            if (!companies[company].isFavorite) {
              continue
            }

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

            const country_date_range = recommendationSchema.fetchCDNRecommendationSchema(data.taxonomy_id);
            // console.log(data.taxonomy_id.toString());
            const countryDateRangeResults = await recommendationModel.findCountryDateRangeEndDate(country_date_range);
            if (countryDateRangeResults.length > 0) {

              // console.log("CDR date : " + JSON.stringify(cdrResults));
              endDate.CDR_endDate = countryDateRangeResults[0].end_date
            }

            const recommendationMail = recommendationSchema.fetchRecommendationMailSchema(data.user_id, data.favorite_id);

            const recommendationMailResults = await recommendationModel.findRecommendationEmailEndDate(recommendationMail)
            // console.log("mailInfo", mailInfo);
            if (recommendationMailResults.length > 0) {

              // console.log("Mail date : " + mailResults[0].end_date);
              endDate.mail_endDate = recommendationMailResults[0].endDate
            }

            //sending email

            if (endDate.CDR_endDate != '' && endDate.mail_endDate != '') {
              if (endDate.CDR_endDate === endDate.mail_endDate) {

                console.log("You are upto-date");
              } else {

                // console.log('mail sending');
                const esData = recommendationSchema.esSchema(esMetaData, endDate);

                try {
                  const esResults = await recommendationModel.esCount(esData);
                  if (esResults) {
                    // console.log(esResults.statusCode);
                    console.log("sending mail");
                    let recommendationEmailUpdateData = recommendationSchema.updateRecommendationEmailSchema(companies[company]._id, endDate.CDR_endDate)
                    const result = await recommendationModel.updateRecommendationEmail(recommendationEmailUpdateData);
                    console.log("recommendation email", result);
                    const mailresults = sendCompanyRecommendationEmail(userDetails, esResults, esData.columnValue)
                    console.log('mail send');
                  } else {
                    throw new Error('cannot fetch date from elastic search')
                  }
                } catch (e) {
                  throw e
                }
              }
            } else if (endDate.CDR_endDate != '') {
              try {
                let emailData = recommendationSchema.addRecommendationEmailSchema(companies[company], endDate.CDR_endDate)
                recommendationModel.addRecommendationEmail(emailData, (error, result) => { console.log("Added") })
              } catch (e) {
                throw e
              }
            }
          }
        }
      }
    }
    console.log("end of this cron job");
  } catch (e) {
    throw e
  }

});






module.exports = {
  createCompanyRecommendation,
  updateCompanyRecommendation,
  createShipmentRecommendation,
  updateShipmentRecommendation,
  fetchCompanyRecommendationList,
  fetchShipmentRecommendationList

}
