const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;


const User = require("../models/User")




passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false
    },
    async (email, password, done) => {
      //Check if email exist
      const user = await User.findOne({ email: email });

      if (!user) {
        console.log("No existe tal usuario");
        return done(null, false, { message: "Lo sentimos! Parece que no estas registrado." });

      } else {
        // Match Password's User
        const match = await user.matchPassword(password);
      if (!user.active)
      {
          console.log("Cuenta no activada");
          return done(null, false, { message: "Tu cuenta todavia no esta activada." });

      }
else {

        if (match) {
          return done(null, user);
        } else {

          return done(null, false, { message: "La contraseña es incorrecta" });
        }
      }
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
