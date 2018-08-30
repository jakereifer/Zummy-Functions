const { getCollection, getAuthData, createRecord, checkData, dateExists, checkAuthorization, parseForm } = require('../common.js');
const { getBoundary, Parse } = require('parse-multipart');

module.exports = async (context, req) => {
    try {
        const auth = await getAuthData(context.req.headers);
        const date = context.bindingData.day;
        if (!(auth.isOwner || auth.isContributor))
            throw new Error("You are not authorized to edit this content!")
        if (!req.body)
            throw new Error("No body of request");
        if (!await dateExists(date, context.req.headers))
            throw new Error("Date does not exist in database");
        const parts = parseForm(context.req);
        let record = await createRecord(parts, context.req.headers, date, auth);
        if (!(await checkAuthorization(record.date, auth, context.req.headers)))
            throw new Error('You are not authorized to edit this content!');
        await updateData(record, context.req.headers);
        context.res = {
            status: 200,
        }
    } catch (error) {
        context.res = {
            status: 500,
            body: error.toString(),
        };
    }
};

//Edits a document in the database with a particular date
const updateData = async (data, headers) => {
    (await getCollection(headers))
        .update({ date: data.date }, {$set: data});
};