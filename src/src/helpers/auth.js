const helpers = {};

helpers.isAuthenticated = (req,res,next) => {
  if (req.isAuthenticated()){
return next();

  }
req.flash("error_msg","Debes estar logueado para acceder a esta característica")
res.redirect("/users/signin");
};

helpers.isUnauthenticated = (req,res,next) => {

  if (req.isUnauthenticated()) {
    return next();
  }
  res.redirect("/");
}


module.exports = helpers;
