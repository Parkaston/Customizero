const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
var passportLocalMongoose=require("passport-local-mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  nombre:String,
  username:String,
  apellido:String,
  email:String,
  password: String,
  codigopostal: Number,
  provincia:String,
  localidad:String,
  direccion:String,
  piso:String,
  movil: Number,
  secretToken: String,
  active:Boolean,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  esadmin:Boolean
});

userSchema.methods.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = bcrypt.hash(password,salt);
  return hash;
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model('user', userSchema);
