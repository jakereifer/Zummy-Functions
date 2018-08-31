const { getCollection, toArray, getAuthData, getImageUrl } = require('../common.js');

module.exports = async (context, req) => {
    try {
        let docs;
        //get authorization data
        const auth = await getAuthData(context.req.headers);
        if (auth.isOwner) {
            docs = await findAllContent(context.req.headers);
        } else if (auth.isContributor) {
            docs = await findAllContent(context.req.headers, auth.uid);
        } else {
            throw new Error("You are not authorized to access this content");
        } 
        for (let i in docs) {
            if (docs[i].image) {
                docs[i].image = getImageUrl(docs[i].image);
            }
        }
        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: docs,
        }
    } catch (error) {
        context.res = {
            status: 401,
            body: error.toString(),
        };
    }
};

//Returns all content by a given author or all content if the call is made from an owner
const findAllContent = async (headers, author) => {
    if (author) 
        return await toArray((await getCollection(headers))
            .find({ "uid": author })
            .project({ date: 1, title: 1, post: 1, image: 1, author: 1, "uid":1, "_id": 0 })
            .sort({ date: 1 })
        );
    else 
        return await toArray((await getCollection(headers))
            .find({})
            .project({ date: 1, title: 1, post: 1, image: 1, author: 1, "uid":1, "_id": 0 })
            .sort({ date: 1 })
        );
}