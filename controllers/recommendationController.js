const TAG = 'recommendationController';

const EnvConfig = require('../config/envConfig');
const recommendationModel = require('../models/recommendationModel');
const recommendationSchema = require('../schemas/recommendationSchema');
const EmailHelper = require('../helpers/emailHelper');

const cron = require('node-cron');

const addRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  const recommendation = recommendationSchema.addRecommendationSchema(payload);
  recommendationModel.add(recommendation, (error, rec) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: rec.insertedId
      });
    }
  });
};


const updateRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id

  const recommendation = recommendationSchema.fetchRecommendationSchema(payload);

  recommendationModel.find(recommendation, (error, recommendation) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      if (recommendation.length > 0) {
        recommendation[0].user_id = req.user.user_id;
        const recommendationUpdate = recommendationSchema.updateRecommendationSchema(recommendation[0]);
        recommendationModel.update(recommendationUpdate, (error, recommendation) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              updateCount: recommendation
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

const fetchRecommendationList = (req, res) => {

  let payload = req.query;
  payload.user_id = req.user.user_id
  payload.account_id = req.user.account_id

  const recommendation = recommendationSchema.fetchRecommendationListSchema(payload);

  recommendationModel.findList(recommendation, (error, results) => {

    if (error) {
      res.status(404).json({
        message: 'Data not found'
      });
    } else {
      res.status(200).json({
        favoriteCompany: results
      });
    }
  });
};

const fetchShipmentList = (req, res) => {

  let payload = req.query;
  payload.user_id = req.user.user_id
  payload.account_id = req.user.account_id

  const shipment = recommendationSchema.fetchRecommendationListSchema(payload);
  recommendationModel.findShipmentList(shipment, (error, results) => {
    if (error) {
      res.status(404).json({
        message: 'Data not found'
      });
    } else {
      res.status(200).json({
        favoriteShipment: results
      });
    }
  });
};

const sendRecommendationEmail = async (data, resultCount, companyName) => {

  let templateData = {
    recipientEmail: data.email_id,
    recipientName: data.first_name + " " + data.last_name,
    count: resultCount.body.count,
    companyName
  };

  const emailTemplate = EmailHelper.buildEmailShowRecommendationTemplate(templateData);

  let emailData = {
    recipientEmail: data.email_id,
    subject: 'Recommendations',
    html: emailTemplate
  };
  try {
    const mailtriggered = await EmailHelper.triggerEmail(emailData)
    console.log(mailtriggered)

  } catch (e) {
    throw e
  }
};

const addShipmentRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id;
  payload.account_id = req.user.account_id;

  const shipment = recommendationSchema.addShipmentRecommendationSchema(payload);
  recommendationModel.addShipment(shipment, (error, rec) => {
    if (error) {
      res.status(500).json({
        message: 'Internal Server Error',
      });
    } else {
      res.status(200).json({
        id: rec.insertedId
      });
    }
  });
};

const updateShipmentRecommendation = (req, res) => {

  let payload = req.body;
  payload.user_id = req.user.user_id

  const shipment = recommendationSchema.fetchRecommendationSchema(payload);

  recommendationModel.findShipment(shipment, (error, results) => {
    if (error) {
      res.status(404).json({
        message: 'Data not found',
      });
    } else {
      if (results.length > 0) {
        results[0].user_id = req.user.user_id;
        const shipmentUpdate = recommendationSchema.updateRecommendationSchema(results[0]);
        recommendationModel.updateShipment(shipmentUpdate, (error, shipment) => {
          if (error) {
            res.status(500).json({
              message: 'Internal Server Error',
            });
          } else {
            res.status(200).json({
              updateCount: recommendation
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

cron.schedule('0 0 0 * * *', async () => {

  const results = await recommendationModel.fetchbyUser();
  if (results.length < 0) {
    throw new Error('No Data Found');
  } else {
    for (let result in results) {
      // console.log("round :" + result);
      if (results[result].rec.length > 0) {
        let endDate = {
          CDR_endDate: '',
          mail_endDate: ''
        }
        let recs = results[result].rec
        let userDetails = {
          first_name: results[result].first_name,
          last_name: results[result].last_name,
          email_id: results[result].email_id,
        }
        for (let rec in recs) {
          // console.log("round rec :" + rec);
          let data = {};
          data.favorite_id = recs[rec]._id;
          data.user_id = recs[rec].user_id;
          data.country = recs[rec].country;
          data.tradeType = recs[rec].tradeType;
          data.taxonomy_id = recs[rec].taxonomy_id;

          let esMetaData = {
            country: recs[rec].country,
            tradeType: recs[rec].tradeType,
            columnName: (recs[rec].tradeType) === "IMPORT" ? "IMPORTER_NAME.keyword" : "EXPORTER_NAME.keyword",
            columnValue: recs[rec].columnValue,
            date_type: (recs[rec].tradeType) === "IMPORT" ? "IMP_DATE" : "EXP_DATE"
          }

          userDetails.tradeType = recs[rec].tradeType;

          const CDRinfo = recommendationSchema.fetchCDNRecommendationSchema(data.taxonomy_id);
          const cdrResults = await recommendationModel.findEndDateCDR(CDRinfo);
          if (cdrResults.length > 0) {

            // console.log("CDR date : " + JSON.stringify(cdrResults));
            endDate.CDR_endDate = cdrResults[0].end_date
          }

          const mailInfo = recommendationSchema.fetchRecommendationMailSchema(data.user_id, data.favorite_id);

          const mailResults = await recommendationModel.findEndDateEmail(mailInfo)
          // console.log("mailInfo", mailInfo);
          if (mailResults.length > 0) {

            // console.log("Mail date : " + mailResults[0].end_date);
            endDate.mail_endDate = mailResults[0].end_date
          }

          //sending email

          if (endDate.CDR_endDate != '' && endDate.mail_endDate != '') {
            if (endDate.CDR_endDate === endDate.mail_endDate) {
              console.log("You are upto-date");
            } else {

              const esData = recommendationSchema.esSchema(esMetaData, endDate);

              try {
                const esResults = await recommendationModel.esCount(esData)
                if (esResults) {
                  // console.log(esResults.statusCode);
                  await sendRecommendationEmail(userDetails, esResults, esData.columnValue)
                  let recommendationEmailUpdateData = recommendationSchema.updateRecommendationEmailSchema(recs[rec]._id, endDate.CDR_endDate)
                  recommendationModel.updateRecommendationEmail(recommendationEmailUpdateData, (error, result) => { console.log("recommendation email", result) })
                } else {
                  throw new Error('cannot fetch date from elastic search')
                }
              } catch (e) {
                throw e
              }
            }
          } else if (endDate.CDR_endDate != '') {
            try {
              let emailData = recommendationSchema.addRecommendationEmailSchema(recs[rec], endDate.CDR_endDate)
              recommendationModel.addRecommendationEmail(emailData, (error, result) => { console.log(result) })
            } catch (e) {
              throw e
            }
          }
        }
      }
    }
  }
});






module.exports = {
  addRecommendation,
  updateRecommendation,
  fetchRecommendationList,
  addShipmentRecommendation,
  updateShipmentRecommendation,
  fetchShipmentList

}