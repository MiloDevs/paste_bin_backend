const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const crypto = require('crypto')
const { time } = require('console')
const app = express()
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

dotenv.config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect(
  "mongodb+srv://milodevs:X1UbbfUM8FA0H8gf@milodevs-db.dcvfwil.mongodb.net/paste-bin?retryWrites=true&w=majority", {useNewUrlParser: true});

if(mongoose.connection.readyState){
console.log('Connected to DB')
} else {
console.log('Connection to DB failed')
};

const pasteSchema = new mongoose.Schema({
  PasteId: String,
  Title: String,
  TextContent: String,
  Author: String,
  Language: String,
  DeleteAfter: String,
  CreatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  Username: String,
  Password: String,
});

const Paste = mongoose.model("pastes", pasteSchema);
const User = mongoose.model("users", userSchema);

app.get('/', (req,res) => {
    res.json({
      message: "Everything is okay 👌",
    });
})

/* app.post('/api/create', (req,res) => {
    const body = req.body;
    console.log(body);
    res.json({
      message: "Create",
      body: body,
    });
})  */

app.post("/api/paste/create", async (req, res) => {
  const values = req.body.values;
  const PasteId = crypto.randomBytes(16).toString("hex");
  const Title = values.Title;
    const TextContent = values.TextContent;
    const Author = values.Author;
    const Language = values.Language;
    const DeleteAfter = values.DeleteAfter;
  console.log(req.body);

  // Create a new Paste document based on the request body
  const newPaste = new Paste({
    PasteId,
    Title,
    TextContent,
    Author,
    Language,
    DeleteAfter,
  });
  
  console.log(newPaste);
  
  // Save that document
  mongoose.connection.db.collection("pastes").insertOne(newPaste);
  if (newPaste) {
    res.json({
      message: "Paste created",
      paste: newPaste,
    });

    if(DeleteAfter == "1 minute"){
        setTimeout(() => {
        mongoose.connection.db.collection("pastes").deleteOne({ PasteId: PasteId });
        console.log("Deleted");
       }, 60000);
    }

    console.log(newPaste);
  } else {
    res.json({
      message: "Paste creation failed",
    });
    console.log("Paste creation failed");
  }
});


app.get("/api/paste/:id", async (req, res) => {
  const pasteId = req.params.id;

  try {

    const paste = await mongoose.connection.db.collection("pastes").findOne({ PasteId: pasteId });

    if (paste) {

      res.json({
        message: "Paste found",
        paste: paste,
      });
      console.log(paste);

    } 

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.put("/api/paste/edit/:id", async (req, res) => {
  const pasteId = req.params.id;
  const {TextContent} = req.body;

  try {
    const paste = await mongoose.connection.db.collection("pastes").findOne({ PasteId: pasteId });

    if (paste) {
      const updatePaste = await mongoose.connection.db.collection("pastes").updateOne({ PasteId: pasteId }, { $set: { TextContent: TextContent } });
      res.json({
        message: "Paste updated",
        paste: updatePaste,
      });
      console.log(updatePaste);
    }else{
      res.json({
        message: "Paste not found",
      });

    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/api/user/create', async (req, res) => {
  const {username, password} = req.body;

  const newUser = new User({
    Username: username,
    Password: password,
  });

  const token = jwt.sign({username: username}, process.env.JWT_SECRET_KEY);

  try{

    await mongoose.connection.db.collection("users").findOne({ Username: username })
    .then((user) => {
    if(user != null){
      res.json({
        message: "Username already exists",
      });
      return;
    }else{
      const user = mongoose.connection.db
        .collection("users")
        .insertOne(newUser);

      if (user) {
        res.json({
          message: "User created",
          user: newUser,
          token,
        });
      } else {
        res.json({
          message: "User creation failed",
        });
      }
    }});
    
  }catch(error){
    console.log(error);
    res.json({
      message: "User creation failed",
    });
  }

});

app.post('/api/user/login', async (req, res) => {
  const {username, password} = req.body;

  try{
    const user = await mongoose.connection.db.collection("users").findOne({ Username: username });
    if(user != null){
      if(user.Password == password){
        res.json({
          message: "Login successful",
          user: user,
        });
      }else{
        res.json({
          message: "Login failed",
        });
      }
    }else{
      res.json({
        message: "User not found",
      });
    }
  }catch(error){
    console.log(error);
    res.json({
      message: "Login failed",
    });
  }

});

app.listen(3021, () => {
    console.log('Server is running on port http://localhost:3021')
})