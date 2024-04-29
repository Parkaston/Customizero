const router = require("express").Router();
const express = require("express");
const app = express();
const {isAuthenticated} = require("../helpers/auth");
const {isUnauthenticated} = require("../helpers/auth");
const Product = require('../models/product');
const Cart = require("../models/cart");
var Order = require("../models/order");
require('dotenv').config();
const multer = require ('multer');
var MongoClient = require('mongodb').MongoClient;
var assert = require("assert");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser')



const storage = multer.diskStorage({
destination: function(req,file,cb)
{
cb(null,'./uploads/');

},
filename: function(req,file,cb)
{
cb(null, Date.now() + file.originalname);

}

})

const fileFilter = (req,file,cb) =>
{
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg')
  {
    //file accepted
    cb(null,true);
  }else
  {
    //File rejection
    cb(null,false);

  }



};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});








// Ubicaciones
const myDomain = "https://customizero.com";
var url = 'mongodb+srv://fridaelgato:kuntatonet@cluster0.b7oje.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

//Middlewares
router.use(express.json());


router.post('/agregarfoto/:id', upload.single('fotoElegida'), function (req, res) {
  console.log(req.file);

  var orderId = req.params.id;
  var foto = req.file.path.replace(/\\/g, "/");
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.agregarfoto(orderId,foto);
   req.session.cart = cart;
res.redirect("/shopping-cart")


});

router.get('/orderData/:id',esadmin, function(req, res){
  const orderId = req.params.id;
Order.findOne({_id: orderId}, function(err, order){
if(err) {
  console.log("hubo un error al procesar los pedidos");
  res.redirect("/")}
else {
  console.log(order);
  res.render("orderdata.hbs",{order:order});}
});
});




router.get("/terminosycondiciones", (req,res) => {
  res.render("tyc.hbs");
})

router.get("/politicasdeprivacidad", (req,res) => {
  res.render("pdp.hbs");
})

router.get("/politicascookies", (req,res) => {
  res.render("pdc.hbs");
})





router.get("/categorias", (req,res) => {
  res.render("categorias.hbs");
})









router.get("/success", async (req,res) => {
let paymentId = req.session.paymentId;
var cart = new Cart(req.session.cart)

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
  let paymentIntentStatus = paymentIntent.status;
if (paymentIntentStatus === "succeeded")
{
  var order = new Order({
    user: req.user,
    userObject: req.user,
    cart: cart,
    adress: req.user.direccion,
    name: req.user.nombre,
    paymentId: paymentId,
    enviado:false
  })
  order.save();
  req.flash("success_msg", "Compra realizada con exito!");
  req.session.cart = null;
}
res.render("index.hbs", {successMsg: 'Comprado con exito!'});
});

router.post('/create-payment-intent', async (req, res) => {
  var cart = new Cart(req.session.cart)
  const {paymentMethodType, currency} = req.body;
  const params = {
    payment_method_types: [paymentMethodType],
    amount: cart.totalPrice * 100,
    currency: currency,
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(params);
      req.session.paymentId = paymentIntent.id;
    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});


router.get("/checkout",isLoggedIn,function(req,res,next) {
  if(!req.session.cart) {
  return res.redirect("/shopping-cart")
  }
var cart = new Cart(req.session.cart);
var errMsg = req.flash("error")[0];
res.render("checkout.hbs", {total: cart.totalPrice,  errMsg: errMsg, noError: !errMsg});

});



router.post('/webhook', bodyParser.raw({type: "application/json"}), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try
  {
    event = stripe.webhooks.constructEvent(req.body,sig,process.env.webhookSecret);
  }catch (err) {
console.log('Error message: ${err.message}');
  }

  if (event.type === 'payment_intent.created')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);

  }
  if (event.type === 'payment_intent.canceled')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);
  }
  if (event.type === 'payment_intent.failed')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);
  }
  if (event.type === 'payment_intent.processing')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);
  }
  if (event.type === 'payment_intent.requires_action')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);
  }
  if (event.type === 'payment_intent.succeeded')
  {
    const paymentIntent = event.data.object;
    console.log(event.id + 'PaymentIntent que estas buscando de id:' + paymentIntent.id + ' Y payment status de '+ paymentIntent.status);
  }
  res.json({received:true});
});

router.get('/config', async (req,res) =>
{
  res.json({publishableKey: process.env.STRIPE_PUBLISHABLE_KEY})

})






router.get("/", (req,res) => {
  var successMsg = req.flash("success")[0];
res.render("index.hbs", {successMsg: successMsg, noMessages: !successMsg});
});

router.get("/insert", (req, res, next) => {
  res.render("insert.hbs");

});

router.get('/categorias/:categoria', async function(req, res){
let categoriabuscada = req.params.categoria;
const product = await Product.findOne({ 'categoria': categoriabuscada });
if (!product) {
  console.log("No hay productos con esa categoria");
  res.redirect("/");
}
let linkBuscado = product.categoryPicture;
Product.find({categoria: categoriabuscada}, function(err, docs){
if(err) res.redirect("/")
else   {res.render("productspercategory.hbs",{products:docs,link:linkBuscado});
}
});
});



router.get("/producto/:id",function(req,res,next){
var position = req.params.id;
var resultArray = [];

MongoClient.connect(url,function(err,client){
assert.equal(null,err);
var db = client.db("myFirstDatabase");
var cursor = db.collection("products").find();

cursor.forEach(function(doc,err) {
assert.equal(null,err);
resultArray.push(doc);
}, function(){
client.close();

res.render("producto.hbs", {product: resultArray[position],title:"Ingresar titulo",condition:false})
});
})
});


router.post("/insert", function(req, res, next) {
  const newProduct = new Product();
  newProduct.codigo = req.body.codigo;
  newProduct.numeroId = req.body.numeroId;
  newProduct.nombre = req.body.nombre;
  newProduct.precio = req.body.precio;
  newProduct.descripcionSuperior = req.body.descripcionSuperior;
  newProduct.primeraImagen = req.body.primeraImagen;
  newProduct.segundaImagen = req.body.segundaImagen;
  newProduct.tercerImagen = req.body.tercerImagen;
  newProduct.cuartaImagen = req.body.cuartaImagen;
  newProduct.material = req.body.material;
  newProduct.color = req.body.color;
  newProduct.tamaño = req.body.tamaño;
  newProduct.categoria = req.body.categoria;
  newProduct.esgrabable = req.body.esgrabable;
  newProduct.esgrabableDetras = req.body.esgrabableDetras;
  newProduct.esfotograbable = req.body.esfotograbable;
  newProduct.categoryPicture = req.body.categoryPicture;
console.log(req.body.categoria);
  MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    var db = client.db("myFirstDatabase");
    var collection = db.collection("products");
    collection.insertOne(newProduct, function(err, result) {
      console.log("Item inserted");
      client.close()
      res.redirect("/insert");
    });
  });
});


router.get("/add-to-cart/:id", function(req,res,next){
var productId = req.params.id;
var cart = new Cart(req.session.cart ? req.session.cart : {});

Product.findById(productId, function (err,product){
if (err) {
  req.flash("error_msg", "No hemos podido agregar el producto al carrito")
  return res.redirect("/")
}
req.flash("success_msg", "Tu producto ha sido agregado con exito al carrito!")
cart.add(product);
req.session.cart = cart;
res.redirect("/");


    });
});


router.get("/shopping-cart", function(req,res,next){
if(!req.session.cart) {
return res.render("shopping-cart", {products:null});
}
var cart = new Cart(req.session.cart);

res.render("shopping-cart", {products: cart.generateArray(),totalPrice: cart.totalPrice,});

});











function isLoggedIn(req,res,next) {
if (req.isAuthenticated())
{
return next();
}
req.session.oldUrl = req.url;
res.redirect("/users/signin");
}

function notLoggedIn(req,res,next) {
if (!req.isAuthenticated())
{
return next();
}
res.redirect("/");
}


router.get("/add-to-cart/:id", function(req,res,next){
var productId = req.params.id;
var cart = new Cart(req.session.cart ? req.session.cart : {});

Product.findById(productId, function (err,product){
if (err) {
  return res.redirect("/")
}


res.redirect("/checkout");


    });
});



router.post('/cambiarfrasedelantera/:id/', function (req, res) {
  var productId = req.params.id;
  var frase = req.body.fraseelegida;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.cambiarFraseDelantera(productId,frase);
   req.session.cart = cart;
res.redirect("/shopping-cart")


});









router.post('/cambiarfrasetrasera/:id/', function (req, res) {
  var productId = req.params.id;
  var frase = req.body.fraseelegida;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  console.log(frase)
   cart.cambiarFraseTrasera(productId,frase);
   req.session.cart = cart;
res.redirect("/shopping-cart")


});

router.post('/agregarUno/:id/', function (req, res) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.agregarUno(productId);
   req.session.cart = cart;
res.redirect("/shopping-cart")

});

router.post('/quitarUno/:id/', function (req, res) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.quitarUno(productId);
   req.session.cart = cart;
res.redirect("/shopping-cart")

});

router.post('/toggleCajaDeRegalo/:id/', function (req, res) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.toggleCajaDeRegalo(productId);
   req.session.cart = cart;
res.redirect("/shopping-cart")

});

router.post('/removeritem/:id/', function (req, res) {
  console.log("llegue al metodo");
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   cart.eliminar(productId);
   req.session.cart = cart;
res.redirect("/shopping-cart")

});

function esadmin(req,res,next)
{
if ((req.user != null) && (req.user.esadmin)  ){
  return next();
}
res.redirect("/")
}



module.exports = router;
