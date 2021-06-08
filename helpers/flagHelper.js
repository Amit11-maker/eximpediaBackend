const TAG = 'flagHelper';

const FLAG_PREFIX = 'flag_';

const flags = [{
    iso_code_3: 'IND',
    iso_code_2: 'IN',
    flag_uri: 'flag_ind.png'
  },
  {
    iso_code_3: 'PAK',
    iso_code_2: 'PK',
    flag_uri: 'flag_pak.png'
  },
  {
    iso_code_3: 'KEN',
    iso_code_2: 'KE',
    flag_uri: 'flag_ken.png'
  },
  {
    iso_code_3: 'LKA',
    iso_code_2: 'LK',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'PAN',
    iso_code_2: 'PA',
    flag_uri: 'flag_pan.png'
  },
  {
    iso_code_3: 'PER',
    iso_code_2: 'PE',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'UGA',
    iso_code_2: 'UG',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'VEN',
    iso_code_2: 'VE',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'ETH',
    iso_code_2: 'ET',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'MEX',
    iso_code_2: 'MX',
    flag_uri: 'flag_lka.png'
  },
  {
    iso_code_3: 'USA',
    iso_code_2: 'US',
    flag_uri: 'flag_lka.png'
  }
];

const getFlagByCountryISOCode = (countryISOCode = null) => {
  let flagArr = flags.filter((flag) => flag.iso_code_3 === countryISOCode || flag.iso_code_2 === countryISOCode);
  return (flagArr.length > 0) ? flagArr[0] : 'flag_ind.png';
};

module.exports = {
  getFlagByCountryISOCode
};
