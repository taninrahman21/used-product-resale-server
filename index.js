const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Beche Daw is running succesfully!')
})

app.listen(port, () => {
  console.log(`Beche Daw is listening on port: ${port}`);
})