const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const route = require("./routes/route")
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb+srv://tariq:google%4031aug@cluster0.e8msu.mongodb.net/group21Database",{
    useNewUrlParser:true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use("/",route);




app.listen(process.env.PORT || 3000 , function(){
    console.log("Express App is running on PORT " + (process.env.PORT || 3000))
})