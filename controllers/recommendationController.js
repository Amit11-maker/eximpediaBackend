const TAG = 'recommendationController';

const EnvConfig = require('../config/envConfig');
const recommendationModel = require('../models/recommendationModel');
const recommendationSchema = require('../schemas/recommendationSchema');
const EmailHelper = require('../helpers/emailHelper');

const cron = require('node-cron');
const UserModel = require('../models/userModel');


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
      res.status(404).json({
        message: 'Data not found',
      });
    } else {

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
    };

  });
};



module.exports = {

  addRecommendation,
  updateRecommendation

}