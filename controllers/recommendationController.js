const TAG = 'recommendationController';

const { logger } = require("../config/logger")
const EnvConfig = require('../config/envConfig');
const recommendationModel = require('../models/recommendationModel');
const recommendationSchema = require('../schemas/recommendationSchema');
const EmailHelper = require('../helpers/emailHelper');
const NotificationModel = require('../models/notificationModel');
const TradeModel = require('../models/tradeModel');
const TradeSchema = require('../schemas/tradeSchema');
const TradeController = require('./tradeController');

var CronJob = require('cron').CronJob;


const createCompanyRecommendation = async (req, res) => {
  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  try {
    let favoriteCompanyLimits = await recommendationModel.getFavoriteCompanyLimits(payload.account_id);

    if (favoriteCompanyLimits?.favorite_company_limit?.remaining_limit > 0) {
      const companyRecommendation = recommendationSchema.createCompanyRecommendationSchema(payload);
      recommendationModel.createCompanyRecommendation(companyRecommendation, async (error, recommendation) => {
        if (error) {
          logger.error(` RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let notificationInfo = {}
          notificationInfo.user_id = [req.user.user_id]
          notificationInfo.heading = 'favorite company selection'
          notificationInfo.description = `${payload.columnValue} company have been marked as favorite.`
          let notificationType = 'user';
          await NotificationModel.add(notificationInfo, notificationType);

          favoriteCompanyLimits.favorite_company_limit.remaining_limit = (favoriteCompanyLimits?.favorite_company_limit?.remaining_limit - 1);
          await recommendationModel.updateFavoriteCompanyLimits(payload.account_id, favoriteCompanyLimits);

          res.status(200).json({
            id: recommendation.insertedId,
            consumedCount: favoriteCompanyLimits.favorite_company_limit.alloted_limit - favoriteCompanyLimits.favorite_company_limit.remaining_limit,
            allotedCount: favoriteCompanyLimits.favorite_company_limit.alloted_limit
          });
        }
      });
    }
    else {
      res.status(409).json({
        message: "Max-Favorite-Company-Limit reached... Please contact administrator for further assistance."
      });
    }
  } catch (error) {
    logger.error(` RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const createShipmentRecommendation = async (req, res) => {
  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  try {
    let favoriteShipmentLimits = await recommendationModel.getFavoriteShipmentLimits(payload.account_id);

    if (favoriteShipmentLimits?.favorite_shipment_limit?.remaining_limit > 0) {
      const shipmentRecommendation = recommendationSchema.createShipmentRecommendationSchema(payload);
      recommendationModel.createShipmentRecommendation(shipmentRecommendation, async (error, shipment) => {
        if (error) {
          logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
          res.status(500).json({
            message: "Internal Server Error",
          });
        } else {
          let notificationInfo = {}
          notificationInfo.user_id = [req.user.user_id]
          notificationInfo.heading = 'favorite shipment selection'
          notificationInfo.description = `${payload.country}'s shipment have been marked as favorite.`
          let notificationType = 'user';
          await NotificationModel.add(notificationInfo, notificationType);

          favoriteShipmentLimits.favorite_shipment_limit.remaining_limit = (favoriteShipmentLimits?.favorite_shipment_limit?.remaining_limit - 1);
          await recommendationModel.updateFavoriteShipmentLimits(payload.account_id, favoriteShipmentLimits);

          res.status(200).json({
            id: shipment.insertedId,
            consumedCount: favoriteShipmentLimits.favorite_shipment_limit.alloted_limit - favoriteShipmentLimits.favorite_shipment_limit.remaining_limit,
            allotedCount: favoriteShipmentLimits.favorite_shipment_limit.alloted_limit
          });
        }
      });
    }
    else {
      res.status(409).json({
        message: "Max-Favorite-Shipment-Limit reached... Please contact administrator for further assistance."
      });
    }
  } catch (error) {
    logger.error(` RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const updateCompanyRecommendation = async (req, res) => {
  let payload = req.body;

  try {
    let favoriteCompanyLimits = await recommendationModel.getFavoriteCompanyLimits(req.user.account_id);
    const companyRecommendationData = recommendationSchema.fetchRecommendationSchema(payload);
    recommendationModel.findCompany(companyRecommendationData, async (error, results) => {
      if (error) {
        logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        if (results.length > 0) {
          results[0].user_id = req.user.user_id;
          const updateRecommendation = recommendationSchema.updateRecommendationSchema(results[0]);
          if (updateRecommendation.isFavorite == true) {
            favoriteCompanyLimits.favorite_company_limit.remaining_limit = (favoriteCompanyLimits?.favorite_company_limit?.remaining_limit - 1);
          }
          else {
            favoriteCompanyLimits.favorite_company_limit.remaining_limit = (favoriteCompanyLimits?.favorite_company_limit?.remaining_limit + 1);
          }
          recommendationModel.updateCompanyRecommendation(updateRecommendation, async (error, updateCount) => {
            if (error) {
              logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              await recommendationModel.updateFavoriteCompanyLimits(req.user.account_id, favoriteCompanyLimits);
              res.status(200).json({
                updateCount: updateCount,
                consumedCount: favoriteCompanyLimits.favorite_company_limit.alloted_limit - favoriteCompanyLimits.favorite_company_limit.remaining_limit,
                allotedCount: favoriteCompanyLimits.favorite_company_limit.alloted_limit
              });
            }
          });
        } else {
          logger.warn("RECOMMENDATION CONTROLLER ==================", "Data not found");
          res.status(404).json({
            message: "Data not found",
          });
        }
      }
    });
  } catch (error) {
    logger.error(` RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const updateShipmentRecommendation = async (req, res) => {
  let payload = req.body;

  try {
    const shipmentRecommendationData = recommendationSchema.fetchRecommendationSchema(payload);
    let favoriteShipmentLimits = await recommendationModel.getFavoriteShipmentLimits(req.user.account_id);
    recommendationModel.findShipment(shipmentRecommendationData, async (error, results) => {
      if (error) {
        logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(404).json({
          message: "Data not found",
        });
      } else {
        if (results.length > 0) {
          const updateShipment = recommendationSchema.updateRecommendationSchema(results[0]);
          if (updateShipment.isFavorite == true) {
            favoriteShipmentLimits.favorite_shipment_limit.remaining_limit = (favoriteShipmentLimits?.favorite_shipment_limit?.remaining_limit - 1);
          }
          else {
            favoriteShipmentLimits.favorite_shipment_limit.remaining_limit = (favoriteShipmentLimits?.favorite_shipment_limit?.remaining_limit + 1);
          }
          recommendationModel.updateShipmentRecommendation(updateShipment, async (error, updateCount) => {
            if (error) {
              logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
              res.status(500).json({
                message: "Internal Server Error",
              });
            } else {
              await recommendationModel.updateFavoriteShipmentLimits(req.user.account_id, favoriteShipmentLimits);
              res.status(200).json({
                updateCount: updateCount,
                consumedCount: favoriteShipmentLimits.favorite_shipment_limit.alloted_limit - favoriteShipmentLimits.favorite_shipment_limit.remaining_limit,
                allotedCount: favoriteShipmentLimits.favorite_shipment_limit.alloted_limit
              });
            }
          }
          );
        } else {
          logger.warn("RECOMMENDATION CONTROLLER ==================  Data not found");
          res.status(404).json({
            message: "Data not found",
          });
        }
      }
    });
  } catch (error) {
    logger.error(` RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const fetchCompanyRecommendationList = async (req, res) => {
  let payload = req.query;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
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

  const companyList =
    recommendationSchema.fetchRecommendationListSchema(payload);
  try {
    const companies = await recommendationModel.findCompanyRecommendationList(
      companyList,
      offset,
      limit
    );
    if (!companies) {
      logger.error("RECOMMENDATION CONTROLLER ================== Data not found");
      res.status(404).json({
        message: "Data not found",
      });
    } else {
      for (let company in companies) {
        let esMetaData = {
          country: companies[company].country,
          tradeType: companies[company].tradeType,
          columnName:
            companies[company].tradeType === "IMPORT"
              ? "IMPORTER_NAME.keyword"
              : "EXPORTER_NAME.keyword",
          columnValue: companies[company].columnValue,
        };

        const esData = recommendationSchema.esListSchema(esMetaData);

        const results = await recommendationModel.esListCount(esData)
        if (results) {
          companies[company].count = results;
        } else {
          companies[company].count = "";
        }
      }
      res.status(200).json({
        favoriteShipment: companies,
      });
    }
  } catch (e) {
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const relatedSearch = async (req, res) => {
  let responseData = {
    suggestions: []
  }

  try {

    const companyData = await TradeController.fetchCompanyDetails(req, res, true);

    let relatedData = [];

    for (let i = 0; i < companyData.length; i++) {
      for (let j = 0; j < companyData[i].buyers.length; j++) {
        if (!relatedData.includes(companyData[i].buyers[j]._id)) {
          relatedData.push(companyData[i].buyers[j]._id);
        }
      }
      if (relatedData.length >= 10) {
        break;
      }
    }

    responseData.suggestions = relatedData;
    res.status(200).json(responseData);
  }
  catch (error) {
    logger.error(`RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(200).json(responseData);
  }
}

const recommendationSearch = async (req, res) => {
  let responseData = {
    suggestions: []
  }

  try {
    const payload = req.body;

    const searchRecommendationOutput = await recommendationModel.fetchSearchRecommendation(payload);
    var patternsData = searchRecommendationOutput[0]
    var searchedPatterns = searchRecommendationOutput[1]

    let relatedData = [];
    for (inputPattern of searchedPatterns) {
      for (let pattern of patternsData) {
        if (pattern.recommedation_patterns.k == inputPattern) {
          for (let patternValues of pattern.recommedation_patterns.v) {
            for (let patternValue of patternValues) {
              if (patternValue != inputPattern) {
                console.log(patternValue)
                relatedData.push(patternValue)
              }
            }
          }
        }
      }
    }

    responseData.suggestions = relatedData;
    res.status(200).json(responseData);
  }
  catch (error) {
    console.log(error)
    logger.error(`RECOMMENDATION CONTROLLER == ${JSON.stringify(error)}`);
    res.status(200).json(responseData);
  }
}


const fetchRecommendationByValue = async (req, res) => {
  let payload = req.body;
  try {

    const tradeType = (payload.tradeType) ? payload.tradeType.trim().toUpperCase() : null;
    let country = payload.country ? payload.country.trim().toUpperCase() : null;
    const dataBucket = TradeSchema.deriveDataBucket(tradeType, country);

    recommendationModel.findTradeShipmentRecommendationByValueAggregationEngine(payload, dataBucket, async (error, shipmentDataPack) => {
      if (error) {
        logger.error("TRADE CONTROLLER ==================", JSON.stringify(error));
        res.status(500).json({
          message: "Internal Server Error",
        });
      } else {
        res.status(200).json(shipmentDataPack);
      }
    });

  } catch (error) {
    logger.error("TRADE CONTROLLER ==================", JSON.stringify(error));
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
}

const fetchShipmentRecommendationList = (req, res) => {
  let payload = req.query;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  const pageKey = payload.draw && payload.draw != 0 ? payload.draw : null;
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

  const shipmentList =
    recommendationSchema.fetchRecommendationListSchema(payload);
  recommendationModel.findShipmentRecommendationList(
    shipmentList,
    offset,
    limit,
    (error, list) => {
      if (error) {
        logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
        res.status(404).json({
          message: "Data not found",
        });
      } else {
        res.status(200).json({
          favoriteShipment: list,
        });
      }
    }
  );
}


const sendCompanyRecommendationEmail = async (data, resultCount, companyName) => {


  let templateData = {
    recipientEmail: data.email_id,
    recipientName: data.first_name + " " + data.last_name,
    count: resultCount.body.count,
    companyName: companyName,
  };

  const emailTemplate =
    EmailHelper.buildEmailShowRecommendationTemplate(templateData);

  let emailData = {
    recipientEmail: data.email_id,
    subject: "Recommendations",
    html: emailTemplate,
  };
  try {
    const result = await EmailHelper.triggerSupportEmail(emailData);
    return result

  } catch (e) {
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
  }
};



const usersLoop = async (users) => {
  try {
    let count = 0
    for (let user of users) {
      logger.info("round :" + count);
      count++;

      // count = count + 1
      if (user?.favorite?.length > 0) {
        let userDetails = {
          first_name: user?.user?.first_name,
          last_name: user?.user?.last_name,
          email_id: user?.user?.email_id,
        }
        for (let fav of user.favorite) {

          userDetails.tradeType = fav.tradeType;

          let dateColumn = await recommendationModel.getCountriesTaxonomy(fav.taxonomy_id)

          // logger.info(userDetails);
          if (fav.isFavorite === true) {

            let data = {};
            data.favorite_id = fav._id;
            data.user_id = fav.user_id;
            data.country = fav.country;
            data.tradeType = fav.tradeType;
            data.taxonomy_id = fav.taxonomy_id;

            let esMetaData = {
              country: fav.country,
              tradeType: fav.tradeType,
              columnName: fav.columnName + ".keyword",
              columnValue: fav.columnValue,
              date_type: dateColumn?.dateColumn,
              bl_flag: dateColumn?.bl_flag,
              bucket: dateColumn?.bucket
            }


            let mail_endDate = await fetchMail_EndDate(data.user_id, data.favorite_id);


            //sending email

            if (dateColumn.cdr.end_date != '' && mail_endDate != '' && dateColumn.cdr.end_date != undefined && mail_endDate != undefined && dateColumn.cdr.end_date != mail_endDate) {

              let esCount = await fetch_esCount(esMetaData, dateColumn.cdr.end_date, mail_endDate);
              if (esCount.body.count > 0) {

                let updateCount = await updateMail_EndDate(fav._id, dateColumn.cdr.end_date)
                if (updateCount.modifiedCount > 0) {
                  let favoriteCompanyNotifications = {}
                  favoriteCompanyNotifications.heading = 'Favorite Company'
                  favoriteCompanyNotifications.description = `${esMetaData.columnValue} have some new information`
                  let notificationType = 'general'
                  let result = await NotificationModel.add(favoriteCompanyNotifications, notificationType);
                  let mailResult = await sendCompanyRecommendationEmail(userDetails, esCount, esMetaData.columnValue);
                }
              } else {
                logger.info("no new record ");
              }
            } else if (dateColumn.cdr.end_date != '' && mail_endDate === undefined) {

              let addEndDate = await insertMail_EndDate(fav, dateColumn.cdr.end_date)
              logger.info('Added ---------' + addEndDate.insertedCount);
            }
          }

        }
      } else {
        logger.info("No favorites");
      }
    }
  } catch (e) {
    throw e
  }

}

const companyLoop = async (companies, userDetails) => {
  try {
    for (let company of companies) {

      if (company.isFavorite === true) {

        let data = {};
        data.favorite_id = company._id;
        data.user_id = company.user_id;
        data.country = company.country;
        data.tradeType = company.tradeType;
        data.taxonomy_id = company.taxonomy_id;

        let esMetaData = {
          country: company.country,
          tradeType: company.tradeType,
          columnName: (company.tradeType) === "IMPORT" ? "IMPORTER_NAME.keyword" : "EXPORTER_NAME.keyword",
          columnValue: company.columnValue,
          date_type: (company.tradeType) === "IMPORT" ? "IMP_DATE" : "EXP_DATE"
        }

        userDetails.tradeType = company.tradeType;

        let CDR_endDate = await fetchCDR_EndDate(data.taxonomy_id);
        let mail_endDate = await fetchMail_EndDate(data.user_id, data.favorite_id);


        //sending email

        if (CDR_endDate != '' && mail_endDate != '' && CDR_endDate != undefined && mail_endDate != undefined && CDR_endDate != mail_endDate) {

          let esCount = await fetch_esCount(esMetaData, CDR_endDate, mail_endDate);
          if (esCount.body.count > 0) {

            let updateCount = await updateMail_EndDate(company._id, CDR_endDate)
            if (updateCount.modifiedCount > 0) {
              let favoriteCompanyNotifications = {}
              favoriteCompanyNotifications.heading = 'Favorite Company'
              favoriteCompanyNotifications.description = `${esMetaData.columnValue} have some new information`
              let notificationType = 'general'
              let result = await NotificationModel.add(favoriteCompanyNotifications, notificationType);
              let mailResult = await sendCompanyRecommendationEmail(userDetails, esCount, esMetaData.columnValue);
            }
          } else {
            logger.info("no new record ");
          }
        } else if (CDR_endDate != '' && mail_endDate === undefined) {

          let addEndDate = await insertMail_EndDate(company, CDR_endDate)
          logger.info('Added ---------' + addEndDate.insertedCount);
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
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
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
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
    throw e
  }

}

const updateMail_EndDate = async (id, CDR_endDate) => {
  try {
    let recommendationEmailUpdateData = recommendationSchema.updateRecommendationEmailSchema(id, CDR_endDate)
    let result = await recommendationModel.updateRecommendationEmail(recommendationEmailUpdateData);
    return result
  } catch (e) {
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
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
      logger.info('cannot fetch data from elastic search');
    }
  } catch (e) {
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(e)}`);
    throw e
  }

}

const insertMail_EndDate = async (data, CDR_endDate) => {
  try {
    let emailData = recommendationSchema.addRecommendationEmailSchema(data, CDR_endDate)
    let result = await recommendationModel.addRecommendationEmail(emailData);
    return result
  } catch (e) {
    logger.error(` RECOMMENDATION CONTROLLER ================== ${JSON.stringify(error)}`);
    throw e
  }

}

const job = new CronJob({
  cronTime: '00 00 00 * * *', onTick: async () => {
    try {

      if (process.env.MONGODBNAME != "dev") {
        let users = await recommendationModel.fetchbyUser();
        if (users.length < 0) {
          logger.warn("RECOMMENDATION CONTROLLER ================== NO data found");
        } else {
          let x = await usersLoop(users)
        }
        logger.info("end of this cron job");
      }
    } catch (e) {
      throw e
    }

  }, start: false, timeZone: 'Asia/Kolkata'//'Asia/Singapore'
});

job.start();

module.exports = {
  createCompanyRecommendation,
  updateCompanyRecommendation,
  createShipmentRecommendation,
  updateShipmentRecommendation,
  fetchCompanyRecommendationList,
  fetchShipmentRecommendationList,
  relatedSearch,
  recommendationSearch,
  fetchRecommendationByValue
}
