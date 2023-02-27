import { Router } from "express";
import ResObject from "../../../core/util/res-object.js";
import ProviderService from './provider.service.js';
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import smtpTransport from'nodemailer-smtp-transport';
import Provider from "./provider.schema.js";
import _ from "lodash";

const router = Router();

export default router;

router.get('/getProviderList', getProviderList);
router.post('/createProvider',createProvider);
router.put('/updateProvider',updateProvider);
router.delete('/deleteProvider',deleteProvider);
router.post("/createAdmin",createAdmin)

// router.get('/confirm',confirmEmail)
dotenv.config();

function getProviderList(req,res,next){
    ProviderService.getProviderList().then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function createProvider(req,res,next) {
    const body = req.body ?? {};
    ProviderService.createProvider(body).then(obj => {
        new ResObject(res,obj);
       
    }).catch(next);
}

function updateProvider(req,res,next) {
    const body = req.body ?? {};
    ProviderService.updateProvider(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function deleteProvider(req,res,next){
    const providerID = req.query.providerID ?? null;
    ProviderService.deleteProvider(providerID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}



// function confirmEmail(req,res,next){
//     const query= req.query
//     ProviderService.updateConfirmEmail(query).then(obj=>{
//         console.log("verify successully")
//         res.json("sucess updated")
//     }).catch(next)
// }

///////////////////////////////////////Admin Create //////////////////////////////////////////////


function createAdmin(req,res,next) {
    const body = req.body ?? {};
    ProviderService.createAdmin(body).then(obj => {
       
        new ResObject(res,obj);
       
        }).catch(next);
}
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


router.put('/forgotpassword',async (req,res)=>{
    
    const {email}=req.body

    const findEmail = await Provider.findOne({email});
    console.log("findEmail",findEmail)
       if(!findEmail){
           throw Error('User doesnot exists with this email')
       } else {
       const resettoken = jwt.sign({id:findEmail._id},process.env.RESET_PASSWORD_KEY,{expiresIn: '1d'});
       console.log(resettoken,"resettoken")    
       const data={
               from: 'healthlens.demo@meiiporul.com',

               to:email,
               subject: "Please Activate your link",
               html: `<h2>Please click on the given link to reset your password</h2>
                   
                   <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
                
                 <a href=${process.env.APPBASE_URL}/provider/resetpass?resettoken=${resettoken}> Click here</a>
                   </div>`,
             };
          const resetPass= await findEmail.updateOne({resetLink:resettoken})
            console.log("resetPass",resetPass)
                if(!resetPass) {
                    throw Error('resetLink not updated')
                }
                    else 
                    {
                    const resetemail = await transport.sendMail(data)
                  if(resetemail){
                   res.send({message:"Password reset mail has been sent"})
                 
                  } else{
                    throw Error (
                        "Password reset mail has not been sent"
                    )
                   
                  }
                    
                    }
                
             }
            }
)
          
   

  

router.put('/resetpassword',async(req,res)=>{
   
    const {newPass,resetLink} = req.body;
    console.log("newPass",req.body)
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

                    return res.send({err:"password reset error"})
                } else{
                  
                    const resetdata={
                        from: 'healthlens.demo@meiiporul.com',
         
                        to:findresetLink.email,
                        subject: "Password updated successfully",
                        html: `<h2>Password  updated successfully</h2>
                           `
                      };
                      await transport.sendMail(resetdata);
                    return res.send({message:"password has been updated successfully"})
                }
                
            })
          
          }
        })
        
        
    
