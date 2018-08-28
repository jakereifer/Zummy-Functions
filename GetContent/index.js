const { getCollection, toArray, imageUrl, getToday, getDate } = require('../common.js');

module.exports = async (context) => {
    //try {
        const today = getToday();
        //if there is no date given in the url path
        if (!context.bindingData.day) {
            date = today;
            //find the content and the previous date (if applicable)
            let docs = await findDateAndPrev(date, context.req.headers);
            
            if (docs.length === 0)
                throw new Error("No record available");
            
            docs[0].image = imageUrl + docs[0].image;
            context.res = {
                headers: { 'Content-Type': 'application/json' },
                body: {
                    ... docs[0],
                    prev: docs.length > 1 ? docs[1].date : undefined,
                }
            }
        } else {
            let date = getDate(context.bindingData.day);
            
            if (date == undefined)
                throw new Error("Not a valid date.")
            //throw error if date provided is in the future
            if (date > today)
                throw new Error("This content is not yet visible!");
            //find the content and the previous date (if applicable)
            let docs = await findDateAndPrev(date, context.req.headers);
            //if there is no post by that date, throw error
            if (docs.length === 0 || docs[0].date != `${date}`)
                throw new Error("No record available");

            docs[0].image = imageUrl + docs[0].image;
            context.res = {
                headers: { 'Content-Type': 'application/json' },
                body: {
                    ... docs[0],
                    prev: docs.length > 1 ? docs[1].date : undefined,
                    next: (await findNext(docs[0].date, context.req.headers)) || undefined,
                }
            }
            
        }
    // } catch (error) {
    //     console.log(error);
    //     context.res = { status: 404, body: error.toString() };
    // }
};

//Returns the documents at the given date as well as the previous document (if applicable)
async function findDateAndPrev(date, headers) {
    return await toArray(
        (await getCollection(headers))
            .find({ 'date': { $lte : date }} )
            .project({date:1, title:1, post:1, image:1, author:1, "_id":0})
            .sort({ 'date': -1 })
            .limit(2)
    );
}

//Returns the date of the next post if applicable
async function findNext(date, headers) {
    const next = await toArray((await getCollection(headers))
        .find({ date: { $gt : getDate(date) }})
        .sort({ date : 1 })
        .limit(1)
    );;
    return next.length == 0 || next[0].date >= getToday() ? null : next[0].date;
}