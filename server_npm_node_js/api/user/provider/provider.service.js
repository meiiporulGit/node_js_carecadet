import Provider from "./provider.schema.js";
import { createId } from "../../../shared/common-util.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import _ from "lodash";

export default {
  createProvider,
  updateProvider,
  getProviderList,
  deleteProvider,
  createAdmin,
  forgotPassword,
  resetPassword
 
};
dotenv.config();



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
      from: "healthlens.demo@meiiporul.com",
      cc:"healthlens.demo@meiiporul.com",
      to: _email,
      subject: "Email Confirmation",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${firstName}</h2>
          <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
       
        <a href=${process.env.BASE_URL}/user/confirm?firstName=${firstName}&email=${tokenmailverification}> Click here</a>
          </div>`,
    }
   
  );
  return { message: "success" };
  
}


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
  console.log(findProvider,'findprovider')
  if (findProvider) {
   
    await Provider.findOneAndUpdate(
      { providerID: body.providerID },
      {
        $set: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          contact: body.contact,
          username: body.email,
          role: body.role,
          remark: body.remark,
          updatedBy: body.userID,
          updatedDate: new Date(),
        },
      }
    );
    return { message: "Provider Details successfully updated" };
  } else {
    throw Error("Provider does not exists");
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




async function forgotPassword(email) {
  
  const findEmail = await Provider.findOne({ email });
  console.log("findEmail", findEmail)
  if (!findEmail) {
    throw Error('User doesnot exists with this email')
  } else {
    const resettoken = await jwt.sign({ id: findEmail._id }, process.env.RESET_PASSWORD_KEY, { expiresIn: '1d' });
    console.log(resettoken, "resettoken")
    const data = {
      from: 'healthlens.demo@meiiporul.com',
      cc:'healthlens.demo@meiiporul.com',
      to: email,
      subject: "Please activate your link",
      html: `<h2>Please click on the given link to reset your password</h2>
                 
                 <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
              
               <a href=${process.env.APPBASE_URL}/provider/resetpass?resettoken=${resettoken}> Click here</a>
                 </div>`,
    };
    const resetPass = await findEmail.updateOne({ resetLink: resettoken })
    console.log("resetPass", resetPass)
    if (!resetPass) {
      throw Error('resetLink not updated')
    }
    else {
      const resetemail = await transport.sendMail(data)
      if (resetemail) {
        return { message: "Password reset mail has been sent" }

      } else {
        throw Error(
          "User does not exit"
        )
      }
    }
  }
}
          async function resetPassword(body) { 
            const {newPass,resetLink} =body;
            console.log("newPass",body)
            if(resetLink){
             const decodreset= await jwt.verify(resetLink,process.env.RESET_PASSWORD_KEY)
                  if (!decodreset){
                    // return res.status(401).json({
                    //     error:"Incorrect token or it is expired"
                    // })
                    throw Error ("Incorrect token or it is expired")
                  }
                
             var findresetLink=  await Provider.findOne({resetLink})
             console.log("findresetLink",findresetLink)
                    if(!findresetLink){
                        // return res.status(400).json({error:"User with this token does not exist"})
                        throw Error("User with this token does not exist")
                    }
                    const obj = {
                        password:newPass,
                        resetLink:""
                    }
                    console.log("obj",obj)
                     findresetLink = _.extend(findresetLink,obj);
                     console.log("newpassword",findresetLink)
                    findresetLink.save(async(err,result)=>{
                        if(err){
        
                            return {err:"password reset error"}
                        } else{
                          
                            const resetdata={
                                from: 'healthlens.demo@meiiporul.com',
                                 to:findresetLink.email,
                                subject: "Password updated successfully",
                                html: `<h2>Password  updated successfully</h2>`
                                   
                              };
                              await transport.sendMail(resetdata);
                            return {message:"password has been updated successfully"}
                        }
                        
                    })
                  
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


   