const TAG = 'elasticsearchDbQueryBuilderHelper';

const EXPR_FIELD_SEPARATOR_COLON = ':';

const EXPR_TYPE_FIELD_TEXT_MATCH = 0;

const EXPR_TYPE_FIELD_REGEX_START_MATCH = 1;
const EXPR_TYPE_SPLIT_MIDDLE_FIELD_IN_MATCH = 2;
const EXPR_TYPE_IN_MATCH = 3;
const EXPR_TYPE_DEFAULT_EQ_MATCH = 4;
const EXPR_TYPE_RANGE_MIN_MAX_MATCH = 5;
const EXPR_TYPE_NO_FIELD_GROUP = 6;
const EXPR_TYPE_NO_FIELD_COUNT_GROUP = 7;
const EXPR_TYPE_SINGLE_FIELD_GROUP = 8;
const EXPR_TYPE_SINGLE_FIELD_COUNT_GROUP = 9;
const EXPR_TYPE_SINGLE_FIELD_SPLIT_FIELD_COUNT_GROUP = 10;
const EXPR_TYPE_META_TAGGED_CURRENCY_SINGLE_FIELD_MIN_MAX_RANGE_GROUP = 11;
const EXPR_TYPE_DUAL_FIELD_MIN_MAX_RANGE_GROUP = 12;
const EXPR_TYPE_DEFAULT_FIELD_PROJECT = 13;
const EXPR_TYPE_SIZE_SIMILAR_FIELD_PROJECT = 14;
const EXPR_TYPE_SIZE_VARIED_FIELD_PROJECT = 15;
const EXPR_TYPE_SINGLE_FIELD_MIN_MAX_RANGE_GROUP = 16;
const EXPR_TYPE_DUAL_FIELD_CLUBBED_SEQUENCE_GROUP = 17;

const EXPR_TYPE_DATE_EXTRACT_MONTH_GROUP = 18;

const FIELD_TYPE_DEFAULT_EQ_MATCH = 101;
const FIELD_TYPE_IN_MATCH = 102;
const FIELD_TYPE_RANGE_MIN_MAX_MATCH = 103;
const FIELD_TYPE_IN_SPLIT_MATCH = 104;
const FIELD_TYPE_REGEX_WORD_AND_GATED_UNORDERED_MATCH = 105;
const FIELD_TYPE_WORDS_EXACT_TEXT_MATCH = 200;
const FIELD_TYPE_EXACT_TEXT_MATCH = 206;
const FIELD_TYPE_WORDS_OR_TEXT_MATCH = 201;
const FIELD_TYPE_WORDS_AND_TEXT_MATCH = 202;
const FIELD_TYPE_WORDS_CONTAIN_TEXT_MATCH = 203;
const FIELD_TYPE_WORDS_PREFIX_TEXT_MATCH = 205;

const FIELD_TYPE_DATE_RANGE_MATCH = 300;
const FIELD_TYPE_DATE_MULTIPLE_OR_RANGE_MATCH = 301;
const FIELD_TYPE_LESS_THAN_LOGICAL_OPERATOR = 400;
const FIELD_TYPE_GREATER_THAN_LOGICAL_OPERATOR = 401;
const FIELD_TYPE_LESS_THAN_EQUAL_LOGICAL_OPERATOR = 402;
const FIELD_TYPE_GREATER_THAN_EQUAL_LOGICAL_OPERATOR = 403;

// Lucene Search
const FIELD_TYPE_WORDS_EXACT_SEARCH = 2000;
const FIELD_TYPE_WORDS_OR_SEARCH = 2001;
const FIELD_TYPE_WORDS_AND_SEARCH = 2002;
const FIELD_TYPE_WORDS_IN_SEARCH = 2003;
const FIELD_TYPE_WORDS_CONTAIN_SEARCH = 2004;
const FIELD_TYPE_WORDS_PREFIX_SEARCH = 2005;
const FIELD_TYPE_NUMBER_RANGE_BETWEEN_INCLUSIVE_SEARCH = 3001;
const FIELD_TYPE_NUMBER_MULTIPLE_RANGE_BETWEEN_INCLUSIVE_SEARCH = 3002;
const FIELD_TYPE_NUMBER_RANGE_BETWEEN_EXCLUSIVE_SEARCH = 3003;
const FIELD_TYPE_NUMBER_MULTIPLE_RANGE_BETWEEN_EXCLUSIVE_SEARCH = 3004;
const FIELD_TYPE_DATE_RANGE_BETWEEN_INCLUSIVE_SEARCH = 4001;
const FIELD_TYPE_DATE_MULTIPLE_RANGE_BETWEEN_INCLUSIVE_SEARCH = 4002;
const FIELD_TYPE_DATE_RANGE_BETWEEN_EXCLUSIVE_SEARCH = 4003;
const FIELD_TYPE_DATE_MULTIPLE_RANGE_BETWEEN_EXCLUSIVE_SEARCH = 4004;


const queryGroupExpressionsRefM = [{
  expression: {
    $group: {
      _id: null,
      count: {
        $sum: 1
      }
    }
  },
  type: EXPR_TYPE_NO_FIELD_COUNT_GROUP
},
{
  expression: {
    $group: {
      _id: "$XXX_FIELD_TERM_XXX"
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_GROUP
},
{
  expression: {
    $group: {
      _id: "$XXX_FIELD_TERM_XXX",
      count: {
        $sum: 1
      }
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_COUNT_GROUP
},
{
  expression: {
    $group: {
      _id: {
        $arrayElemAt: [{
          $split: ['$XXX_FIELD_TERM_XXX', "-"]
        }, 1]
      },
      count: {
        $sum: 1
      }
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_SPLIT_FIELD_COUNT_GROUP
},
{
  expression: {
    $group: {
      _id: {
        $month: '$XXX_FIELD_TERM_XXX'
      },
      count: {
        $sum: 1
      }
    }
  },
  type: EXPR_TYPE_DATE_EXTRACT_MONTH_GROUP
},
{
  expression: {
    $group: {
      _id: null,
      minRange: {
        $min: "$XXX_FIELD_TERM_XXX"
      },
      maxRange: {
        $max: "$XXX_FIELD_TERM_XXX"
      }
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {
    $group: {
      _id: null,
      minRange: {
        $min: "$XXX_FIELD_TERM_XXX"
      },
      maxRange: {
        $max: "$XXX_FIELD_TERM_XXX"
      },
      "metaTag": {
        "$addToSet": {
          "currency": "XXX_META_TAG_XXX"
        }
      }
    }
  },
  type: EXPR_TYPE_META_TAGGED_CURRENCY_SINGLE_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {
    $group: {
      _id: "$XXX_FIELD_TERM_PRIMARY_XXX",
      minRange: {
        $min: "$XXX_FIELD_TERM_SECONDARY_XXX"
      },
      maxRange: {
        $max: "$XXX_FIELD_TERM_SECONDARY_XXX"
      }
    }
  },
  type: EXPR_TYPE_DUAL_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {
    $groups: [{
      $group: {
        _id: {
          "primaryTerm": "$XXX_FIELD_TERM_PRIMARY_XXX",
          "secondaryTerm": "$XXX_FIELD_TERM_SECONDARY_XXX"
        },
        count: {
          $sum: 1
        }
      }
    },
    {
      $group: {
        _id: "$_id.primaryTerm",
        breakCount: {
          $sum: "$count"
        },
        count: {
          $sum: 1
        }
      }
    }
    ]
  },
  type: EXPR_TYPE_DUAL_FIELD_CLUBBED_SEQUENCE_GROUP
}
];

const queryGroupExpressions = [{
  expression: {},
  type: EXPR_TYPE_NO_FIELD_COUNT_GROUP
},
{
  expression: {
    cardinality: {
      field: "XXX_FIELD_TERM_XXX"
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_GROUP
},
{
  expression: {
    terms: {
      field: "XXX_FIELD_TERM_XXX",
      size: 1000
    }
  },
  type: EXPR_TYPE_SINGLE_FIELD_COUNT_GROUP
},
{
  expression: {},
  type: EXPR_TYPE_SINGLE_FIELD_SPLIT_FIELD_COUNT_GROUP
},
{
  expression: {
    date_histogram: {
      field: "XXX_FIELD_TERM_XXX",
      calendar_interval: "month",
      format: "yyyy-MM"
    }
  },
  type: EXPR_TYPE_DATE_EXTRACT_MONTH_GROUP
},
{
  expression: {},
  type: EXPR_TYPE_SINGLE_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {
    stats: {
      field: "XXX_FIELD_TERM_XXX"
    },
    meta: {
      metaTag: [{
        currency: "XXX_META_TAG_XXX"
      }]
    }
  },
  type: EXPR_TYPE_META_TAGGED_CURRENCY_SINGLE_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {
    terms: {
      field: "XXX_FIELD_TERM_PRIMARY_XXX",
      script: "doc['XXX_FIELD_TERM_PRIMARY_XXX'].value.trim().toLowerCase()",
      size: 500
    },
    aggs: {
      minRange: {
        min: {
          field: "XXX_FIELD_TERM_SECONDARY_XXX"
        }
      },
      maxRange: {
        max: {
          field: "XXX_FIELD_TERM_SECONDARY_XXX"
        }
      }
    }
  },
  type: EXPR_TYPE_DUAL_FIELD_MIN_MAX_RANGE_GROUP
},
{
  expression: {},
  type: EXPR_TYPE_DUAL_FIELD_CLUBBED_SEQUENCE_GROUP
}
];


const buildQueryEngineExpressions = (data) => {
  let query = {};

  switch (data.expressionType) {
    case FIELD_TYPE_WORDS_EXACT_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match_phrase = {};
          query.match_phrase[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_OR_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match = {};
          query.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
            operator: "or"
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_AND_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match = {};
          query.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
            operator: "and"
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_CONTAIN_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.wildcard = {};
          query.wildcard[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = '*' + data.fieldValue + '*';
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_IN_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match = {};
          query.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
            operator: "or"
          };
        }
      }
      break;
    }
    case FIELD_TYPE_NUMBER_RANGE_BETWEEN_INCLUSIVE_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query.range = {};
            query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
              gte: data.fieldValueLeft,
              lte: data.fieldValueRight
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_RANGE_BETWEEN_INCLUSIVE_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query.range = {};
            query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
              gte: new Date(data.fieldValueLeft),
              lte: new Date(data.fieldValueRight)
            };
          }
        }
      }
      break;
    }
    case EXPR_TYPE_SPLIT_MIDDLE_FIELD_IN_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) { }
      }
      break;
    }
    case EXPR_TYPE_FIELD_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) { }
      break;
    }
    case FIELD_TYPE_REGEX_WORD_AND_GATED_UNORDERED_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        let regExpSearchTermGroups = '';
        const searchTermWords = data.fieldValue.split(' ');
        searchTermWords.forEach(searchElement => {
          regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY `(?=.*\\b${searchElement}\\b)`  ---- `(?=.*${searchElement})`;
        });
        //console.log(JSON.stringify(regExpSearchTermGroups));
        let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');
        // console.log(regExpSearchTerm);

        query[data.fieldTerm] = {};
      }
      break;
    }
    case FIELD_TYPE_WORDS_EXACT_TEXT_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          if (data.fieldValue == "*") {
            query.match_all = {};
            break;
          }
          query.match_phrase = {};
          query.match_phrase[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
          };
        }
      }
      break;
    }
    case FIELD_TYPE_EXACT_TEXT_MATCH: {
      let innerQuery = []
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          for (let value of data.fieldValue) {
            let clause = {}
            clause.match = {};
            clause.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
              query: value,
              operator: "and"
            };
            innerQuery.push({ ...clause })
          }
          query.or = innerQuery
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_OR_TEXT_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match = {};
          query.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
            operator: "or"
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_AND_TEXT_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match = {};
          query.match[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            query: data.fieldValue,
            operator: "and"
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_CONTAIN_TEXT_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.match_phrase_prefix = {};
          query.match_phrase_prefix[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {};
          query.match_phrase_prefix[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')].query = '*' + data.fieldValue + '*';
          if (data.analyser)
            query.match_phrase_prefix[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')].analyzer = 'my_search_analyzer';
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_PREFIX_TEXT_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.prefix = {};
          query.prefix[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            value: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_IN_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.terms = {};
          query.terms[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = data.fieldValue;
        }
      }
      break;
    }
    case FIELD_TYPE_LESS_THAN_LOGICAL_OPERATOR: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.range = {};
          query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            lt: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_GREATER_THAN_LOGICAL_OPERATOR: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.range = {};
          query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            gt: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_LESS_THAN_EQUAL_LOGICAL_OPERATOR: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.range = {};
          query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            lte: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_GREATER_THAN_EQUAL_LOGICAL_OPERATOR: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.range = {};
          query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
            gte: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_RANGE_MIN_MAX_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query.range = {};
            query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
              gte: data.fieldValueLeft,
              lte: data.fieldValueRight,
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query.range = {};
            if (data.fieldValueLeft.includes("T")) {
              data.fieldValueLeft = data.fieldValueLeft.split("T")[0]
            }
            if (data.fieldValueRight.includes("T")) {
              data.fieldValueRight = data.fieldValueRight.split("T")[0]
            }
            query.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
              gte: new Date(data.fieldValueLeft),
              lte: new Date(data.fieldValueRight)
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_MULTIPLE_OR_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValues != null && data.fieldValues != null) {
          let innerQueryArr = [];
          data.fieldValues.forEach(fieldValue => {
            if (fieldValue.fieldValueLeft != null && fieldValue.fieldValueRight != null) {
              if (fieldValue.fieldValueLeft != undefined && fieldValue.fieldValueRight != undefined) {
                let elementRange = {
                  range: {}
                };
                elementRange.range[data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')] = {
                  gte: new Date(fieldValue.fieldValueLeft),
                  lte: new Date(fieldValue.fieldValueRight)
                };

                innerQueryArr.push(elementRange);
              }
            }
          });

          query.or = innerQueryArr;
        }
      }
      break;
    }
    default:
      break;
  }

  let queryClause = query;
  // console.log(queryClause);
  return queryClause;
};

const buildQuerySearchExpressions = (data) => {
  let query = {};

  switch (data.expressionType) {
    case FIELD_TYPE_WORDS_EXACT_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          if (!data.isCompundIndexSpecified) {
            query.index = data.indexNamePrefix.concat(data.year);
          }
          query.phrase = {
            path: data.fieldTerm,
            query: data.fieldValue,
            slop: 0
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_OR_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          if (!data.isCompundIndexSpecified) {
            query.index = data.indexNamePrefix.concat(data.year);
          }
          let termsArr = data.fieldValue.split(' ');
          let termsORString = termsArr.join(' OR ');
          query.queryString = {
            defaultPath: data.fieldTerm,
            query: termsORString
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_AND_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          if (!data.isCompundIndexSpecified) {
            query.index = data.indexNamePrefix.concat(data.year);
          }
          let termsArr = data.fieldValue.split(' ');
          let termsANDString = termsArr.join(' AND ');
          query.queryString = {
            defaultPath: data.fieldTerm,
            query: termsANDString
          };
        }
      }
      break;
    }
    case FIELD_TYPE_WORDS_IN_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          if (!data.isCompundIndexSpecified) {
            query.index = data.indexNamePrefix.concat(data.year);
          }
          let termsORString = data.fieldValue.join(' OR ');
          query.queryString = {
            defaultPath: data.fieldTerm,
            query: termsORString
          };
          /*query.text = {
            query: data.fieldValue,
            path: data.fieldTerm
          };*/
        }
      }
      break;
    }
    case FIELD_TYPE_NUMBER_RANGE_BETWEEN_INCLUSIVE_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            if (!data.isCompundIndexSpecified) {
              query.index = data.indexNamePrefix.concat(data.year);
            }
            query.range = {
              path: data.fieldTerm,
              gte: data.fieldValueLeft,
              lte: data.fieldValueRight
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_RANGE_BETWEEN_INCLUSIVE_SEARCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            if (!data.isCompundIndexSpecified) {
              query.index = data.indexNamePrefix.concat(data.year);
            }
            query.range = {
              path: data.fieldTerm,
              gte: new Date(data.fieldValueLeft),
              lte: new Date(data.fieldValueRight)
            };
          }
        }
      }
      break;
    }
    case EXPR_TYPE_SPLIT_MIDDLE_FIELD_IN_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.$expr = {
            $in: [{
              $toUpper: {
                $arrayElemAt: [{
                  $split: ['$' + data.fieldTerm, "-"]
                }, 1]
              }
            },
            data.fieldValue
            ]
          };
        }
      }
      break;
    }
    case EXPR_TYPE_FIELD_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: data.fieldValue // FOR PHRASE MATCH -> "\"" + data.fieldValue + "\""
        };
      }
      break;
    }
    case FIELD_TYPE_REGEX_WORD_AND_GATED_UNORDERED_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        let regExpSearchTermGroups = '';
        const searchTermWords = data.fieldValue.split(' ');
        searchTermWords.forEach(searchElement => {
          regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY `(?=.*\\b${searchElement}\\b)`  ---- `(?=.*${searchElement})`;
        });
        //console.log(JSON.stringify(regExpSearchTermGroups));
        let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');
        // console.log(regExpSearchTerm);

        query[data.fieldTerm] = {
          $regex: regExpSearchTerm,
          $options: 'i'
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_EXACT_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: "\"" + data.fieldValue + "\""
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_OR_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: data.fieldValue
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_AND_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        let regExpSearchTermGroups = '';
        const searchTermWords = data.fieldValue.split(' ');
        searchTermWords.forEach(searchElement => {
          regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY `(?=.*\\b${searchElement}\\b)`  ---- `(?=.*${searchElement})`;
        });
        //console.log(JSON.stringify(regExpSearchTermGroups));
        let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');
        // console.log(regExpSearchTerm);

        query[data.fieldTerm] = {
          $regex: regExpSearchTerm,
          $options: 'i'
        };
      }
      break;
    }
    case FIELD_TYPE_DATE_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query[data.fieldTerm] = {
              $gte: new Date(data.fieldValueLeft),
              $lte: new Date(data.fieldValueRight)
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_MULTIPLE_OR_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValues != null && data.fieldValues != null) {
          let innerQueryArr = [];
          data.fieldValues.forEach(fieldValue => {
            if (fieldValue.fieldValueLeft != null && fieldValue.fieldValueRight != null) {
              if (fieldValue.fieldValueLeft != undefined && fieldValue.fieldValueRight != undefined) {
                let elementRange = {};
                elementRange[data.fieldTerm] = {
                  $gte: new Date(fieldValue.fieldValueLeft),
                  $lte: new Date(fieldValue.fieldValueRight)
                };

                innerQueryArr.push(elementRange);
              }
            }
          });

          query.$or = innerQueryArr;
        }
      }
      break;
    }
    default:
      break;
  }

  let queryClause = query;
  // console.log(queryClause);
  return queryClause;
};

const buildQueryMatchExpressions = (data) => {
  let query = {};

  switch (data.expressionType) {
    case FIELD_TYPE_DEFAULT_EQ_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query[data.fieldTerm] = data.fieldValue;
        }
      }
      break;
    }
    case FIELD_TYPE_IN_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query[data.fieldTerm] = {
            $in: data.fieldValue
          };
        }
      }
      break;
    }
    case FIELD_TYPE_RANGE_MIN_MAX_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query[data.fieldTerm] = {
              $gte: data.fieldValueLeft,
              $lte: data.fieldValueRight,
            };
          }
        }
      }
      break;
    }
    case EXPR_TYPE_SPLIT_MIDDLE_FIELD_IN_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValue != null && data.fieldValue != undefined) {
          query.$expr = {
            $in: [{
              $toUpper: {
                $arrayElemAt: [{
                  $split: ['$' + data.fieldTerm, "-"]
                }, 1]
              }
            },
            data.fieldValue
            ]
          };
        }
      }
      break;
    }
    case EXPR_TYPE_FIELD_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: data.fieldValue // FOR PHRASE MATCH -> "\"" + data.fieldValue + "\""
        };
      }
      break;
    }
    case FIELD_TYPE_REGEX_WORD_AND_GATED_UNORDERED_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        let regExpSearchTermGroups = '';
        const searchTermWords = data.fieldValue.split(' ');
        searchTermWords.forEach(searchElement => {
          regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY `(?=.*\\b${searchElement}\\b)`  ---- `(?=.*${searchElement})`;
        });
        //console.log(JSON.stringify(regExpSearchTermGroups));
        let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');
        // console.log(regExpSearchTerm);

        query[data.fieldTerm] = {
          $regex: regExpSearchTerm,
          $options: 'i'
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_EXACT_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: "\"" + data.fieldValue + "\""
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_OR_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        query.$text = {
          $search: data.fieldValue
        };
      }
      break;
    }
    case FIELD_TYPE_WORDS_AND_TEXT_MATCH: {
      if (data.fieldValue != null && data.fieldValue != undefined) {
        let regExpSearchTermGroups = '';
        const searchTermWords = data.fieldValue.split(' ');
        searchTermWords.forEach(searchElement => {
          regExpSearchTermGroups = regExpSearchTermGroups + `(?=.*\\b${searchElement}\\b)`; // APPLY WORD BOUNDARY `(?=.*\\b${searchElement}\\b)`  ---- `(?=.*${searchElement})`;
        });
        //console.log(JSON.stringify(regExpSearchTermGroups));
        let regExpSearchTerm = new RegExp(regExpSearchTermGroups + '.+');
        // console.log(regExpSearchTerm);

        query[data.fieldTerm] = {
          $regex: regExpSearchTerm,
          $options: 'i'
        };
      }
      break;
    }
    case FIELD_TYPE_DATE_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValueLeft != null && data.fieldValueRight != null) {
          if (data.fieldValueLeft != undefined && data.fieldValueRight != undefined) {
            query[data.fieldTerm] = {
              $gte: new Date(data.fieldValueLeft),
              $lte: new Date(data.fieldValueRight)
            };
          }
        }
      }
      break;
    }
    case FIELD_TYPE_DATE_MULTIPLE_OR_RANGE_MATCH: {
      if (data.fieldTerm != null && data.fieldTerm != undefined) {
        if (data.fieldValues != null && data.fieldValues != null) {
          let innerQueryArr = [];
          data.fieldValues.forEach(fieldValue => {
            if (fieldValue.fieldValueLeft != null && fieldValue.fieldValueRight != null) {
              if (fieldValue.fieldValueLeft != undefined && fieldValue.fieldValueRight != undefined) {
                let elementRange = {};
                elementRange[data.fieldTerm] = {
                  $gte: new Date(fieldValue.fieldValueLeft),
                  $lte: new Date(fieldValue.fieldValueRight)
                };

                innerQueryArr.push(elementRange);
              }
            }
          });

          query.$or = innerQueryArr;
        }
      }
      break;
    }
    default:
      break;
  }

  let obj = query;
  let queryClause = {
    key: Object.keys(obj)[0],
    value: obj[Object.keys(obj)[0]]
  };
  // console.log(queryClause);
  return query;
};


const applyQueryGroupExpressions = (data) => {
  let queryGroup = queryGroupExpressions.filter(expression => expression.type == data.expressionType)[0];
  let query = JSON.stringify(queryGroup.expression);
  let suffix = ''
  let fieldTerm = ''
  if (data.fieldTerm != null && data.fieldTerm != undefined) {
    query = query.replace(/XXX_FIELD_TERM_XXX/gi, data.fieldTerm + ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : ''));
    fieldTerm = data.fieldTerm
    suffix = ((data.fieldTermTypeSuffix) ? data.fieldTermTypeSuffix : '')
  }
  if (data.fieldTermPrimary != null && data.fieldTermPrimary != undefined) {
    query = query.replace(/XXX_FIELD_TERM_PRIMARY_XXX/gi, data.fieldTermPrimary + ((data.fieldTermPrimaryTypeSuffix) ? data.fieldTermPrimaryTypeSuffix : ''));
    fieldTerm = data.fieldTermPrimary
    suffix = ((data.fieldTermPrimaryTypeSuffix) ? data.fieldTermPrimaryTypeSuffix : '')
  }
  if (data.fieldTermSecondary != null && data.fieldTermSecondary != undefined) {
    query = query.replace(/XXX_FIELD_TERM_SECONDARY_XXX/gi, data.fieldTermSecondary + ((data.fieldTermSecondaryTypeSuffix) ? data.fieldTermSecondaryTypeSuffix : ''));
    fieldTerm = data.fieldTermSecondary
    suffix = ((data.fieldTermSecondaryTypeSuffix) ? data.fieldTermSecondaryTypeSuffix : '')
  }
  if (data.metaTag != null && data.metaTag != undefined) {
    query = query.replace(/XXX_META_TAG_XXX/gi, data.metaTag + ((data.metaTagTypeSuffix) ? data.metaTagTypeSuffix : ''));
    fieldTerm = data.metaTag
    suffix = ((data.metaTagTypeSuffix) ? data.metaTagTypeSuffix : '')
  }
  let obj = JSON.parse(query);
  console.log(obj, obj.hasOwnProperty('terms'), suffix, fieldTerm);
  if (obj.hasOwnProperty('terms') && suffix == '.keyword' && fieldTerm.length > 0) {
    obj['terms']["script"] = `doc['${fieldTerm + suffix}'].value.trim().toLowerCase()`
    console.log(obj, data.fieldTerm);
  }
  // let queryClause = {
  //   key: Object.keys(obj)[0],
  //   value: JSON.parse(JSON.stringify(obj[Object.keys(obj)[0]]))
  // };
  return obj;
};

module.exports = {
  buildQueryMatchExpressions,
  buildQueryEngineExpressions,
  buildQuerySearchExpressions,
  applyQueryGroupExpressions,
};
