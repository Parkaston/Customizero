const mongoose= require("mongoose");

const dbUrl= 'password';

mongoose.connect(dbUrl,{
useCreateIndex:true,
useNewUrlParser:true,
useFindAndModify:false,
useUnifiedTopology: true

})
.then (db => console.log("Db is connected"))
.catch(err => console.log(err));
