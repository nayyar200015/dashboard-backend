const express = require('express');
const cors = require('cors');
const User = require('./db/User');
const Product = require('./db/Product');
const app = express();
require('./db/config');
const Jwt = require('jsonwebtoken');
const jwtKey = 'e-commerce';

app.use(express.json());
app.use(cors());

//* This is a middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        Jwt.verify(token, jwtKey, (error, valid) => {
            (error && res.status(401).send({ result: "Please provide valid token" })) || next();
        })
    } else {
        res.status(403).send({ result: "Please add token with header" });
    }
}

app.post('/register', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save()
    result = result.toObject();
    delete result.password;
    Jwt.sign({ result }, jwtKey, { expiresIn: '2h' }, (err, token) => {
        err && res.send({ result: "Something went wrong, Please try after sometime." });
        res.send({ result, auth: token });
    });
})

app.post('/login', async (req, res) => {
    if (req.body.email && req.body.password) {
        let user = await User.findOne(req.body).select('-password');
        if (user) {
            Jwt.sign({ user }, jwtKey, { expiresIn: '2h' }, (err, token) => {
                err && res.send({ result: "Something went wrong, Please try after sometime." });
                res.send({ user, auth: token });
            });
        } else { res.send({ result: "No user found" }) };
    } else {
        res.send({ result: "No user found" })
    }
})

app.post('/add-product', verifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
});

app.get('/products', verifyToken, async (req, res) => {
    let products = await Product.find();
    (products.length && res.send(products)) || res.send({ result: "No Products found!" });
});

app.delete('/product/:id', verifyToken, async (req, res) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    res.send(result);
});

app.get('/product/:id', verifyToken, async (req, res) => {
    const result = await Product.findOne({ _id: req.params.id });
    (result && res.send(result)) || res.send({ result: "No Record found!" });
});

app.put('/product/:id', verifyToken, async (req, res) => {
    const result = await Product.updateOne({ _id: req.params.id }, { $set: req.body });
    // (result && res.send(result)) || res.send({ result: "No Record found!" });
    res.send(result);
});

app.get('/search/:key', verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }
        ]
    })
    res.send(result);
});


app.listen(process.env.PORT || 5000, () => {
    console.log("Listening at port 5000");
});