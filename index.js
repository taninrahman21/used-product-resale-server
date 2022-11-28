const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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

 // Verify JWT
 function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
      return res.status(401).send("Unauthorized Access");
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
      if (err) {
          return res.status(403).send({ message: 'forbidden access' })
      }
      req.decoded = decoded;
      next();
  })
}



async function run(){
  try{
      const usersCollection = client.db('becheDaw').collection('users');
      const productsCollections = client.db('becheDaw').collection('products');
      const bookedProductCollections = client.db('becheDaw').collection('bookProducts');
      
     
      // Verify Buyer
      const verifyBuyer = async (req, res, next) => {
        const decodedEmail = req.decoded.userEmail;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);
        
        if (user?.role !== 'Buyer') {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        next();
    }
      // Verify Seller
      const verifySeller = async (req, res, next) => {
        const decodedEmail = req.decoded.userEmail;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);
        console.log(user)
        
        if (user?.role !== 'Seller') {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        next();
    }
      // Verify Admin
      const verifyAdmin = async (req, res, next) => {
        const decodedEmail = req.decoded.userEmail;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'Admin') {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        next();
    }

      // Post a user
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
        app.get('/users/allbuyers',verifyJWT, verifyAdmin, async (req, res) => {
          const query = { role: 'Buyer' }
          const users = await usersCollection.find(query).toArray();
          res.send(users);
      })
      // Get a seller
        app.get('/users/seller/:email', async (req, res) => {
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
        app.get('/users/allsellers', verifyJWT, verifyAdmin,  async (req, res) => { 
          const query = { role: 'Seller' }
          const users = await usersCollection.find(query).toArray();
          console.log(users);
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
        res.send(products);
      })

      // Add products
      app.post('/products', async(req, res) => {
        let product = req.body;
        const result = await productsCollections.insertOne(product);
        res.send(result);
      })

      // Update Product
      app.patch('/products/:id',verifyJWT, verifySeller, async(req, res) => {
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

      // Delete BookedProduct
      app.delete('/bookproducts/:id', async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const result = await bookedProductCollections.deleteOne(filter);
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
      app.get('/myorders', verifyJWT, verifyBuyer, async(req, res) => {
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

      // Get all reported Products
      app.get('/reportedProducts', async(req, res) => {
        const query = { isReported: true };
        const products = await productsCollections.find(query).toArray();
        res.send(products);
      })

      // Varify a user
      app.patch('/users/:id',verifyJWT, verifyAdmin, async(req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)};
        const updateDoc = {
          $set: { verified: true }
        }
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      })

      // Json Web Token
      app.get('/jwt', async (req, res) => {
        const email = req.query.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        if (user) {
            const token = jwt.sign({ userName: user.name, userEmail: user.email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
            return res.send({ accessToken: token });
        }
        console.log("Hited")
        res.status(403).send({ accessToken: '' })
    });

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