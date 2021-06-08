const TAG = 'taxonomySchema';

const FlagHelper = require('../helpers/flagHelper');

const TAXONOMY_TYPE_IMPORT = 'IMPORT';
const TAXONOMY_TYPE_EXPORT = 'EXPORT';

const TAXONOMY_MODE_INACTIVE = 0;
const TAXONOMY_MODE_ACTIVE = 1;

const TRADE_BUCKET_KEY = 'bucket';

const REGEX_PATTERN_UNDERSCORE = /_/gi;

const SEPARATOR_UNDERSCORE = '_';
const SEPARATOR_SPACE = ' ';

const fields = {
  showcase: [],
  explore: [],
  search: [],
  filter: [],
  analytics: [],
  all: [],
  definition: []
};

const fieldDefinition = {
  column: '',
  alias: ''
};

const taxonomy = {
  country: '',
  code_iso_3: '',
  code_iso_2: '',
  flag_uri: '',
  data_bucket: '',
  mode: 1,
  fields: fields,
  created_ts: '',
  modified_ts: ''
};

const buildTaxonomy = (data) => {
  let currentTimestamp = Date.now();
  let content = JSON.parse(JSON.stringify(taxonomy));
  content.country = data.country;
  content.code_iso_3 = data.code_iso_3;
  content.code_iso_2 = data.code_iso_2;
  content.flag_uri = FlagHelper.getFlagByCountryISOCode(data.code_iso_3);
  content.data_bucket = TRADE_BUCKET_KEY.concat(SEPARATOR_UNDERSCORE, data.trade.toLowerCase(),
    SEPARATOR_UNDERSCORE, data.code_iso_3, SEPARATOR_UNDERSCORE, data.year);

  data.fields.forEach((field) => {
    let term = field.term.toUpperCase().trim();
    if (field.isShowcase) {
      content.fields.showcase.push(term);
    }
    if (field.isExplore) {
      content.fields.explore.push(term);
    }
    if (field.isSearch) {
      content.fields.search.push(term);
    }
    if (field.isAnalytics) {
      content.fields.analytics.push(term);
    }
    content.fields.all.push(term);
    let definition = Object.assign({}, fieldDefinition);
    definition.column = term;
    definition.alias = term.replace(REGEX_PATTERN_UNDERSCORE, SEPARATOR_SPACE);
    content.fields.definition.push(fieldDefinition);
    content.created_ts = currentTimestamp;
    content.modified_ts = currentTimestamp;
  });

  return content;
};

module.exports = {
  TAXONOMY_TYPE_IMPORT,
  TAXONOMY_TYPE_EXPORT,
  TAXONOMY_MODE_INACTIVE,
  TAXONOMY_MODE_ACTIVE,
  TRADE_BUCKET_KEY,
  buildTaxonomy
};
