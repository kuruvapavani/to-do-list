const express = require("express");
const bodyParser = require("body-parser");
const date = require("./date");
const mongoose = require("mongoose");
const _ = require("lodash")
require("dotenv").config();


mongoose.connect(process.env.DATA_URL);


const itemsSchema = {
  name : String
};


const listSchema = {
  name : String,
  items : [itemsSchema]
}

const List = mongoose.model("List",listSchema);

const Item = mongoose.model("Item",itemsSchema);

const app = express();

const day = require(__dirname + "/date.js");

const item1 = new Item({
  name : "Welcome to TO-DO-LIST"
});

const item2 = new Item({
  name : "Click on the + button to add"
});

const item3 = new Item({
  name : "← click here to delete"
});


const defaultItems = [item1,item2,item3];
// Item.insertMany(defaultItems);
app.set('port', process.env.PORT || 3000);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/",async function (req, res) {
  try {
    await Item.find({}).then (items => {
      if(items.length === 0){
        Item.insertMany(defaultItems);
        res.redirect("/");
      }else{
        res.render("index",{listTitle : day, newListItems : items});
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/",function(req,res){
  let itemName = req.body.newItem;
  let listName = req.body.addbtn;
  const item = new Item({
    name : itemName,
  });
  if(listName === day){
    item.save();
    res.redirect("/");
  }else{
      List.findOne({name :listName}).then(list =>{
        list.items.push(item);
        list.save();
        res.redirect("/" + listName);
      }).catch (err => {
        console.error (err);
      });
  }
});

app.get("/:listName", function(req,res){
  var listName = _.capitalize(req.params.listName);
  List.findOne ({name :listName}).then (list => {
   if(true){
    if(!list){
      const list = new List({
        name : listName,
        items : defaultItems
      })
      list.save();
      res.redirect("/" + listName);
    }else{
      res.render("index",{listTitle : listName , newListItems: list.items});
    }
   }
   }).catch (err => {
     console.error (err);
   });
});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  Item.findByIdAndDelete(checkedItemId)
  .then(doc => {
    if(listName === "/"){
      res.redirect("/");
    }else{
      List.findOneAndUpdate( {name : listName}, {$pull : {items : {_id : checkedItemId}}}, { new: true, upsert: true })
      .then (function (doc) {
       res.redirect("/"+listName);
      })
      .catch (function (err) {
        console.log(err)
      });
    }
  })
  .catch(err => {
    console.error(err);
  });
});


let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port,function(){
  console.log("Server on port "+ port);
});