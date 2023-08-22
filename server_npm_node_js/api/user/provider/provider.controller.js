import { Router } from "express";
import ResObject from "../../../core/util/res-object.js";
import ProviderService from './provider.service.js';
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import _ from "lodash";

const router = Router();

export default router;

router.get('/getProviderList', getProviderList);
router.post('/createProvider',createProvider);
router.put('/updateProvider',updateProvider);
router.delete('/deleteProvider',deleteProvider);
router.post("/createAdmin",createAdmin)
router.put("/forgotpassword",forgotPassword);
router.put("/resetpassword",resetPassword);

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

function forgotPassword(req,res,next){
    const body = req.body.email;
    ProviderService.forgotPassword(body).then(obj=>{
        new ResObject(res,obj);
    }).catch(next);
}

function resetPassword(req,res,next){
    const body = req.body ?? {};
    ProviderService.resetPassword(body).then(obj=>{
        new ResObject(res,obj);
    }).catch(next);
}


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



        
        
    
