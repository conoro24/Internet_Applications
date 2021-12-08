/*
    Author: Conor O'Neill - 18300645

    Much of the code used for create, query and delete table was taken from:
    https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.NodeJs.html

    I took it further by implementing async funcitons within my code and used await to make
    my api calls.
*/

const express = require('express');
const AWS = require("aws-sdk");
const cors = require("cors")
const AWS_ACCESS_KEY = ""
const AWS_SECRET_KEY = ""
const BUCKET = "csu44000assignment220"
const FILE_LOCATION = "moviedata.json"
const BUCKET_PARAMS = {
    Bucket: BUCKET,
    Key: FILE_LOCATION,
}
const TABLE_PARAMS = {
    TableName : "Movies",
    KeySchema: [       
        { AttributeName: "year", KeyType: "HASH"},  //Partition key
        { AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
        { AttributeName: "year", AttributeType: "N" },
        { AttributeName: "title", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
    }
};

const app = express();
app.use(cors({
    origin: "*",
}))
app.use(express.static('public'));

AWS.config.update({
  region: "eu-west-1",
    credentials: {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY
    }
});

var dynamodb = new AWS.DynamoDB();

app.post('/api/create-database', async function (req, res) {

    var s3_bucket = new AWS.S3()
    const movie_data = await s3_bucket.getObject(BUCKET_PARAMS).promise()
    var allMovies = JSON.parse(movie_data.Body)

    dynamodb.createTable(TABLE_PARAMS, function (err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            var docClient = new AWS.DynamoDB.DocumentClient();
            allMovies.forEach(function (movie) {
                var params = {
                    TableName: "Movies",
                    Item: {
                        "year": movie.year,
                        "title": movie.title,
                        "rating": movie.info.rating
                    }
                };
                docClient.put(params, function (err, data) {
                    if (err) {
                        console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
                    } else {
                        console.log("PutItem succeeded:", movie.title);
                    }
                });
            });
            return res.status(200).send("Created table and populated.")
        }
    });
})
app.get('/api/get-movies/:movie/:year/:rating', async function (req, res) {
    
    var title = req.params.movie
    let year = req.params.year
    let rating = req.params.rating
    var params = {
        TableName: "Movies",
        KeyConditionExpression: "#yr = :yyyy", 
        ExpressionAttributeNames:{
            "#yr": "year"
        },
        ExpressionAttributeValues: {
            ":yyyy": parseInt(year)
        }
    };
    var docClient = new AWS.DynamoDB.DocumentClient();
    docClient.query(params, function(err, data) {
    if (err) {
        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        data.Items.forEach(function(item) {
            console.log(" -", item.year + ": " + item.title + " - " + item.rating);
        });
        var ourMovies = data.Items.filter((e) => {
            return (e.rating >= rating && e.title.toLowerCase().includes(title.toLowerCase()))
        })
        res.send(ourMovies)
    }
    });
})
app.post('/api/delete-database', async function (req, res) {

    let params = {
        TableName: "Movies"
    };
    
    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to destroy table. Error JSON:", JSON.stringify(err, null, 2));
            return res.status(400).json(err)
        } else {
            console.log("Table Destroyed");
            return res.status(200).send('Table Destroyed');
        }
    });
})


app.listen(8000,() => console.log("app listening on port 8000"))