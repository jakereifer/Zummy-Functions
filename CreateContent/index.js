const { getCollection, toArray, insertData, getToday, getNextDate, getAuthData, createRecord, checkData, parseForm } = require('../common.js');
const { getBoundary, Parse } = require('parse-multipart');

module.exports = async function (context, req) {
    try {
        const auth = await getAuthData(context.req.headers);
        if (!(auth.isOwner || auth.isContributor))
            throw new Error("You are not authorized to add this content!")
        if (!req.body)
            throw new Error("No body of request");
        const parts = parseForm(context.req);
        const chosenDate = await findFirstOpenDate(req.headers);
        let record = await createRecord(parts, context.req.headers, chosenDate, auth);
        await insertData(record, context.req.headers);
        context.res = {
            status: 200,
            body: {
                "date": record.date,
            }
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: error.toString(),
        };
    }
};

//Finds the first open date in the future in order to schedule new content
async function findFirstOpenDate(headers) {
    const dates = await toArray(
        (await getCollection(headers))
            .find({ date: { $gte: getToday() } })
            .sort({ date: -1 })
            .limit(1)
    );
    if (dates.length != 0) {
        return getNextDate(dates[0].date);
    } else {
        return getToday();
    }
    
}




