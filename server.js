/* PROGRESS
    all connections tested
    snippets for mongoose schema and CRUD ops added
    routes pending
*/

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { response } = require('express');

let app = express();

// middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// express server
app.listen(6969);

// mongoDB Atlas connection
mongoose.connect(process.env.ATLAS_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(console.log('MongoDB Atlas connected'))
    .catch((error) => { console.log('MongoDB Atlas failed to connect') })

// creating user schema
let smartBrainSchema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    count: {type: Number, default: 0},
  })
  
// creating user model
let smartBrainUser = mongoose.model("SBUser", smartBrainSchema);

// default route
app.get("/", (req, res) => {
    res.sendStatus(200);
});

// supporting functions
let createUserObject = (username) => {
    return userObject = {
        username: username,
        count: -1,
        isAuthenticated: false,
    }
}

// route to verify username
app.post("/userExists", (req, res) => {
    smartBrainUser.find({ username: req.body.username }, (error, data) => {
        res.send(JSON.stringify(data.length));
    });
});

// route used for login
app.post('/authenticate', (req, res) => {
    let userObject = createUserObject(req.body.username);
    smartBrainUser.find({ username: userObject.username }, async (error, data) => {
        if(data.length) {
            let passwordsMatch = await bcrypt.compare(req.body.password, data[0].password);
            if(passwordsMatch) {
                userObject.isAuthenticated = true;
                userObject.count = data[0].count;
            }
            res.send(JSON.stringify(userObject));
        }
        else res.send(JSON.stringify(userObject));
    });
});

// route for registering new user
app.post('/addUser', async (req, res) => {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    let temp = new smartBrainUser({
        username: req.body.username,
        password: hashedPassword,
        count: 0,
    })
    temp.save((error, data) => {
        if (!error) res.send(JSON.stringify({ regSuccess: true }));
        else res.send(JSON.stringify({ regSuccess: false }));
    })
})

let createRequestJSON = (link) => {
    const temp = JSON.stringify({
        "user_app_id": {
          "user_id": "clarifai",
          "app_id": "main"
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": link
                    }
                }
            }
        ]
      });
    return temp;
}

app.post('/analyseImage', async (req, res) => {
    let requestBody = createRequestJSON(req.body.link)
    let requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + process.env.CLARIFAI_API_KEY,
        },
        body: requestBody
    };
    let result = await fetch(`https://api.clarifai.com/v2/models/color-recognition/versions/dd9458324b4b45c2be1a7ba84d27cd04/outputs`, requestOptions)
    .then(response => response.json())
    .then(result => { return result })
    .catch(error => console.log('error', error));
    res.send(JSON.stringify(result.outputs[0].data));
})
