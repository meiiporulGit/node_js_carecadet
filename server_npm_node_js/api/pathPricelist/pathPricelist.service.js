import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import PathPricelist from "./pathPricelist.schema.js";

export default {
  fileConfirmation,
  getPathInfoByProvider,
  nonStandard,
};
// const useremail = "meiiporulgithub@gmail.com";
// const emailpass = "ubtddcjzvsywlxly";

// const transport = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   auth: {
//     user: useremail,
//     pass: emailpass,
//   },
//   port: 587,
//   secure: false,
// });

const useremail ="healthlens.demo@meiiporul.com";
const emailpass ="healthlens@23";

const transport
 = nodemailer.createTransport({
    host:"mail.meiiporul.com",
    auth:{
        user:useremail,
        pass:emailpass
    },
    port:465,
    secure: true,

});
async function sendConfirmationEmail(email, name, file) {
  // console.log("Check");
  // var uId=emailData.userID
  var finalFile = file.split("/")[2];
  const mailOptions = await transport.sendMail(
    {
      from: "healthlens.demo@meiiporul.com",
      to: email,
      subject: "Please confirm your account",
      html: `<h1>Verification Email</h1>
          <h2>Hello ${name},</h2> 
          <p>${finalFile} - File is verified by admin. Please publish your data</p>
          </div>`,
      // attachments: [
      //   {
      //     filename: filename,
      //     path: __dirname + "/uploads/" + filename,
      //   },
      // ],
    }
    // function (error, info) {
    //   console.log("sentMail returned!");
    //   if (error) {
    //     console.log("Error!!!!!", error);
    //     sendMessage="suerr"
    //   } else {
    //     console.log("Email sent:" + info.response);
    //     sendMessage="suerr"
    //   }
    // }
  );
  if (mailOptions) {
    return { message: "success" };
  } else {
    throw Error("mail not sent");
  }
  // .catch(err => console.log(err));
  // return {message: sendMessage}
}

async function fileConfirmation(body) {
  console.log(body, "console");
  const decoded = jwt.verify(body.file, process.env.SECRET_KEY);
  console.log(decoded);
  const findFilePath = await PathPricelist.findOne({
    organizationID: decoded.orgID,
    filePath: decoded.file,
  });

  if (findFilePath) {
    await PathPricelist.findOneAndUpdate(
      { organizationID: decoded.orgID, filePath: decoded.file },
      {
        $set: {
          status: "verified",
          updatedBy: "Admin",
          updatedDate: new Date(),
        },
      }
    );
    await sendConfirmationEmail(decoded.email, decoded.name, decoded.file);
    return { message: "Successfully verified" };
  } else {
    return { message: "file not exist" };
  }
}

async function getPathInfoByProvider(body) {
  const Organisationid = body.OrganizationID;
  const ProviderID = body.providerID;
  console.log(Organisationid, ProviderID);
  if (ProviderID && Organisationid) {
    console.log("check");
    const PathPricelistDetails = await PathPricelist.aggregate([
      { $match: { providerID: ProviderID, organizationID: Organisationid } },
      {
        $project: {
          status: 1,
          filePath: 1,
          fileFormat: 1,
          providerID: 1,
          organizationID: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    console.log(PathPricelistDetails);
    return { data: PathPricelistDetails };
  } else {
    throw Error("files not available");
  }
}

async function nonStandard() {
  const PathPricelistDetails = await PathPricelist.aggregate([
    { $match: { fileFormat: "Non-Standard" } },
    {
      $project: {
        filePath: 1,
        providerName: 1,
        fileFormat: 1,
        providerID: 1,
        organizationID: 1,
      },
    },
  ]);
  return { data: PathPricelistDetails };
}
