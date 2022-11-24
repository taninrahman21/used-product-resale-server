const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_pass}@cluster0.flsgo3q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
      const userCollections = client.db('becheDaw').collection('users');
      
      app.post('/users', async(req, res) => {
        const user = req.body;
        const result = await userCollections.insertOne(user);
        console.log(result);
      })
  }
  finally{

  }
}
run().catch(console.log);

app.get('/', (req, res) => {
  res.send('Beche Daw is running succesfully!')
})

app.listen(port, () => {
  console.log(`Beche Daw is listening on port: ${port}`);
})