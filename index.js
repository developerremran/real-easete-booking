const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

// middleware 
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json())



// >>>>>>>>>>>>>>>
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qzdg3rp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// set jwt.verify jwt middleware 
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    console.log(authorization);

    if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    // bearer token
    const token = authorization.split(' ')[1]
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .send({ error: true, message: 'unauthorized access' })
      }
      req.decoded = decoded
      next()
    })
  }

async function run() {
    try {




        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const userDataCollection = client.db('userDataCollection').collection('userDataCollection');
        const RoomDataCollection = client.db('userDataCollection').collection('RoomDataCollection');
        const BookingDataCollection = client.db('userDataCollection').collection('BookingDataCollection');
        //  jwt token convert 

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn:'1h',
            }) 
            console.log(token);
            res.send({ token })
        })



        // userset by the update or upsert 

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userDataCollection.updateOne(query, updateDoc, options)
            res.send(result)

        })

        // get role users 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await userDataCollection.findOne(query)
            console.log(result)
            res.send(result)
        })

        // room add 
        // all rooms get 
        app.get('/rooms', async (req, res) => {
            const result = await RoomDataCollection.find().toArray()
            res.send(result)
        })
        // Get a single room
        app.get('/room/:id',  async (req, res) => {
            const id = req.params.id
           
            const filter = { _id: new ObjectId(id) }
            const result = await RoomDataCollection.findOne(filter)
            console.log(result)
            res.send(result)
        })

        //   room add server 
        app.post('/rooms', async (req, res) => {
            const room = req.body
            const result = await RoomDataCollection.insertOne(room)
            res.send(result)
        })

        // update room booking status
        app.patch('/rooms/status/:id', async (req, res) => {
            const id = req.params.id
            const status = req.body.status
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    booked: status,
                },
            }
            const update = await BookingDataCollection.updateOne(query, updateDoc)
            res.send(update)
        })
        // booking data info all 
        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const result = await BookingDataCollection.insertOne(booking)
            res.send(result)
        })

        // delete a booking

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await BookingDataCollection.deleteOne(query)
            res.send(result)
        })
        // Get bookings for guest
        app.get('/bookings', async (req, res) => {
            const email = req.query.email

            if (!email) {
                res.send([])
            }
            const query = { 'guest.email': email }
            const result = await BookingDataCollection.find(query).toArray()
            res.send(result)
        })













        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// >>>>>>>>>>>>>>>




app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})