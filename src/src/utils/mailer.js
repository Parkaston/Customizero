const nodemailer = require("nodemailer");
const config = require("../config/mailer");
const sgTransport = require("nodemailer-sendgrid-transport");


const transport = nodemailer.createTransport(sgTransport({
auth: {
    api_key: process.env.SENDGRID_SECRET_KEY,
},
}));



module.exports =
{
  sendConfirmationEmail(from,to,subject,html)
  {
    return new Promise((resolve,reject) => {
      transport.sendMail({from,subject,to,html}, (err,info) => {
if (err) reject(err);
resolve(info);

      });


    });

  }


}
