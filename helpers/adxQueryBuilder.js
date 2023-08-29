// @ts-check
const FIELD_TYPE_WORDS_EXACT_TEXT_MATCH = 200;
const FIELD_TYPE_IN_MATCH = 102;
const FIELD_TYPE_RANGE_MIN_MAX_MATCH = 103;
const FIELD_TYPE_EXACT_TEXT_MATCH = 206;

const KQLMatchExpressionQueryBuilder = (matchExpression) => {
    let matchExpressionKQLQuery = ""
    switch (matchExpression?.expressionType) {
        case FIELD_TYPE_WORDS_EXACT_TEXT_MATCH: {
            if (matchExpression?.fieldValue && matchExpression?.fieldValue?.length > 0) {
                matchExpression?.fieldValue.forEach((value, fieldValueIndex) => {
                    if (fieldValueIndex == 0) {
                        matchExpressionKQLQuery += matchExpression.fieldTerm + " in( "
                    }
                    matchExpressionKQLQuery += `'${value}'`
                    if (fieldValueIndex < matchExpression.fieldValue.length - 1) {
                        matchExpressionKQLQuery += ", "
                    }
                    if (fieldValueIndex === matchExpression.fieldValue.length - 1) {
                        matchExpressionKQLQuery += ")"
                    }
                })
            }
            break;
        }
        case FIELD_TYPE_RANGE_MIN_MAX_MATCH: {
            if (matchExpression?.fieldValueArr && matchExpression?.fieldValueArr.length > 0) {
                matchExpression?.fieldValueArr?.forEach((fieldValue, arrIndex) => {
                    if (matchExpression.fieldTerm === "HS_CODE") {
                        matchExpressionKQLQuery += "tolong(" + matchExpression.fieldTerm + ")" +
                            " between ( tolong('" +
                            fieldValue.fieldValueLeft +
                            "') .. tolong('" +
                            fieldValue.fieldValueRight +
                            "') ) ";

                        if (arrIndex < matchExpression.fieldValueArr.length - 1) {
                            matchExpressionKQLQuery += " and "
                        }
                    } else {
                        matchExpressionKQLQuery += matchExpression.fieldTerm +
                            " between " +
                            fieldValue.fieldValueLeft +
                            " .. " +
                            fieldValue.fieldValueRight +
                            " ";

                        if (arrIndex < matchExpression.fieldValueArr.length - 1) {
                            matchExpressionKQLQuery += " and "
                        }
                    }
                })
            }
            break;
        }
        case FIELD_TYPE_IN_MATCH: {
            matchExpressionKQLQuery += "";
            matchExpression?.fieldValue?.forEach((fieldValue, fieldIndex) => {
                if (fieldIndex === 0) {
                    matchExpressionKQLQuery += matchExpression.fieldTerm + " in("
                }
                matchExpressionKQLQuery += `'${fieldValue}' ${fieldIndex < matchExpression?.fieldValue?.length - 1 ? "," : ""}`
                // close in query at the end of the loop
                if (fieldIndex === matchExpression?.fieldValue?.length - 1) {
                    matchExpressionKQLQuery += ")"
                }
            });
            break;
        }
        case FIELD_TYPE_EXACT_TEXT_MATCH: {
            matchExpressionKQLQuery += "";
            matchExpression?.fieldValue?.forEach((fieldValue, fieldIndex) => {
                if (fieldIndex === 0) {
                    matchExpressionKQLQuery += matchExpression.fieldTerm + " in("
                }
                matchExpressionKQLQuery += `'${fieldValue}' ${fieldIndex < matchExpression?.fieldValue?.length - 1 ? "," : ""}`
                // close in query at the end of the loop
                if (fieldIndex === matchExpression?.fieldValue?.length - 1) {
                    matchExpressionKQLQuery += ")"
                }
            });
            break;
        }
    }
    return matchExpressionKQLQuery;
}

module.exports = { KQLMatchExpressionQueryBuilder }