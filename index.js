const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://alternative-project.vercel.app",
      "alternative-project-9fe1c8pfi-komolar-friend.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.moefco9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middleware for cookies

const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  next();
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log(req?.cookies);
  console.log('token in the middleware : ',token);
  if (!token) {
    return res
      .status(401)
      .send({ message: "unauthorized access,no token found" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    console.log(req.user);
    next();
  });
};

const cookeOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"? true :false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};

async function run() {
  try {
    const recentQueries = client
      .db("AlternativeProduct")
      .collection("RecentQueries");
    const myQurie = client.db("AlternativeProduct").collection("myQurie");

    //Auth related Api
    app.post("/jwt",logger, async (req, res) => {
      const user = req.body;
      console.log("user for token", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1000h",
      });
      // res.cookie('token',token,{
      //    httpOnly:true,
      //    secure:true,
      //    sameSite: 'strict'
      // })
      console.log(token);
      res
        .cookie("token", token,cookeOption, {
        
        })
        .send({ success: true, token });
    });
    //cookie user logout
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { ...cookeOption,maxAge: 0  }).send({ success: true });
    });

    //Queries add
    app.post("/newQueries",logger, verifyToken, async (req, res) => {
      console.log("token owner info", req.user, req.query.email);

      const Queries = req.body;
      console.log(Queries);
      const result = await myQurie.insertOne(Queries);
     
      if (req.user.email !== Queries.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      res.send(result);
    });

    app.get("/newQueries/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await myQurie.find({ email: req.params.email }).toArray();
      res.send(result);
    });

    //delete
    app.delete("/newQueries/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await myQurie.deleteOne(query);
      res.send(result);
    });

    app.get("/newQueries/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await myQurie.findOne(query);
      res.send(result);
    });
    //
    //upadate
    app.put("/newQueries/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: id };
      const option = { upsert: true };
      const updateQuries = req.body;
      const update = {
        $set: {
          P_name: updateQuries.P_name,
          P_Brand: updateQuries.P_Brand,
          P_URL: updateQuries.P_URL,
          QueryTitle: updateQuries.QueryTitle,
          BoycottingReason: updateQuries.BoycottingReason,
        },
      };
      const result = await myQurie.updateOne(filter, update, option);
      res.send(result);
    });

    //Get Queries
    app.get("/newQueries", async (req, res) => {
      const cursor = myQurie.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //get recentQuries
    app.get("/RecentQueries",  async (req, res) => {

      const result = await recentQueries.find().toArray();
     

      res.send(result);
    });

    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Alternative Product Server is runnin on port ${port}`);
});
