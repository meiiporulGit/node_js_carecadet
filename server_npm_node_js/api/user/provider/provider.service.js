import Provider from "./provider.schema.js";
import { createId } from "../../../shared/common-util.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

export default {
  createProvider,
  updateProvider,
  getProviderList,
  deleteProvider,
  createAdmin,
  // confirmEmail,
  // updateConfirmEmail
};
dotenv.config();

const useremail = "meiiporulgithub@gmail.com";
const emailpass = "ubtddcjzvsywlxly";

// const useremail ="healthlens.demo@meiiporul.com";
// const emailpass ="healthlens@23";

// https://meiiporul.com:2096/
// user: healthlens.demo@meiiporul.com
// pass: healthlens@23

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: useremail,
    pass: emailpass,
  },
  port: 587,
  secure: false,
});

// const transport
//  = nodemailer.createTransport({
//     host:"Meiiporul.com",
//     auth:{
//         user:useremail,
//         pass:emailpass
//     },
//     port:2096,
//     secure: false,

// });

async function sendConfirmationEmail(firstName, _email) {
  console.log("Check");
  var date = new Date();
  var mail = {
    email: _email,
    created: date.toDateString(),
  };
  const tokenmailverification = jwt.sign(mail, process.env.SECRET_KEY, {
    expiresIn: "1d",
  });
  transport.sendMail(
    {
      from: "demo.carecadet@gmail.com",
      to: _email,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${firstName}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
       
        <a href=http://localhost:5200/user/confirm?firstName=${firstName}&email=${tokenmailverification}> Click here</a>
          </div>`,
    }
    //    <a href=http://localhost:5200/user/confirm?firstName=${firstName}&email=${_email}> Click here</a>//
    //    function (error,info){
    //     console.log("sentMail returned!");
    //     if(error){
    //         console.log("Error!!!!!",error);
    //             }else{
    //                 console.log("Email sent:"+info.response);

    //             }
    //    }
  );
  return { message: "success" };
}
//   function confirmEmail(query){
//     console.log("query",query)
//   }

// TO create a provider ( use createId to create unique ID)
async function createProvider(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  const findProvider = await Provider.findOne({ email: body.email });
  if (findProvider) {
    throw Error("Already a user exists with this email");
  } else {
    const ProviderDetails = new Provider();
    ProviderDetails.providerID = await createId(Provider.collection.name);
    ProviderDetails.firstName = body.firstName;
    ProviderDetails.lastName = body.lastName;
    ProviderDetails.email = body.email;
    ProviderDetails.contact = body.contact;
    // ProviderDetails.username = body.username;//nextline duplicate for demo
    ProviderDetails.username = body.email;
    ProviderDetails.password = body.password;
    ProviderDetails.role = body.role;
    ProviderDetails.remark = body.remark;
    ProviderDetails.isActive = "Pending";
    ProviderDetails.activeStartDate = new Date();
    ProviderDetails.createdBy = body.userID;
    ProviderDetails.createdDate = new Date();
    await ProviderDetails.save();
    await sendConfirmationEmail(body.firstName, body.email);
    return { message: "Successfully created" };
  }
}

// async function updateConfirmEmail(body){
//     console.log("body",body);

//     if (Object.keys(body).length === 0) {
//         throw Error("Invalid body parameter");
//     }
//     const findProvider = await Provider.findOne({ email: body.email })
//     if(!findProvider){
//         throw Error(' provider does exists ')
//     } else {
//         await Provider.findOneAndUpdate(
//             { email: body.email },
//             {
//                 $set: {
//                   isActive:'Active',
//                     updatedDate: new Date(),
//                 }
//             }
//         );
//         return { message: 'Successfully updated'}
//     }
// }
//testing
async function updateProvider(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  const findProvider = await Provider.findOne({ providerID: body.providerID });
  if (!findProvider) {
    throw Error(" provider does exists ");
  } else {
    await Provider.findOneAndUpdate(
      { providerID: body.providerID },
      {
        $set: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          contact: body.contact,
          username: body.username,
          role: body.role,
          remark: body.remark,
          updatedBy: body.userID,
          updatedDate: new Date(),
        },
      }
    );
    return { message: "Successfully updated" };
  }
}

async function getProviderList() {
  const ProviderList = await Provider.aggregate([
    { $match: { isActive: "Y" } },
    {
      $project: {
        _id: 0,
        providerID: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        contact: 1,
        username: 1,
        role: 1,
        remark: 1,
        isActive: 1,
        activeStartDate: 1,
        activeEndDate: 1,
        createdBy: 1,
        createdDate: 1,
        updatedBy: 1,
        updatedDate: 1,
      },
    },
  ]);
  return { data: ProviderList, message: "success" };
}

async function deleteProvider(providerID) {
  if (providerID) {
    await Provider.deleteOne({ providerID: providerID });
    return { message: "successfully deleted" };
  } else {
    throw Error("Please provide id");
  }
}


/////////////////////////////////////////ADMIN Create///////////////////////////////////////////

async function createAdmin(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  const findProvider = await Provider.findOne({role:body.role, email: body.email });
  if (findProvider) {
    throw Error("Already a user exists with this email");
  } else {
    const ProviderDetails = new Provider();
    // ProviderDetails.providerID = await createId(Provider.collection.name);
    ProviderDetails.providerID="ADMIN"
    ProviderDetails.firstName = body.firstName;
    ProviderDetails.lastName = body.lastName;
    ProviderDetails.email = body.email;
    ProviderDetails.contact = body.contact;
    // ProviderDetails.username = body.username;//nextline duplicate for demo
    ProviderDetails.username = body.email;
    ProviderDetails.password = body.password;
    ProviderDetails.role = body.role;
    ProviderDetails.remark = body.remark;
    ProviderDetails.isActive = "Pending";
    ProviderDetails.activeStartDate = new Date();
    ProviderDetails.createdBy = body.userID;
    ProviderDetails.createdDate = new Date();
    await ProviderDetails.save();
    // await sendConfirmationEmail(body.firstName, body.email);
    return { message: "Successfully created" };
  }
}