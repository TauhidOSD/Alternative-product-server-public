const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//middleware

app.use(cors({}));
app.use(express.json());

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

async function run() {
  try {
    const recentQueries = client
      .db("AlternativeProduct")
      .collection("RecentQueries");
    const myQurie = client.db("AlternativeProduct").collection("myQurie");

    //Queries add
    app.post("/newQueries", async (req, res) => {
      const Queries = req.body;
      console.log(Queries);
      const result =await myQurie.insertOne(Queries);
      res.send(result);
    });

    app.get("/newQueries/:email",async(req,res)=>{
        console.log(req.params.email);
        const result = await myQurie.find({email:req.params.email}).toArray();
        res.send(result);
    })


    //delete 
    app.delete('/newQueries/:id',async(req,res)=>{
       const id=req.params.id;
       const query={_id: new ObjectId(id)} 
       const result =await myQurie.deleteOne(query);
       res.send(result);
    })
    
    app.get('/newQueries/:id',async(req,res)=>{
        const id=req.params.id;
        const query ={_id: (id)}
        const result =await myQurie.findOne(query);
        res.send(result);
    })
    //
    //upadate 
    app.put('/newQueries/:id',async(req,res)=>{
       const id=req.params.id; 
       const filter ={_id: (id)}
       const option ={upsert:true};
       const updateQuries=req.body;
       const update={
        $set:{
             P_name:updateQuries.P_name ,
              P_Brand:updateQuries.P_Brand ,
               P_URL:updateQuries.P_URL ,
                QueryTitle:updateQuries.QueryTitle ,
                 BoycottingReason:updateQuries.BoycottingReason 

        }
       }
       const result =await myQurie.updateOne(filter,update, option);
       res.send(result);

    })



    //Get Queries
    app.get("/newQueries",async(req,res)=>{
        const cursor=myQurie.find();
        const result =await cursor.toArray();
        res.send(result);
    })


    //get recentQuries
    app.get("/RecentQueries", async (req, res) => {
      const result = await recentQueries.find().toArray();

      res.send(result);
    });

    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
