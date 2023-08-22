import Pricelist from "./pricelist.schema.js";
import path from "path";
import fs from "fs";
// import csvjson from "csvtojson";
import pkg from "json-2-csv";
const { json2csv } = pkg;
import jwt from "jsonwebtoken";

import csvjson from "csvjson";
const __dirname = path.resolve(path.dirname(""));

import nodemailer from "nodemailer";
import PathPricelist from "../pathPricelist/pathPricelist.schema.js";

export default {
  uploadPricelist,
  unKnownHeaderPricelist,
  publishPricelist,
  publishPricelistCorrectformat,
  getPriceList,
  updatePricelist,
  deletePricelist,
  getPriceListbyFacility,
  bulkUpdate,
  bulkDelete,
  // getPriceListone,
  getPriceListbyOrg,
  getPriceListbyService,
  createService,
  uploadAdminPricelist,
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

const useremail = "healthlens.demo@meiiporul.com";
const emailpass = "healthlens@23";

const transport = nodemailer.createTransport({
  host: "mail.meiiporul.com",
  auth: {
    user: useremail,
    pass: emailpass,
  },
  port: 465,
  secure: true,
});
// var date = new Date();
// var mail = {
//     "id":ProviderDetails.providerID,
//     "created":date.toDateString()
// }
// const token_mail_verification = jwt.sign(mail,config.jet_secret_mail,{ expiresIn: '1d' })
// var url = "http://localhost:5200+confirm?id=+token_mail_verification";

async function sendConfirmationEmail(emailData, orgID, filename) {
  // console.log("Check");
  // var uId=emailData.userID
  console.log(emailData);
  var file = `/uploads/${filename}`;
  var email = emailData.email;
  var name = emailData.firstName + " " + emailData.lastName;
  const verifyFilename = jwt.sign(
    { orgID, file, email, name },
    process.env.SECRET_KEY,
    { expiresIn: "1d" }
  );
  const mailOptions = await transport.sendMail(
    {
      from: email,
      to: "healthlens.demo@meiiporul.com",

      subject: "Please confirm your account",
      html: `<h1>PriceList Confirmation</h1>
          <h2>Hello Admin,</h2>
          <p>Please Validate and Verify the uploaded pricelist from <br/>OrgID : ${orgID}, <br/>User ID : ${emailData.userID},<br/> File Name : ${filename},<br/>User Name : ${emailData.userName} ,<br/> User Email : ${emailData.email}</p>
          <a href=${process.env.BASE_URL}/pathPricelist/verify?file=${verifyFilename}><button style="color: white;background-color: blue;padding:1rem; font-size: 15px;border:none ; border-radius:10px">Verify</button></a>
          </div>`,
      attachments: [
        {
          filename: filename,
          path: __dirname + "/uploads/" + filename,
        },
      ],
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

async function unknownHeaderSendConfirmationEmail(
  emailData,
  orgID,
  filename,
  fileType
) {
  // console.log("Check");

  const mailOptions = await transport.sendMail(
    {
      from: "healthlens.demo@meiiporul.com",
      to: "healthlens.demo@meiiporul.com",
      subject: "Please confirm your account",
      html: `<h1>PriceList Confirmation</h1>
          <h2>Hello Admin,</h2>
          <h4>${fileType}</h4>
          <p>Provider upload an Unformated <br/>OrgID : ${orgID},<br/> User ID : ${emailData.userID},<br/>File Name : ${filename},<br/> User Name : ${emailData.userName} ,<br/> User Email : ${emailData.email}</p>
         
        `,
      attachments: [
        {
          filename: filename,
          path: __dirname + "/unknownHeaderUploads/" + filename,
        },
      ],
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

async function pathConfirmPricelist(emailData, orgID, filename, fileFormat) {
  const pathPriceListDetails = new PathPricelist();
  pathPriceListDetails.status = "Pending";
  pathPriceListDetails.fileFormat = fileFormat;
  pathPriceListDetails.filePath = filename;
  pathPriceListDetails.providerName = emailData.userName;
  pathPriceListDetails.providerID = emailData.userID;
  pathPriceListDetails.organizationID = orgID;
  pathPriceListDetails.createdBy = emailData.userName;
  pathPriceListDetails.createdDate = new Date();
  await pathPriceListDetails.save();
  return { message: "success" };
}
async function fileConfirmation(body) {
  console.log(body, "console");

  const findFilePath = await PathPricelist.findOne({
    organizationID: body.orgID,
    filePath: body.file.filePath,
  });

  if (findFilePath) {
    await PathPricelist.findOneAndUpdate(
      { organizationID: body.orgID, filePath: body.file.filePath },
      {
        $set: {
          status: "published",
          updatedBy: "Admin",
          updatedDate: new Date(),
        },
      }
    );
    // await sendConfirmationEmail(decoded.email,decoded.name,decoded.file)
    return { message: "Successfully verified" };
  } else {
    throw Error("File not exist");
  }
}

//****************************************************create&update&delete********************** */

async function uploadPricelist(file) {
  const filedata = file.csv;
  if (filedata.length !== 0) {
    var finalCSV = [];
    for (let i = 0; i < filedata.length; i++) {
      console.log(filedata[i].FacilityNPI, filedata[i].Organisationid);
      const findService = await Pricelist.findOne({
        FacilityNPI: filedata[i].FacilityNPI,
        Organisationid: filedata[i].Organisationid,
        DiagnosisTestorServiceName: filedata[i].DiagnosisTestorServiceName,
      });
     
      if (findService) {
        console.log(findService, "checkFind");
        finalCSV.push(filedata[i].DiagnosisTestorServiceName);
      }
   
    }

    if (finalCSV.length !== 0) {
      throw Error(`${finalCSV} already exists`);
    } 
  
  
    else {
      
      const csvData = csvjson.toCSV(filedata, {
        headers: "key",
      });
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = dd + "-" + mm + "-" + yyyy;

      const filename =
        file.organizationID + "_" + today + "_" + Date.now() + "_" + file.name;
      console.log(today, "check");
      let uploadPath = __dirname + "/uploads/" + filename;

      fs.writeFile(uploadPath, csvData, (err) => {
        if (err) console.error(err);
        else {
          console.log("Ok");
        }
      });

      const pathConfirmation = await pathConfirmPricelist(
        file.emailData,
        file.organizationID,
        "/uploads/" + filename,
        "Standard"
      );
      if (pathConfirmation.message === "success") {
        const mailConfrimation = await sendConfirmationEmail(
          file.emailData,
          file.organizationID,
          filename
        );
        if (mailConfrimation.message === "success") {
          return { message: "Successfully sent your request to admin" };
        } else {
          throw Error("mail not sent");
        }
      } else {
        throw Error("Something Wrong");
      }
    }
  } else {
    throw Error("Invalid data");
  }
}

async function unKnownHeaderPricelist(file) {
  const filedata = file.csv;
  var fileType =
    file.fileType === "Multiple facility upload"
      ? file.fileType
      : "Single facility upload";
  if (filedata.length !== 0) {
    var finalCSV = [];
    for (let i = 0; i < filedata.length; i++) {
      const findService = await Pricelist.findOne({
        FacilityNPI: filedata[i].FacilityNPI,
        Organisationid: filedata[i].Organisationid,
        DiagnosisTestorServiceName: filedata[i].DiagnosisTestorServiceName,
      });
      if (findService) {
        finalCSV.push(filedata[i].DiagnosisTestorServiceName);
      }
    }

    if (finalCSV.length !== 0) {
      throw Error(`${finalCSV} already exists`);
    } else {
      const csvData = csvjson.toCSV(filedata, {
        headers: "key",
      });
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = mm + "-" + dd + "-" + yyyy;
      const filename =
        file.organizationID + "_" + today + "_" + Date.now() + "_" + file.name;
      let uploadPath = __dirname + "/unknownHeaderUploads/" + filename;

      fs.writeFile(uploadPath, csvData, (err) => {
        if (err) console.error(err);
        else {
          console.log("Ok");
        }
      });
      const pathConfirmation = await pathConfirmPricelist(
        file.emailData,
        file.organizationID,
        "/unknownHeaderUploads/" + filename,
        "Non-Standard"
      );
      if (pathConfirmation.message === "success") {
        const mailConfrimation = await unknownHeaderSendConfirmationEmail(
          file.emailData,
          file.organizationID,
          filename,
          fileType
        );
        if (mailConfrimation.message === "success") {
          return { message: "Successfully sent your request to admin" };
        } else {
          throw Error("mail not sent");
        }
      } else {
        throw Error("Something Wrong");
      }
    }
  } else {
    throw Error("Invalid data");
  }
}

async function getPriceList() {
  const PriceList = await Pricelist.aggregate([
    {
      $project: {
        SNo: 1,
        ServiceCode: 1,
        DiagnosisTestorServiceName: 1,
        Organisationid: 1,
        OrganisationPrices: 1,
        FacilityNPI: 1,
        FacilityName: 1,
        FacilityPrices: 1,
        createdBy: 1,
        createdDate: 1,
        updatedBy: 1,
        updatedDate: 1,
      },
    },
  ]);
  return { data: PriceList };
}

async function publishPricelist(file) {
  const originaldata = file.csv;
  var finalPublish = [];
  for (let i = 0; i < originaldata.length; i++) {
    const facprice = {
      ...originaldata[i],
      ["FacilityPrices"]:
        originaldata[i].FacilityPrices === "" || null || undefined || 0
          ? originaldata[i].OrganisationPrices
          : originaldata[i].FacilityPrices,
    };
    finalPublish.push(facprice);
  }

  const createPricelist = await Pricelist.create(
    finalPublish
    //     , function (err, documents) {
    //     if (err) throw err;
    //   }
  );

  if (createPricelist.length === 0) {
    throw Error("Not Create");
  } else {
    await fileConfirmation(file.emailData);
    return {
      message: "Successfully Published",
    };
  }
}

async function publishPricelistCorrectformat(file) {
  const originaldata = file.csv;
  var finalCSV = [];
  var finalPublish=[];
  for (let i = 0; i < originaldata.length; i++) {
    console.log("forLoop1", i);
    const createPricelist = await Pricelist.aggregate([
      {
        $match: {
          FacilityNPI: originaldata[i].FacilityNPI,
          Organisationid: originaldata[i].Organisationid,
          DiagnosisTestorServiceName:
            originaldata[i].DiagnosisTestorServiceName,
        },
      },
      {
        $project: {
          // SNo: 1,
          DiagnosisTestorServiceName: 1,
        },
      },
    ]);
    // console.log(createPricelist[0],"createPricelist")
    if (createPricelist[0]!==undefined) {
      finalCSV.push(originaldata[i].DiagnosisTestorServiceName)
    }else{
      const facprice = {
              ...originaldata[i],
              ["FacilityPrices"]:originaldata[i].FacilityPrices === "" || null || undefined || 0 ? originaldata[i].OrganisationPrices: originaldata[i].FacilityPrices,
            };
            finalPublish.push(facprice);
    }
  }
  if(finalCSV.length!==0){
    throw Error(`${finalCSV} already exists`);
  }else{
    const createPricelist = await Pricelist.create(finalPublish);
    console.log(createPricelist,"createpricelist")
        if (createPricelist.length === 0) {
          throw Error("Not Create");
        } else {
          // await fileConfirmation(file.emailData);
          return {
            message: "Successfully Published",
          };
        }
      }
  
  //   var finalCSV = [];
  //   console.log(originaldata,"originaldata")
  //   for (let i = 0; i < originaldata.length; i++) {
  //     console.log(i,"checkFirstI")
  //   const findService = await Pricelist.findOne({
  //     FacilityNPI: originaldata[i].FacilityNPI,
  //     Organisationid: originaldata[i].Organisationid,
  //     DiagnosisTestorServiceName: originaldata[i].DiagnosisTestorServiceName,
  //   });

  //   console.log(findService,"findservice")
  //   if (findService) {
  //     console.log(findService, "checkFind");
  //     finalCSV.push(originaldata[i].DiagnosisTestorServiceName);
  //   }

  //   }
  // if (finalCSV.length !== 0) {
  //   throw Error(`${finalCSV} already exists`);
  // } else {

  //   var finalPublish = [];
  //   for (let i = 0; i < originaldata.length; i++) {
  //     console.log(i,"checkSecond")
  //     const facprice = {
  //       ...originaldata[i],
  //       ["FacilityPrices"]:
  //         originaldata[i].FacilityPrices === "" || null || undefined || 0
  //           ? originaldata[i].OrganisationPrices
  //           : originaldata[i].FacilityPrices,
  //     };
  //     finalPublish.push(facprice);
  //   }

  //   const createPricelist = await Pricelist.create(
  //     finalPublish
  //     //     , function (err, documents) {
  //     //     if (err) throw err;
  //     //   }
  //   );

  //   if (createPricelist.length === 0) {
  //     throw Error("Not Create");
  //   } else {
  //     // await fileConfirmation(file.emailData);
  //     return {
  //       message: "Successfully Published",
  //     };
  //   }
  //}
}
async function bulkUpdate(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  for (var item of body.PriceList) {
    await updatePricelist(item);
  }
  return { message: "Successfully Updated" };
}

async function updatePricelist(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  const findPricelist = await Pricelist.findOne({
    _id: body._id,
    FacilityNPI: body.FacilityNPI,
    Organisationid: body.Organisationid,
    DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
    FacilityName:body.FacilityName
  });
  if (findPricelist) {
    await Pricelist.findOneAndUpdate(
      {
        _id: body._id,
        FacilityNPI: body.FacilityNPI,
        Organisationid: body.Organisationid,
        DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
        FacilityName:body.FacilityName
      },
      {
        SNo: body.SNo,
        ServiceCode: body.ServiceCode,
        DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
        Organisationid: body.Organisationid,
        OrganisationPrices: body.OrganisationPrices,
        FacilityNPI: body.FacilityNPI,
        FacilityName: body.FacilityName,
        FacilityPrices: body.FacilityPrices,
        createdBy: body.FacilityNPI,
        createdDate: body.createdDate,
        updatedBy: body.FacilityNPI,
        updatedDate: new Date(),
      }
    );
    return { message: "Successfully saved" };
  } else {
    throw Error("Service not found");
  }
}
async function bulkDelete(body) {
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  for (var id of body.PriceList) {
    await deletePricelist(id);
  }
  return { message: "successfully Updated" };
}
async function deletePricelist(id) {
  if (id) {
    await Pricelist.deleteOne({ _id: id });
    return { message: "successfully deleted" };
  } else {
    throw Error("Service not found");
  }
}

async function getPriceListbyFacility(body) {
  const FacilityNPI = body.facilityNPI;
  const Organisationid = body.Organisationid;
  if (FacilityNPI) {
    const PricelistDetails = await Pricelist.aggregate([
      { $match: { FacilityNPI: FacilityNPI, Organisationid: Organisationid } },
      {
        $project: {
          // SNo: 1,
          ServiceCode: 1,
          DiagnosisTestorServiceName: 1,
          Organisationid: 1,
          OrganisationPrices: 1,
          FacilityNPI: 1,
          FacilityName: 1,
          FacilityPrices: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    return { data: PricelistDetails };
  } else {
    throw Error("please provide facility npi");
  }
}

// async function getPriceListone() {
//   // const PriceList = await Pricelist.aggregate([
//   //   {
//   //     $project: {
//   //       SNo: 1,
//   //       ServiceCode: 1,
//   //       DiagnosisTestorServiceName: 1,
//   //       Organisationid: 1,
//   //       OrganisationPrices: 1,
//   //       FacilityNPI: 1,
//   //       FacilityPrices: 1,
//   //       createdBy: 1,
//   //       createdDate: 1,
//   //       updatedBy: 1,
//   //       updatedDate: 1,
//   //     },
//   //   },
//   // ]);
//   // return { data: PriceList };
//   // if (DiagnosisTestorServiceName) {
//   //   await Pricelist.unique({ DiagnosisTestorServiceName: DiagnosisTestorServiceName });
//   //   return { message: "successfully filtered" };

//   // }
//   // await Pricelist.aggregate([
//   const PriceList = Pricelist.find().distinct("DiagnosisTestorServiceName");
//   return { data: PriceList }
//   // console.log("checked", PriceList);
//   // ]);
// }

// async function getPriceListbyService(body) {
//   const DiagnosisTestorServiceName = body.DiagnosisTestorServiceName;
//   const Organisationid = body.Organisationid;
//   if (DiagnosisTestorServiceName) {
//     const PricelistDetails = await Pricelist.aggregate([
//       {
//         $match: {
//           DiagnosisTestorServiceName: DiagnosisTestorServiceName,
//           Organisationid: Organisationid,
//         },
//       },
//       {
//         $project: {
//           SNo: 1,
//           ServiceCode: 1,
//           DiagnosisTestorServiceName: 1,
//           Organisationid: 1,
//           OrganisationPrices: 1,
//           FacilityNPI: 1,
//           FacilityName: 1,
//           FacilityPrices: 1,
//           createdBy: 1,
//           createdDate: 1,
//           updatedBy: 1,
//           updatedDate: 1,
//         },
//       },
//     ]);
//     return { data: PricelistDetails };
//   } else {
//     throw Error("please provide service");
//   }
// }

async function getPriceListbyService(body) {
  const DiagnosisTestorServiceName = body.DiagnosisTestorServiceName;
  const Organisationid = body.Organisationid;
  if (DiagnosisTestorServiceName) {
    const PricelistDetails = await Pricelist.aggregate([
      {
        $match: {
          DiagnosisTestorServiceName: DiagnosisTestorServiceName,
          Organisationid: Organisationid,
        },
      },
      {
        $lookup: {
          from: 'Facility', 
          localField: 'FacilityNPI', 
          foreignField: 'facilityNPI', 
          as: 'result'
        }
      }, {
        $unwind: {
          path: '$result'
        }
      },
      {
        $project: {
          SNo: 1,
          ServiceCode: 1,
          DiagnosisTestorServiceName: 1,
          Organisationid: 1,
          OrganisationPrices: 1,
          FacilityNPI: 1,
          FacilityName: '$result.facilityName',
          FacilityPrices: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    return { data: PricelistDetails };
  } else {
    throw Error("please provide service");
  }
}

async function createService(body) {
  // Check the Body parameters( atleast one parameter should be there)
  console.log("body ", body);
  if (Object.keys(body).length === 0) {
    throw Error("Invalid body parameter");
  }
  // const findOrganization = await Organization.findOne({ providerID: body.providerID });
  // if(!findOrganization){

  const findPricelist = await Pricelist.findOne({
    FacilityNPI: body.FacilityNPI,
    Organisationid: body.Organisationid,
    DiagnosisTestorServiceName: body.DiagnosisTestorServiceName,
  });
  const Orgprice = {
    
    ["OrganisationPrices"]:
      body.OrganisationPrices === "" || null || undefined || 0
        ? body.FacilityPrices
        : body.OrganisationPrices,
  };
  console.log(Orgprice,"orgprice")
  if (!findPricelist) {
    const pricelist = new Pricelist();
 
    (pricelist.Organisationid = body.Organisationid),
      (pricelist.ServiceCode = body.ServiceCode),
      (pricelist.DiagnosisTestorServiceName = body.DiagnosisTestorServiceName),
      (pricelist.OrganisationPrices = Orgprice.OrganisationPrices),
      (pricelist.FacilityNPI = body.FacilityNPI),
      (pricelist.FacilityName = body.FacilityName),
      (pricelist.FacilityPrices = body.FacilityPrices),
      // createdBy: body.FacilityNPI,
      // createdDate: body.createdDate,
      // updatedBy: body.FacilityNPI,
      // updatedDate: new Date(),
      await pricelist.save();
    return { message: "Successfully created" };
  } else {
    throw Error("Service already exists");
  }
}

async function getPriceListbyOrg(body) {
  const Organisationid = body.Organisationid;
  if (Organisationid) {
    const PricelistDetails = await Pricelist.aggregate([
      { $match: { Organisationid: Organisationid } },
      {
        $project: {
          // SNo: 1,
          ServiceCode: 1,
          DiagnosisTestorServiceName: 1,
          Organisationid: 1,
          OrganisationPrices: 1,
          FacilityNPI: 1,
          FacilityName: 1,
          FacilityPrices: 1,
          createdBy: 1,
          createdDate: 1,
          updatedBy: 1,
          updatedDate: 1,
        },
      },
    ]);
    return { data: PricelistDetails };
  } else {
    throw Error("please provide facility npi");
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////

async function fileAdminConfirmation(id, filePath) {
  const findFilePath = await PathPricelist.findOne({ _id: id });

  if (findFilePath) {
    await PathPricelist.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status: "verified",
          filePath: filePath,
          fileFormat: "Standard",
          updatedBy: "Admin",
          updatedDate: new Date(),
        },
      }
    );

    return { message: "success" };
  } else {
    throw Error("file not exit");
  }
}

async function sendAdminConfirmationEmail(email, filename) {
  // console.log("Check");
  // var uId=emailData.userID

  const mailOptions = await transport.sendMail(
    {
      from: "healthlens.demo@meiiporul.com",
      to: email,
      subject: "Please confirm your account",
      html: `<h1>PriceList Confirmation</h1>
      <p> File has been modified and uploaded in our application </p>
        <p>${filename}-Please check and publish the data</p>`,
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

async function uploadAdminPricelist(file) {
  console.log(file, "filebody");
  const filedata = file.csv;
  if (filedata.length !== 0) {
    var finalCSV = [];
    for (let i = 0; i < filedata.length; i++) {
      console.log(filedata[i].FacilityNPI, filedata[i].Organisationid);
      const findService = await Pricelist.findOne({
        FacilityNPI: filedata[i].FacilityNPI,
        Organisationid: filedata[i].Organisationid,
        DiagnosisTestorServiceName: filedata[i].DiagnosisTestorServiceName,
      });
      if (findService) {
        console.log(findService, "checkFind");
        finalCSV.push(filedata[i].DiagnosisTestorServiceName);
      }
    }

    if (finalCSV.length !== 0) {
      throw Error(`${finalCSV} already exists`);
    } else {
      const csvData = csvjson.toCSV(filedata, {
        headers: "key",
      });
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, "0");
      var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
      var yyyy = today.getFullYear();

      today = mm + "-" + dd + "-" + yyyy;
      const filename =
        "Admin" + "_" + today + "_" + Date.now() + "_" + file.name;
      let uploadPath = __dirname + "/uploads/" + filename;

      fs.writeFile(uploadPath, csvData, (err) => {
        if (err) console.error(err);
        else {
          console.log("Ok");
        }
      });

      const pathConfirmation = await fileAdminConfirmation(
        file.id,
        "/uploads/" + filename
      );
      if (pathConfirmation.message === "success") {
        const mailConfrimation = await sendAdminConfirmationEmail(
          file.email,
          filename
        );
        if (mailConfrimation.message === "success") {
          return { message: "Successfully file upload" };
        } else {
          throw Error("mail not sent");
        }
      } else {
        throw Error("Something Wrong");
      }
    }
  } else {
    throw Error("Invalid data");
  }
}
