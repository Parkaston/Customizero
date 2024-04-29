const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({

user: {type: Schema.Types.ObjectId, ref:"User"},
userObject:{type: Object,required:true},
cart: {type: Object, required:true },
adress: {type: String, required:true},
name: {type:String, required:true},
paymentId: {type:String, required:true},
enviado: {type:Boolean, required:true},
createdAt: {type: Date, default: Date.now}

});

module.exports = mongoose.model('order', schema);
