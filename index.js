import express from "express";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import "dotenv/config";

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Connection URL
const url = process.env.MONGO_URL;

const client = new MongoClient(url);

async function ConnectDB() {
  try {
    await client.connect();
    console.log("✔✔ Connected to the database ✔✔");
    return client;
  } catch (error) {
    if (error instanceof MongoServerError) {
      console.log(`Error worth logging: ${error}`); // special case for some reason
    }
    throw error; // still want to crash
  }
}

await ConnectDB();

// Database Name and collection setup
const dbName = "Users";
const db = client.db(dbName);
const collection = db.collection("users");

// home get method
app.get("/", function (req, res) {
  res.send("Hello World");
});

//post signup
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const saltRounds = 10;
  const myPlaintextPassword = password;

  

  try {
    // check if email already exists
    const findResult = await collection.find({ email: email }).toArray();
    if (findResult.length > 0) {
      return res.status(400).send("Email already exists");
    }
    //if not, hash the password

    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(myPlaintextPassword, salt);

    //if yes send a response
    // if no , add the user to db and then send response

    const insertResult = await collection.insertOne({
      username,
      email,
      password: hash,
    });
    res.status(201).send("User created successfully");
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

app.post("/login", async (req,res) => {
  try {

    const { email, password } = req.body;
    const user = await collection.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).send("Invalid password");
    }

    // send jwt

    res.status(200).send('Welcome to dashboard')
    
    
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
    
  }
});

app.delete("/", async () => {});

//callback function to our app for feedback
app.listen(PORT, () => {
  console.log("Server running on port 3000 🎉🎉🎉");
});
