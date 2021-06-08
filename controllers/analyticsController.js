const TAG = 'AnalyticsController';

const AnalyticsModel = require('../models/analyticsModel');
const AnalyticsSchema = require('../schemas/analyticsSchema');

const fetchChronologicalTradeFactorsCorrelation = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let analyticsTimeBoundary = (payload.timeboundaryRange) ? payload.timeboundaryRange : null;

  const dataBucket = workspaceBucket;

  let boundaryRange = [{
      "year": 2018,
      "months": [10, 11, 12]
    },
    {
      "year": 2019,
      "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      "year": 2020,
      "months": [1, 2, 3]
    }
  ];

  console.log(dataBucket);

  AnalyticsModel.findTradeFactorCorrelationByTimeAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);
      console.log(analyticsDataPack);
      res.status(200).json({
        data: analyticsDataPack
      });
    }
  });

};


const fetchChronologicalTradeEntitiesComparison = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let analyticsTimeBoundary = (payload.timeboundaryRange) ? payload.timeboundaryRange : null;

  const dataBucket = workspaceBucket;

  let boundaryRange = [{
      "year": 2018,
      "months": [10, 11, 12]
    },
    {
      "year": 2019,
      "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      "year": 2020,
      "months": [1, 2, 3]
    }
  ];

  console.log(dataBucket);

  AnalyticsModel.findTradeEntityComparisonByTimeAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);
      res.status(200).json({
        data: analyticsDataPack
      });
    }
  });

};


const fetchChronologicalTradeEntitiesDistribution = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;

  const dataBucket = workspaceBucket;

  console.log(dataBucket);

  AnalyticsModel.findTradeEntityDistributionByTimeAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);
      res.status(200).json({
        data: analyticsDataPack
      });
    }
  });
};


const fetchTradeEntitiesFactorsCorrelation = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;

  const dataBucket = workspaceBucket;

  console.log(dataBucket);

  AnalyticsModel.findTradeFactorCorrelationByEntityAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);
      res.status(200).json({
        data: analyticsDataPack
      });
    }
  });

};


const fetchTradeEntitiesFactorsContribution = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceEntitiesCount = (payload.workspaceEntitiesCount) ? payload.workspaceEntitiesCount : null;

  let pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }
  payload.offset = offset;
  payload.limit = limit;
  const dataBucket = workspaceBucket;

  console.log(dataBucket);

  AnalyticsModel.findTradeFactorContributionByEntityAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {

      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);

      let bundle = {};

      if (!analyticsDataPack.dataPoints) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsFiltered = analyticsDataPack.dataPoints.length;
        bundle.recordsTotal = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
        bundle.recordsFiltered = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
      }

      if (pageKey) {
        bundle.draw = pageKey;
      }
      bundle.data = analyticsDataPack.dataPoints;
      res.status(200).json(bundle);
    }
  });

};


const fetchTradeEntitiesFactorsPeriodisation = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceEntitiesCount = (payload.workspaceEntitiesCount) ? payload.workspaceEntitiesCount : null;
  let analyticsTimeBoundary = (payload.timeboundaryRange) ? payload.timeboundaryRange : null;

  let pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }
  payload.offset = offset;
  payload.limit = limit;
  const dataBucket = workspaceBucket;

  console.log(dataBucket);

  AnalyticsModel.findTradeEntityFactorPerioidsationByTimeAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.boundaryRange = analyticsTimeBoundary; //boundaryRange
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);

      let bundle = {};

      if (!analyticsDataPack.dataPoints) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsFiltered = analyticsDataPack.dataPoints.length;
        bundle.recordsTotal = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
        bundle.recordsFiltered = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
      }

      if (pageKey) {
        bundle.draw = pageKey;
      }
      bundle.data = analyticsDataPack.dataPoints;
      res.status(200).json(bundle);
    }
  });

};


const fetchTradeEntitiesFactorsComposition = (req, res) => {

  let payload = req.body;
  let workspaceBucket = (payload.workspaceBucket) ? payload.workspaceBucket : null;
  let workspaceEntitiesCount = (payload.workspaceEntitiesCount) ? payload.workspaceEntitiesCount : null;

  let pageKey = (payload.draw && payload.draw != 0) ? payload.draw : null;
  let offset = null;
  let limit = null;
  //Datatable JS Mode
  if (pageKey != null) {
    offset = (payload.start != null) ? payload.start : 0;
    limit = (payload.length != null) ? payload.length : 10;
  } else {
    offset = (payload.offset != null) ? payload.offset : 0;
    limit = (payload.limit != null) ? payload.limit : 10;
  }
  payload.offset = offset;
  payload.limit = limit;
  const dataBucket = workspaceBucket;

  console.log(dataBucket);

  AnalyticsModel.findTradeFactorCompositionByEntityAggregationEngine(payload, dataBucket, (error, analyticsData) => {
    if (error) {
      res.status(500).json({
        message: error,
      });
    } else {
      analyticsData.chart = payload.chart;
      analyticsData.specification = payload.specification;
      let analyticsDataPack = AnalyticsSchema.processAggregationResult(analyticsData);

      let bundle = {};

      if (!analyticsDataPack.dataPoints) {
        bundle.recordsTotal = 0;
        bundle.recordsFiltered = 0;
        bundle.error = "Unrecognised Shipments Response"; //Show if to be interpreted as error on client-side
      } else {
        let recordsFiltered = analyticsDataPack.dataPoints.length;
        bundle.recordsTotal = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
        bundle.recordsFiltered = (workspaceEntitiesCount != null) ? workspaceEntitiesCount : recordsFiltered;
      }

      if (pageKey) {
        bundle.draw = pageKey;
      }
      bundle.data = analyticsDataPack.dataPoints;
      res.status(200).json(bundle);
    }
  });

};


module.exports = {
  fetchChronologicalTradeFactorsCorrelation,
  fetchChronologicalTradeEntitiesComparison,
  fetchChronologicalTradeEntitiesDistribution,
  fetchTradeEntitiesFactorsCorrelation,
  fetchTradeEntitiesFactorsContribution,
  fetchTradeEntitiesFactorsPeriodisation,
  fetchTradeEntitiesFactorsComposition
};
