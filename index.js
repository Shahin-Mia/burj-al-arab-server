const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const admin = require('firebase-admin');

require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nt3jq.mongodb.net/burj-al-arab-db?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const serviceAccount = require("./burj-al-arab5-firebase-adminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});


app.use(cors());
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(4000, () => {
    console.log(`app listening to 4000 port`)
})



client.connect(err => {
    const collection = client.db("burj-al-arab-db").collection("bookings");
    console.log("DB connected successfully")

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(" ")[1];
            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    let tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {
                        collection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.send(documents)
                            })
                    }
                    else {
                        res.status(401).send('Unauthorized Access')
                    }
                }).catch(function (error) {
                    res.status(401).send('Unauthorized Access')
                });
        }
        else {
            res.status(401).send('Unauthorized Access')
        }
    })


});
