const express = require("express");
const router = require("express").Router();
const Handlebars = require("handlebars");
const path = require("path");
const exphbs = require("express-handlebars");
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const methodOverride = require("method-override");
const session = require("express-session")
const flash = require ("connect-flash")
const passport = require ("passport");
const MongoStore = require("connect-mongo");
const mongoose= require("mongoose");
const dbUrl = 'mongodbpass';
//Initializations

const app = express();
require("./database");
require("./config/passport");

//Settings


app.set("port", process.env.PORT); //Si hay un puerto en mi computadora usalo, sino usa 3000
app.set("views", path.join(__dirname,"views"));
app.engine(".hbs", exphbs({
handlebars: allowInsecurePrototypeAccess(Handlebars),
dafaultLayout: "main" , //Seteo main file
layoutsDir: path.join(app.get("views"), "layouts") , //Seteo carpeta de layouts
partialsDir: path.join(app.get("views"),"partials") ,//Seteo carpeta de partials
extname: ".hbs" //Seteo extension a usar
}));
app.set("view engine", ".hbs");



//Middlewares


 app.use(express.urlencoded({extended:false}));
 app.use(methodOverride("_method"));
 app.use(session({
secret: "secret",
resave: false,
saveUninitalized: false,
store: MongoStore.create({
  mongoUrl:dbUrl //Cambiar a base de datos real! //Anulada
})
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


//Global variables
app.use((req,res,next) => {
res.locals.login = req.isAuthenticated();
res.locals.session= req.session;
res.locals.success_msg = req.flash("success_msg");
res.locals.error_msg = req.flash("error_msg");
res.locals.error = req.flash("error");
res.locals.user = req.user || null;
next();
});


//Routes
app.use(require("./routes/index"));
app.use(require("./routes/users"));

//Static Files
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname,"public")));
//Server is listening



app.listen(app.get("port"), () => {
console.log("Server on port", app.get("port"))



})

app.get('*', function(req, res) {
    res.redirect('/');
});
