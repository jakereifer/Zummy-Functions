# Zummy CMS


## Function APIs

The Zummy CMS uses the following Azure functions: GetContent, ListContent, CreateContent, EditContent, and DeleteContent.


### GetContent

In order to receive a particular date's content, use the GetContent API.

*Endpoint: GET https://zummyfunctions.azurewebsites.net/api/GetContent/{day?}*

**day**: the particular date you are querying data for (yyyy-mm-dd). If *day* is left empty, this function will query for the record of the most recently posted content.  

**Response:** A typical response will return information on the particular day's content as well as the date of the previous or next date's content if applicable (future content is hidden so the *next* pointer will not appear if the following post is scheduled for a future date).

```
{
    "date": "2018-08-23",
    "title": "My First Post",
    "post": "This is my first post!",
    "image": "https://billandjakestorage.blob.core.windows.net/strips/2018-08-23.jpeg",
    "author": "Jake Reifer"
    "next": "2018-08-24",
    "prev": "2018-08-22"
}
```

**Possible reasons for 404 (Page not found) Errors:** 
- if the *day* provided is not a valid date or in the correct format (yyyy-mm-dd)
- if the *day* provided is a future date (future content is hidden)
- if there is no public content scheduled for the provided *day*

### ListContent

Inorder to receive a feed of a particular contributor's content, or a feed of all contributors' content (as an owner), use the ListContent API.

*Endpoint: GET https://zummyfunctions.azurewebsites.net/api/ListContent*

**Authorization:** currently, authorization is mocked as a stringified object in the header of the request. The *uid* field is used to match contributors to their contributions. The *isowner* and *iscontributor* flags are used to whether the current request is from either a contributor or an owner. 

```
{ "name": "Jake Reifer", "uid": "t-jareif@microsoft.com", "isowner": "false", "iscontributor": "true" }
```

**Response:** A typical response will return an array of the given contributor's content or all content if the request is made by an owner:

```
[
    {
        "date": "2018-08-23",
        "title": "My First Post",
        "post": "This is my first post!",
        "image": "2018-08-23.jpeg",
        "author": "Jake Reifer"
    },
    {
        "date": "2018-08-24",
        "title": "My Second Post",
        "post": "This is my second post!",
        "image": "2018-08-24.jpeg",
        "author": "Jake Reifer"
    },
    {
        "date": "2018-08-25",
        "title": "My Third Post",
        "post": "This is my third post!",
        "image": "2018-08-25.jpeg",
        "author": "Jake Reifer"
    }
]
```

**Possible reasons for 401 (Unauthorized) Errors:**
- if the mocked authorization header is missing

### CreateContent

Inorder to contribute content use the CreateContent API.

*Endpoint: POST https://zummyfunctions.azurewebsites.net/api/CreateContent*

**Headers:**
- Authorization: authorization is mocked as a stringified object in the header of the request like the example in the *ListContent* section. The *uid* field is used to match contributors to their contributions. The *isowner* and *iscontributor* flags are used to whether the current request is from either a contributor or an owner. 
- Content-Type: must be multipart/form-data since an image upload is taking place

**Body of Request:**
- author: friendly name of the contributor
- image: image file
- title: title of the post
- post: the blog post that will accompany the image
- db (optional): if you want to specify the database to store the record (in case of unit testing). Default is the "Zummy" database in the "Zummy" CosmosDB 
- collection (optional): if you want to specify the collection to store the record (in case of unit testing). Default is the "dailyPost" collection in the "Zummy" database in the "Zummy" CosmosDB. 
- container (optional): if you want to specify the container to store the image (in case of unit testing). Default is the "strips" container in the "billandjakestorage" Azure storage account. 


**Response:** A valid response will contain the scheduled date of the uploaded content. 

```
{
    "date": "2018-08-26"
}
```

**Possible reasons for 500 (Internal Server Error) Errors:**
- if the mocked authorization header is missing 
- if the user is neither an owner or contributor
- if there is no body of the request
- if all the required fields are not given in the body of the request

### UpdateContent

Inorder to edit content use the EditContent API.

*Endpoint: PUT https://zummyfunctions.azurewebsites.net/api/UpdateContent/{day}*

**day**: the particular date you are querying data for (yyyy-mm-dd).

**Headers:**
- Authorization: authorization is mocked as a stringified object in the header of the request like the example in the *ListContent* section. The *uid* field is used to match contributors to their contributions. The *isowner* and *iscontributor* flags are used to whether the current request is from either a contributor or an owner. 
- Content-Type: must be multipart/form-data since an image upload is taking place

**Body of Request:**
- author: friendly name of the contributor
- image: image file
- title: title of the post
- post: the blog post that will accompany the image
- db (optional): if you want to specify the database to store the record (in case of unit testing). Default is the "Zummy" database in the "Zummy" CosmosDB 
- collection (optional): if you want to specify the collection to store the record (in case of unit testing). Default is the "dailyPost" collection in the "Zummy" database in the "Zummy" CosmosDB. 
- container (optional): if you want to specify the container to store the image (in case of unit testing). Default is the "strips" container in the "billandjakestorage" Azure storage account. 


**Response:** A valid response will have 200 Status.


**Possible reasons for 500 (Internal Server Error) Errors:**
- if the *day* provided is not a valid date or in the correct format (yyyy-mm-dd)
- if the user is unauthorized to edit the specific day's content
- if the mocked authorization header is missing
- if the user is neither an owner or contributor
- if there is no body of the request
- if all the required fields are not given in the body of the request


### DeleteContent

Inorder to edit content use the CreateContent API.

*Endpoint: DELETE https://zummyfunctions.azurewebsites.net/api/DeleteContent/{day}*

**day**: the particular date you are querying data for (yyyy-mm-dd).

**Headers:**
- Authorization: authorization is mocked as a stringified object in the header of the request like the example in the *ListContent* section. The *uid* field is used to match contributors to their contributions. The *isowner* and *iscontributor* flags are used to whether the current request is from either a contributor or an owner. 
- Content-Type: must be multipart/form-data since an image upload is taking place

**Response:** A valid response will have 200 Status

**Possible reasons for 500 (Internal Server Error) Errors:**
- if the *day* provided is not a valid date or in the correct format (yyyy-mm-dd)
- if the user is unauthorized to delete the specific day's content
- if the mocked authorization header is missing
- if the user is neither an owner or contributor








