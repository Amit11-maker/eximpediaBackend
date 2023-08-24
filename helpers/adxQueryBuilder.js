// @ts-check
const FIELD_TYPE_WORDS_EXACT_TEXT_MATCH = 200;
const FIELD_TYPE_IN_MATCH = 102;
const FIELD_TYPE_RANGE_MIN_MAX_MATCH = 103;

const KQLMatchExpressionQueryBuilder = (matchExpression) => {
    let matchExpressionKQLQuery = ""
    if (matchExpression?.expressionType === FIELD_TYPE_WORDS_EXACT_TEXT_MATCH) {
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
    } else if (matchExpression?.expressionType === FIELD_TYPE_RANGE_MIN_MAX_MATCH) {
        if (matchExpression?.fieldValueArr && matchExpression?.fieldValueArr.length > 0) {
            matchExpression?.fieldValueArr?.forEach((fieldValue, arrIndex) => {
                if (typeof fieldValue.fieldValueRight === "number" && typeof fieldValue.fieldValueLeft === "number") {
                    matchExpressionKQLQuery += matchExpression.fieldTerm +
                        " between ( " +
                        fieldValue.fieldValueLeft +
                        " .. " +
                        fieldValue.fieldValueRight +
                        " ) ";

                    if (arrIndex > matchExpression.fieldValueArr.length - 1) {
                        matchExpressionKQLQuery += " and "
                    }
                }
            })
        }
    } else if (matchExpression?.expressionType === FIELD_TYPE_IN_MATCH) {
        matchExpressionKQLQuery += "";
        matchExpression?.fieldValue?.forEach((fieldValue, fieldIndex) => {
            if (fieldIndex === 0) {
                matchExpressionKQLQuery += matchExpression.fieldTerm + " in("
            }
            matchExpressionKQLQuery += `'${fieldValue}' ${fieldIndex < matchExpression?.fieldValue?.length - 1 ? "," : ""}`

            // close in query at the end of the loop
            if (fieldIndex === matchExpression?.fieldValue?.length - 1) {
                matchExpressionKQLQuery += " )"
            }
        });

    }
    return matchExpressionKQLQuery;
}

module.exports = { KQLMatchExpressionQueryBuilder }