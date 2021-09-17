const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config();
const mongoURI = process.env["MONGODB_URI"];

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false })).use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public");
});

const Schema = mongoose.Schema;

const userLogSchema = new Schema({
  username: String,
  count: 0,
  log: [],
});

const UserModel = mongoose.model("UserModel", userLogSchema);

const createAndSaveUser = (name) => {
  const newUser = new UserModel({
    username: name,
    count: 0,
    log: [],
  });
  newUser.save(function (err, data) {
    if (err) return console.log(err);
  });
};

function isValidDate(dateString) {
  //var regEx = ;
  if (dateString == undefined) return false;
  if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return false; // Invalid format
  var d = new Date(dateString);
  var dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
}

//Create User
app.post("/api/users", (req, res) => {
  UserModel.findOne({ username: req.body.username }, (err, data) => {
    if (data) {
      res.send("That username is already taken");
    } else {
      const newUser = new UserModel({
        username: req.body.username,
        count: 0,
        log: [],
      });
      newUser.save(function (err, data) {
        if (err) return console.log(err);
        res.sendFile(__dirname + "/index.html");
        document.getElementById("return");
      });
    }
  });
});
//Add Exercise Log
app.post("/api/users/username/exercises", (req, res) => {
  function isValidDate(dateString) {
    //var regEx = ;
    if (!dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return false; // Invalid format
    var d = new Date(dateString);
    var dNum = d.getTime();
    if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
    return d.toISOString().slice(0, 10) === dateString;
  }
  let dateToSave;
  if (!req.body.date) {
    dateToSave = new Date();
  } else if (isValidDate(req.body.date)) {
    dateToSave = new Date(req.body.date);
  } else {
    dateToSave = new Date();
  }
  dateToSave = dateToSave.toDateString();
  UserModel.findOne({ username: req.body.username }, (err, data) => {
    console.log(data);
    if (!data) {
      res.send("oops");
    } else {
      data.log.push({
        description: req.body.description,
        duration: req.body.duration,
        date: dateToSave,
      });
      data.count += 1;
      data.save(function (err, data) {
        if (err) return console.log(err);
      });
      const resolution = {
        _id: data.id,
        username: data.username,
        description: req.body.description,
        duration: parseInt(req.body.duration),
        date: dateToSave,
      };
      res.send(resolution);
    }
  });
});
//Get all Users
app.get("/api/users", (req, res) => {
  UserModel.find({}, (err, data) => {
    res.send(
      data.map((data) => ({
        _id: data["_id"],
        username: data.username,
      }))
    );
  });
});
//Get user Logs
app.get("/api/users/:username/logs", (req, res) => {
  UserModel.findOne({ username: req.params.username }, (err, data) => {
    if (err) {
      res.send("Invalid ID");
    }
    var resUser = {
      username: data.username,
      _id: data._id.toString(),
      count: data.count,
    };
    var newLog = data.log;
    if (req.query.from) {
      newLog = newLog.filter(
        (d) => new Date(d.date) > new Date(req.query.from)
      );
      resUser.from = new Date(req.query.from).toDateString();
    }
    if (req.query.to) {
      newLog = newLog.filter((d) => new Date(d.date) < new Date(req.query.to));
      resUser.to = new Date(req.query.to).toDateString();
    }
    if (req.query.limit) {
      newLog = newLog.slice(0, req.query.limit);
    }
    resUser.log = newLog;
    res.send(resUser);
  });
});

const listener = app.listen(process.env.PORT || 8000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
