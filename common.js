const { MongoClient } = require('mongodb');
const { promisify } = require('util');
const { getBoundary, Parse } = require('parse-multipart');
const azure = require('azure-storage');
const blobService = azure.createBlobService(process.env.AZURE_STORAGE_CONNECTION_STRING);
const getStream = require('into-stream');
const uri = process.env.COSMOS_DB_CONNECTION_STRING;
const db = 'zummy';
const collection = 'dailyPosts';
const imageUrl = "https://billandjakestorage.blob.core.windows.net/strips/"
const connect = promisify(MongoClient.connect);

//Returns and caches the mongo client
const getClient = async function (uri) {
    if (!this.cachedClient)
        this.cachedClient = await connect(uri);

    return this.cachedClient;
}

//Gets the proper collection based on the header of the request
const getCollection = async (headers) => {
    return (await getClient(uri))
        .db(headers.db ? headers.db : db)
        .collection(headers.collection ? headers.collection : collection
        )
    };

//Inserts the data into the correct database/collection
const insertData = async (data, headers) => {
    (await getCollection(headers)).insertMany([data]);
};

//Used to return an array of results from a mongo query (promisified version of the toArray mongo function)
const toArray = (results) => new Promise((resolve, reject) => {
    results
        .toArray((error, docs) => {
            if (error)
                reject(error);
            else  
                resolve(docs);
        });
});

//Parses the header and returns authorization information
async function getAuthData(headers) {
    if (!headers.authorization) {
        return {
            isOwner: false,
            isContributor: false
        };
    } else {
        let parsedAuth = JSON.parse(headers.authorization);
        let record = {
            name: parsedAuth.name,
            uid: parsedAuth.uid,
            isOwner: parsedAuth.isowner == true,
            isContributor: parsedAuth.iscontributor == true
        }
        return record;
    }
}

//Returns todays date (PT) as a string (yyyy-mm-dd)
const getToday = () => {
    const today = new Date().toLocaleDateString("en-CA",
    {
        timeZone: 'America/Los_Angeles'
    });
    return getString(today);
}

//Returns the given date as a string (yyyy-mm-dd)
const getDate = (date) => {
    date = new Date(date);
    if (isNaN(Date.parse(date))) {
        return undefined;
    }
    console.log(Date.parse(date));
    date = date.toLocaleDateString("en-CA",
        {
            timeZone: 'Europe/London'
        }
    );
    return getString(date);
}

//Returns the next date of the provided date in string format (yyyy-mm-dd)
const getNextDate = (date) => {
    let today = new Date(date);
    today = today.setDate(today.getDate() + 1);
    today = new Date(today).toLocaleDateString("en-CA",
        {
            timeZone: 'Europe/London'
        }
    );
    return getString(today); 
}

//Properly stringifies a given date from m/d/y to yyyy-mm-dd
const getString = (date) => {
    const mdy = date.split('/');
    const mm = mdy[0];
    const yyyy = mdy[2];
    const dd = mdy[1];
    return  yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
}

//Queries the proper mongo db for a specific date's document
const findData = async (date, headers) => {
    return await toArray(
        (await getCollection(headers))
            .find({date:date})
            .project({date:1, title:1, post:1, image:1, author:1, "uid":1, "_id":0})
            .sort({ 'date': -1 })            
    );
}

//Tests whether the given field is a proper field
function isProperField(name) {
    if (name === 'title' || name === 'author' || name === 'post') {
        return true;
    }
    return false;
}

//creates record from the parsed rawbody data and the chosen date 
async function createRecord(info, headers, date, auth) {
    let record = {};
    if (date) {
        record.date = date;
    }
    for (let i = 0; i < info.length; i++ ) {
        if (info[i].name) {
            if (isProperField(info[i].name)) {
                record[`${info[i].name}`] = info[i].data;
            }            
        }
        else {
            let contentType = info[i].type;
            record.image = date + `.${contentType.split('/')[1]}`
            console.log("Found image \"" + info[i].filename + "\" and adding to blob storage!");
            AddBlob(info[i].data, date, contentType, headers);
            console.log("Finished adding image to blob storage!");
        }
    }
    if (auth)
        record.uid = auth.uid;
    if (!checkData(record))
        throw new Error('Not all required fields given!');
    return record;
}

//Adds a blob to the proper blob storage container 
function AddBlob(image,date, contenttype, headers){
    let stream = getStream(image);
    let streamLength = image.length;
    //name of file?
    let container = headers.container ? headers.container : 'strips';
    blobService.createBlockBlobFromStream(container, date + `.${contenttype.split('/')[1]}`, stream, streamLength, { contentSettings: { contentType: contenttype } }, function(error,response){
        if (!error) {
            console.log("response: ", response);
        }
        else {
            throw new Error(error);
        }
    })
}

//Validates the data to see if all proper fields are in
function checkData(data) {
    // if (!(data.date && data.image && data.title && data.post && data.author)){
    //     return false;
    // }
    return true;
}

//Checks to see if the given admin has access to a specific day's content
const checkAuthorization = async (date, auth, headers) => {
    const data = await findData(date, headers);
    contentuid = data[0].uid;
    let result = contentuid === auth.uid || auth.isOwner;
    return result;        
}

//Checks to see if there is any content at a given date
const dateExists = async (date, headers) => {
    const data = await findData(date, headers);
    if (data.length == 0)
        return false;
    return true;
}

const submitForm = async (form, headers, host, path) => new Promise((resolve, reject) => {
    form.submit({ host: host, path: path, headers: headers }, (error, result) => {
        if (error) {
            reject(error);
        } else { 
            resolve(result);
        }
    } ) 
});


const parseForm = (req) => {
    const boundary = getBoundary(req.headers["content-type"]);
    return Parse(req.body, boundary);
}

module.exports = {
    uri, db, collection, connect, getClient, getCollection, toArray, insertData, imageUrl, getAuthData, getToday, getDate, getNextDate, findData, createRecord, checkData, dateExists, checkAuthorization, submitForm, parseForm
}

