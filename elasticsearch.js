const dotenv = require('dotenv').config()
const AWS = require('aws-sdk')
const { Client } = require('@elastic/elasticsearch');
const createAwsElasticsearchConnector = require('aws-elasticsearch-connector');
AWS.config.loadFromPath('./config/aws/aws-access-config.json');

const Config = require('./config/dbConfig').dbElasticsearch;

const ElasticsearchDbHandler = require("./db/elasticsearchDbHandler");

const elasticsearch = async () => {
    const dbClient = new Client({
        ...createAwsElasticsearchConnector(AWS.config),
        node: Config.connection_url
    });



    for (let year = 17; year < 23; year++) {
        for (let month = 1; month < 13; month++) {
            let date1 = `20${year}-${month.toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            })}-01T00:00:00.000Z`
            let date2 = `20${year}-${month.toLocaleString('en-US', {
                minimumIntegerDigits: 2,
                useGrouping: false
            })}-31T00:00:00.000Z`
            try {
                let result = await dbClient.updateByQuery({
                    index: "india_import",
                    refresh: true,
                    track_total_hits: true,
                    body: {
                        "script": {
                            "source": `ctx._source.DECLARATION_NO = '${year}${month.toLocaleString('en-US', {
                                minimumIntegerDigits: 2,
                                useGrouping: false
                            })}'+String.valueOf(ctx._source.BE_NO).replace('0','X').replace('1', 'A').replace('2', 'B').replace('3', 'C').replace('4', 'D').replace('5', 'E').replace('6', 'F').replace('7', 'G').replace('8', 'H').replace('9', 'I');`,
                            "lang": "painless"
                        },
                        "query": {
                            "bool": {
                                "must": [
                                    {
                                        "range": {
                                            "IMP_DATE": {
                                                "gte": `${date1}`,
                                                "lt": `${date2}`
                                            }
                                        }
                                    }
                                ],
                                "should": [],
                                "filter": []
                            }
                        }
                    }
                });
                console.log(result);
            } catch (err) {
                console.log("*********************************************");
                console.log(date1, date2);
                console.log(err);
                let refresh = await dbClient.index({
                    index: "india_import",
                    refresh: true,
                    body:{ "query": {"match_all":{}}}
                })
                console.log(refresh);
                console.log("*********************************************");
            }
            console.log("11111");

        }
    }


}

elasticsearch()


