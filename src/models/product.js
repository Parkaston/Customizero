const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({

codigo:Number,
numeroId:Number,
nombre:{type:String, required:true},
precio:{type:Number, required:true},
descripcionSuperior:String,
primeraImagen: {type:String, required:true},
segundaImagen:{type:String, required:true},
tercerImagen:{type:String, required:true},
cuartaImagen:{type:String, required:true},
color:{type:String, required:true},
material:{type:String, required:true},
tamaño:{type:String, required:true},
esgrabable:Boolean,
esgrabableDetras:Boolean,
esfotograbable:Boolean,
categoria:{type:String, required:true},
categoryPicture:{type:String, required:true}

});

module.exports = mongoose.model('product', schema);
