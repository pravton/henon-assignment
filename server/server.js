require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const app = express();
const port = 3001;
const cors = require('cors');

const cookieParser = require('cookie-parser');

const routes = require('./routes')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

app.use(cookieParser());
app.use(routes);


app.use(helmet());


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
