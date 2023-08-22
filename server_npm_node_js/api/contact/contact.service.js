import nodemailer from "nodemailer";

export default {
  createEmail,
};

const useremail ="healthlens.demo@meiiporul.com";
const emailpass ="healthlens@23";

const transport= nodemailer.createTransport({
    host:"Meiiporul.com",
    auth:{
        user:useremail,
        pass:emailpass
    },
    port:2096,
    secure: true,

});

// const useremail = "demo.carecadet@gmail.com";
// const emailpass = "wyldgbcphqvxmmws";



// const transport = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   auth: {
//     user: useremail,
//     pass: emailpass,
//   },
//   port: 587,
//   secure: false,
// });
async function createEmail(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log(body, "checkEmail");

  await transport.sendMail(
    {
      from: {
        name: body.email,
        address: body.email,
      },
      to: "healthlens.demo@meiiporul.com",
      subject: body.Subject,
      html: `
           <p>FROM:${body.email}</p>
            <p>${body.Message}</p>
           
           `,
    }
    //  function (error,info){
    //   console.log("sentMail returned!");
    //   if(error){
    //       console.log("Error!!!!!",error);

    //           }else{
    //               console.log("Email sent:"+info.response);

    //               return {message:"Successfully Sent"}
    //           }
    //  }
  );

  return { message: "Message sent to Admin" };
}
