const { getCollection, getAuthData, findData, checkAuthorization, dateExists, imageUrl } = require('../common.js');
const azure = require('azure-storage');
const blobService = azure.createBlobService();

module.exports = async function (context, req) {
    try {
        const auth = await getAuthData(context.req.headers);
        const date = context.bindingData.day;
        if (!(auth.isOwner || auth.isContributor))
            throw new Error("You are not authorized to delete this content!");
        if (!await dateExists(date, context.req.headers))
            throw new Error("Date does not exist in database");
        if (!(await checkAuthorization(date, auth, context.req.headers)))
            throw new Error('You are not authorized to delete this content!');
        const record = await findData(date, context.req.headers);
        await deleteData(date, context.req.headers);
        await deleteImageBlob(record[0].image, context.req.headers);
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

/*
const deleteImageBlob = async (name, headers) => {
    container = headers.container ? headers.container : 'strips';
    blobService.deleteBlob(container, name, (error, response) => {
        if (error) throw new Error("Could not delete image!") 
    })
}
*/
const deleteImageBlob = (name, headers) => new Promise((resolve, reject) => {
    container = headers.container ? headers.container : 'strips';
    blobService.deleteBlob(container, name, (error, response) => {
        if (error) 
            reject(error); 
        else 
            resolve(response); 
    })
})


//deletes a document in the database with a given date
const deleteData = async (date, headers) => {
    (await getCollection(headers))
        .deleteOne({ date: date } , (err, obj) => {
            if (err) throw new Error("Cannot delete data!");
        });
};