const router = require("express").Router();
const User = require("../models/User")
const passport = require("passport");
const {isAuthenticated} = require("../helpers/auth");
const {isUnauthenticated} = require("../helpers/auth")
var Order = require("../models/order");
const Cart = require("../models/cart");
const randomstring = require("randomstring");
const mailer = require("../utils/mailer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
var async = require("async");
const sgTransport = require("nodemailer-sendgrid-transport");
var csrf = require('csurf')

var csrfProtection = csrf();




router.get('/forgot', function(req, res) {
  res.render('forgot.hbs');
});

router.post('/marcarComoEnviado/:id', async (req,res,next) =>
{
try
{
const orderId = req.params.id;
const result = await Order.findByIdAndUpdate(orderId,{enviado:true});
res.redirect('/admin')
}catch(error)
{
console.log(error.message);
}
});

router.post('/cancelarEnvio/:id', async (req,res,next) =>
{
try
{
const orderId = req.params.id;
const result = await Order.findByIdAndUpdate(orderId,{enviado:false});
res.redirect('/admin')
}catch(error)
{
console.log(error.message);
}
});

router.get('/admin',esadmin, function(req, res){
Order.find({}, function(err, orders){
if(err) {
  console.log("hubo un error al procesar los pedidos");
  res.redirect("/")}
else    res.render("admin.hbs",{orders:orders});
});
});









router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error_msg', 'No existe una cuenta con ese email.');
          console.log("Flaco no existe la cuenta")
          return res.redirect('/forgot');
        }
        console.log("Entro");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      const transport = nodemailer.createTransport(sgTransport({
      auth: {
          api_key: process.env.SENDGRID_SECRET_KEY,
      },
      }));
      var mailOptions = {
        to: user.email,
        from: 'info@customizero.com',
        subject: 'Resetea tu password!',
        html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'https://customizero.com/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transport.sendMail(mailOptions, function(err) {
        console.log('mail sent to' + user.email);
        req.flash('success_msg', 'Un email ha sido enviado a ' + user.email + ' con instrucciones para activar la cuenta.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});



router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error_msg', 'El token es invalido o ha expirado.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});







router.post('/reset/:token',async function(req, res) {
  async.waterfall([
   function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },  function(err, user) {
        if (!user) {
          req.flash('error_msg', 'El token de password es invalido o ha expirado.');
          return res.redirect('/forgot');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password,async function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.password = await user.encryptPassword(req.body.password);
            user.save(function(err) {

              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Las contraseñas no concuerdan");
            return res.redirect('back');
        }
      });
    },
    async function(user, done) {
      const transport = nodemailer.createTransport(sgTransport({
      auth: {
          api_key: process.env.SENDGRID_SECRET_KEY,
      },
      }));
      var mailOptions = {
        to: user.email,
        from: 'learntocodeinfo@mail.com',
        subject: 'Your password has been changed',
        html: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Exito! Tu contraseña ha sido modificada');

      });
    }
  ], function(err) {
    res.redirect('/forgot');
  });
});






router.get("/users/signin",csrfProtection,notLoggedIn, (req,res) => {
  res.render("users/signin", {csrfToken: req.csrfToken()});
})


  router.get("/verify/:token", async (req, res, next) => {
    try {
    var secretToken = req.params.token;
    console.log(secretToken);
      // Find account with matching secret token
      const user = await User.findOne({ 'secretToken': secretToken });
      if (!user) {
        req.flash('error_msg', 'No existe tal usuario.');
        res.redirect('/verify');
        return;
      }

      user.active = true;
      user.secretToken = '';
      await user.save();

      req.flash('success_msg', 'Muchas gracias! Ya puedes usar tu cuenta.');
      res.redirect('/users/signin');
    } catch(error) {
      next(error);
    }
  })





router.post("/users/signin", passport.authenticate("local", {

failureRedirect: "/users/signin",
failureFlash: true
}), function(req, res ,next ) {
if (req.session.oldUrl)
{
  var oldUrl = req.session.oldUrl;
  req.session.oldUrl = null;
  res.redirect(oldUrl);
} else {
  res.redirect("/")
}

});

router.get("/users/signup",csrfProtection,notLoggedIn ,(req,res) => {
  res.render("users/signup", {csrfToken: req.csrfToken()} );
})


router.post("/users/signup", async (req,res) => {

const { nombre,apellido , email , password ,codigopostal, provincia, localidad, direccion, piso, movil} = req.body;
const errors = [];
if(nombre.length <=0)
{
errors.push({text: "Por favor, ingrese un nombre"});
}
if (password.length < 4)
{
errors.push ({text: "El password debe tener al menos 4 caracteres"});
}
if (errors.length > 0 )
{
res.render("users/signup", {errors,nombre,apellido,email,password,codigopostal,provincia,localidad,direccion,piso,movil});
}
else {
const emailUser = await User.findOne({email: email});
if (emailUser) {
  req.flash("error_msg", "El email esta en uso");
  res.redirect("/users/signup");
}
 else {
const newUser = new User({nombre,apellido,email,password,codigopostal,provincia,localidad,direccion,piso,movil});
newUser.username = email;
//Hashing password
newUser.password = await newUser.encryptPassword(password);
newUser.esadmin = false;

//Generating secret hash
const thissecretToken = randomstring.generate();
newUser.secretToken = thissecretToken;
//initalizating unactive user
newUser.active = false;


await newUser.save();

//Compose an email
const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=Edge">
      <!--<![endif]-->
      <!--[if (gte mso 9)|(IE)]>
      <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
      <![endif]-->
      <!--[if (gte mso 9)|(IE)]>
  <style type="text/css">
    body {width: 600px;margin: 0 auto;}
    table {border-collapse: collapse;}
    table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
    img {-ms-interpolation-mode: bicubic;}
  </style>
<![endif]-->
      <style type="text/css">
    body, p, div {
      font-family: inherit;
      font-size: 14px;
    }
    body {
      color: #000000;
    }
    body a {
      color: #1188E6;
      text-decoration: none;
    }
    p { margin: 0; padding: 0; }
    table.wrapper {
      width:100% !important;
      table-layout: fixed;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      -moz-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img.max-width {
      max-width: 100% !important;
    }
    .column.of-2 {
      width: 50%;
    }
    .column.of-3 {
      width: 33.333%;
    }
    .column.of-4 {
      width: 25%;
    }
    ul ul ul ul  {
      list-style-type: disc !important;
    }
    ol ol {
      list-style-type: lower-roman !important;
    }
    ol ol ol {
      list-style-type: lower-latin !important;
    }
    ol ol ol ol {
      list-style-type: decimal !important;
    }
    @media screen and (max-width:480px) {
      .preheader .rightColumnContent,
      .footer .rightColumnContent {
        text-align: left !important;
      }
      .preheader .rightColumnContent div,
      .preheader .rightColumnContent span,
      .footer .rightColumnContent div,
      .footer .rightColumnContent span {
        text-align: left !important;
      }
      .preheader .rightColumnContent,
      .preheader .leftColumnContent {
        font-size: 80% !important;
        padding: 5px 0;
      }
      table.wrapper-mobile {
        width: 100% !important;
        table-layout: fixed;
      }
      img.max-width {
        height: auto !important;
        max-width: 100% !important;
      }
      a.bulletproof-button {
        display: block !important;
        width: auto !important;
        font-size: 80%;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .columns {
        width: 100% !important;
      }
      .column {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .social-icon-column {
        display: inline-block !important;
      }
    }
  </style>
      <!--user entered Head Start--><link href="https://fonts.googleapis.com/css?family=Muli&display=swap" rel="stylesheet"><style>
body {font-family: 'Muli', sans-serif;}
</style><!--End Head user entered-->
    </head>
    <body>
      <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;">
        <div class="webkit">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
            <tr>
              <td valign="top" bgcolor="#FFFFFF" width="100%">
                <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="100%">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td>
                            <!--[if mso]>
    <center>
    <table><tr><td width="600">
  <![endif]-->
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                      <tr>
                                        <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
    <tr>
      <td role="module-content">
        <p></p>
      </td>
    </tr>
  </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:30px 20px 30px 20px;" bgcolor="#f6f6f6" data-distribution="1">
    <tbody>
      <tr role="module-content">
        <td height="100%" valign="top"><table width="540" style="width:540px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
      <tbody>
        <tr>
          <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="72aac1ba-9036-4a77-b9d5-9a60d9b05cba">
    <tbody>
      <tr>
        <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
          <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;" width="29" alt="" data-proportionally-constrained="true" data-responsive="false" src="http://cdn.mcauto-images-production.sendgrid.net/954c252fedab403f/9200c1c9-b1bd-47ed-993c-ee2950a0f239/29x27.png" height="27">
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="331cde94-eb45-45dc-8852-b7dbeb9101d7">
    <tbody>
      <tr>
        <td style="padding:0px 0px 20px 0px;" role="module-content" bgcolor="">
        </td>
      </tr>
    </tbody>
  </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="d8508015-a2cb-488c-9877-d46adf313282">
    <tbody>
      <tr>
        <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
          <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px;" width="95" alt="" data-proportionally-constrained="true" data-responsive="false" src="http://cdn.mcauto-images-production.sendgrid.net/954c252fedab403f/61156dfa-7b7f-4020-85f8-a586addf4288/95x33.png" height="33">
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="27716fe9-ee64-4a64-94f9-a4f28bc172a0">
    <tbody>
      <tr>
        <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="">
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="948e3f3f-5214-4721-a90e-625a47b1c957" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:50px 30px 18px 30px; line-height:36px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 43px">Gracias por Registrarte, ${newUser.nombre}</span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="a10dcb57-ad22-4f4d-b765-1d427dfddb4e" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:18px 30px 18px 30px; line-height:22px; text-align:inherit; background-color:#ffffff;" height="100%" valign="top" bgcolor="#ffffff" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 18px"></span><span style="color: #000000; font-size: 18px; font-family: arial, helvetica, sans-serif"> Por favor, verifica tu cuenta para poder acceder a tu cuenta de Customizero.</span>.</span></div>
<div style="font-family: inherit; text-align: center"><span style="color: #ffbe00; font-size: 18px"><strong></strong></span></div><div></div></div></td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7770fdab-634a-4f62-a277-1c66b2646d8d">
    <tbody>
      <tr>
        <td style="padding:0px 0px 20px 0px;" role="module-content" bgcolor="#ffffff">
        </td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="d050540f-4672-4f31-80d9-b395dc08abe1">
      <tbody>
        <tr>
          <td align="center" bgcolor="#ffffff" class="outer-td" style="padding:0px 0px 0px 0px; background-color:#ffffff;">
            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
              <tbody>
                <tr>
                <td align="center" bgcolor="#ffbe00" class="inner-td" style="border-radius:6px; font-size:16px; text-align:center; background-color:inherit;">
                  <a href="https://customizero.com/verify/${thissecretToken}" style="background-color:#ffbe00; border:1px solid #ffbe00; border-color:#ffbe00; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;" target="_blank">Verifica mi Mail</a>
                </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7770fdab-634a-4f62-a277-1c66b2646d8d.1">
    <tbody>
      <tr>
        <td style="padding:0px 0px 50px 0px;" role="module-content" bgcolor="#ffffff">
        </td>
      </tr>
    </tbody>
  </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="a265ebb9-ab9c-43e8-9009-54d6151b1600" data-mc-module-version="2019-10-22">
    <tbody>
      <tr>
        <td style="padding:50px 30px 50px 30px; line-height:22px; text-align:inherit; background-color:#6e6e6e;" height="100%" valign="top" bgcolor="#6e6e6e" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 18px"><strong>Tu cuenta estará lista para hacer el mejor regalo.</strong></span></div>
<div style="font-family: inherit; text-align: center"><br></div>
<div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 18px">Te esperamos.</span></div>
<div style="font-family: inherit; text-align: center"><br></div>



<div style="font-family: inherit; text-align: center"><br></div>
<div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 18px">Alguna duda? Contactanos!</span></div>
</div></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="d050540f-4672-4f31-80d9-b395dc08abe1.1">
      <tbody>
        <tr>
          <td align="center" bgcolor="#6e6e6e" class="outer-td" style="padding:0px 0px 0px 0px; background-color:#6e6e6e;">
            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
              <tbody>
                <tr>
                <td align="center" bgcolor="#ffbe00" class="inner-td" style="border-radius:6px; font-size:16px; text-align:center; background-color:inherit;">
                  <a href="" style="background-color:#ffbe00; border:1px solid #ffbe00; border-color:#ffbe00; border-radius:0px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;" target="_blank">Contacto via whatsapp</a>
                </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="c37cc5b7-79f4-4ac8-b825-9645974c984e">
    <tbody>
      <tr>
        <td style="padding:0px 0px 30px 0px;" role="module-content" bgcolor="6E6E6E">
        </td>
      </tr>
    </tbody>
  </table></td>
        </tr>
      </tbody>
    </table></td>
      </tr>
    </tbody>
  </table><table border="0" cellpadding="0" cellspacing="0" class="module" data-role="module-button" data-type="button" role="module" style="table-layout:fixed;" width="100%" data-muid="550f60a9-c478-496c-b705-077cf7b1ba9a">
      <tbody>
        <tr>
          <td align="center" bgcolor="" class="outer-td" style="padding:0px 0px 20px 0px;">
            <table border="0" cellpadding="0" cellspacing="0" class="wrapper-mobile" style="text-align:center;">
              <tbody>
                <tr>
                <td align="center" bgcolor="#f5f8fd" class="inner-td" style="border-radius:6px; font-size:16px; text-align:center; background-color:inherit;"><a href="https://sendgrid.com/" style="background-color:#f5f8fd; border:1px solid #f5f8fd; border-color:#f5f8fd; border-radius:25px; border-width:1px; color:#a8b9d5; display:inline-block; font-size:10px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:5px 18px 5px 18px; text-align:center; text-decoration:none; border-style:solid; font-family:helvetica,sans-serif;" target="_blank">♥ POWERED BY TWILIO SENDGRID</a></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table></td>
                                      </tr>
                                    </table>
                                    <!--[if mso]>
                                  </td>
                                </tr>
                              </table>
                            </center>
                            <![endif]-->
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </center>
    </body>
  </html>` ;

await mailer.sendConfirmationEmail('info@customizero.com',newUser.email,'Bienvenido a Customizero. Verifica tu Email.',html);



req.flash("success_msg","Registro satisfactorio!. Chequea tu email para confirmar tu cuenta");
res.redirect("/users/signin");
      }
    }
  }), function(req, res ,next ) {

  if (req.session.oldUrl)
  {
  var oldUrl = req.session.oldUrl;
  req.session.oldUrl = null;
  res.redirect(oldUrl);

  } else {
    res.redirect("/users/profile")
  }

  };


router.get("/users/logout",isLoggedIn, (req,res) => {

req.logout();
res.redirect("/");


});


router.get("/users/profile",csrfProtection, isLoggedIn, function(req, res, next) {
  Order.find({user: req.user},
    function(err, orders) {
      if (err) {
        return res.write("Error!")
      }
      var cart;
      orders.forEach(function(order) {
        cart = new Cart(order.cart);
        order.items = cart.generateArray()
      });
      res.render("perfil", {
        orders: orders,
        user: req.user,
        csrfToken: req.csrfToken()
      })
    }
  )
})


router.post("/users/removeUser", function(req, res, next) {
  User.findOneAndRemove({ email: req.user.email }, function(err, success) {
    if (err) {
      console.log(err.message)
      req.flash("error_msg", "Fallo al remover el usuario")
    }
    if (success) {
      req.flash("success_msg", "Usuario removido con exito")
      res.redirect("/")
    }
  })
})


router.post("/users/profile", function(req, res, next) {
  User.findOne({ email: req.user.email }, function(err, user) {
    if (err) {
      console.log(err.message)
      req.flash("error_msg", "Hubo un error al actualizar el usuario")
    }
    if (user) {
  user.nombre = req.body.nombre;
  user.provincia = req.body.provincia;
  user.localidad = req.body.localidad;
  user.direccion = req.body.direccion;
  user.save();
    console.log(user)
      res.redirect("/users/profile")
    }
  })
})



module.exports = router;

function esadmin(req,res,next)
{
if ((req.user != null) && (req.user.esadmin)  ){
  return next();
}
res.redirect("/")
}

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
res.redirect("/users/signup");
}
