const mongoose = require('mongoose');
mongoose.connect("mongodb://0.0.0.0:27017/e-commerce")
    .then(() => console.log('connection successful'))
    .catch((err) => console.error(err));