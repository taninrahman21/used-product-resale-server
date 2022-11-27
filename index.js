const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_pass}@cluster0.flsgo3q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
  try{
      const usersCollection = client.db('becheDaw').collection('users');
      const productsCollections = client.db('becheDaw').collection('products');
      const bookedProductCollections = client.db('becheDaw').collection('bookProducts');
      
      app.post('/users', async(req, res) => {
        const user = req.body;
        const userEmail = user.email;
        const query = { email: userEmail}
        const savedUser = await usersCollection.findOne(query);
        if(savedUser){
          return res.send({message: "Already added user"});
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      })

      // Get all buyers
        app.get('/users/allbuyers', async (req, res) => {
          const query = { role: 'Buyer' }
          const users = await usersCollection.find(query).toArray();
          res.send(users);
      })
      // Get a user
        app.get('/users/verify/:email', async (req, res) => {
          const email = req.params.email;
          const query = { email }
          const user = await usersCollection.findOne(query);
          res.send(user);
      })

        app.delete('/users/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id)}
          const user = await usersCollection.deleteOne(query);
          res.send(user);
      })

      // Get all sellers
        app.get('/users/allsellers', async (req, res) => {
          const query = { role: 'Seller' }
          const users = await usersCollection.find(query).toArray();
          res.send(users);
      })


    // Get User role and check isvarified
      app.get('/users/userrole/:email', async (req, res) => {
        const email = req.params.email;
        const query = { email }
        const user = await usersCollection.findOne(query);
        res.send({ userRole: user?.role });
    })

    // Get all products by category
      app.get('/products', async(req, res) => {
        let query = {};
        if(req.query.category){
          query = {brand: req.query.category};
        }
        const products = await productsCollections.find(query).toArray();
        
        // products.forEach(async(product) => {
        //   const email = product?.sellerEmail;
        //   const query = { email }
        //   const user = await usersCollection.findOne(query);
        //   if(user?.verified){
        //     product.userVerification = user?.verified;
        //     console.log(product);
        //   }
        // })

        res.send(products);
      })

      // Add products
      app.post('/products', async(req, res) => {
        let product = req.body;
        const result = await productsCollections.insertOne(product);
        res.send(result);
      })

      // Update Product
      app.patch('/products/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const updateDoc = {
          $set: { isAdvertised: true }
        }
        const result = await productsCollections.updateOne(filter, updateDoc);
        res.send(result);
      })

      // Update if product is reported
      app.patch('/products/reported/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const updateDoc = {
          $set: { isReported: true }
        }
        const result = await productsCollections.updateOne(filter, updateDoc);
        res.send(result);
      })

      // Delete Product
      app.delete('/products/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const result = await productsCollections.deleteOne(filter);
        res.send(result);
      })
     
      // Post user booked products
      app.post('/bookedproducts', async(req, res) => {
        const product = req.body;
        const query = {productId: product.productId, userEmail: product.userEmail};
        const bookedProduct = await bookedProductCollections.findOne(query);
        if(bookedProduct){
          return res.send({message: "You've already booked this product."});
        }
        const result = await bookedProductCollections.insertOne(product);
        res.send(result);
      })

      // Get buyer booked products
      app.get('/myorders', async(req, res) => {
        let query = {};
        if(req.query.email){
          query ={ userEmail: req.query.email};
        }
        const orders = await bookedProductCollections.find(query).toArray();
        res.send(orders);
      })

      // Get seller added products
      app.get('/myproducts', async(req, res) => {
        let query = {};
        if(req.query.email){
          query ={ sellerEmail:  req.query.email};
        }
        const products = await productsCollections.find(query).toArray();
        res.send(products);
      })

      // Get all advertised Products
      app.get('/advertisedProducts', async(req, res) => {
        const query = { isAdvertised: true };
        const products = await productsCollections.find(query).toArray();
        res.send(products);
      })

      // Varify a user
      app.patch('/users/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const updateDoc = {
          $set: { verified: true }
        }
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
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