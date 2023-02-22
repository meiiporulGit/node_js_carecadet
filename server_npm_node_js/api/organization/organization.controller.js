import { Router } from "express";
import OrganizationService from "./organization.service.js";
import ResObject from '../../core/util/res-object.js';
import path from 'path';
import multer from 'multer';

const router = Router();

export default router;
let storage =  multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./images')
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname) )
        
    }
    
})
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(new Error("File format should be PNG,JPG,JPEG"), false); 
    }
  };

let upload =  multer({
    storage : storage,
    fileFilter: fileFilter 
})


router.get('/getOrganizationList',getOrganizationList);
router.get('/getOrganizationByProvider',getOrganizationByProvider);
router.post('/createOrganization',createOrganization);
router.put('/updateOrganization',upload.single('file'),updateOrganization);
router.delete('/deleteOrganization',deleteOrganization);
router.get("/cityStateList",getCityStatelist)
router.post("/image", upload.single("file"), (req, res) => {
        res.status(200).json({message:"uploaded successfully",data:req.file})
})


function getOrganizationList(req,res,next) {
    OrganizationService.getOrganizationList().then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}


function getCityStatelist(req,res,next) {
    OrganizationService.getCityStateList().then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function getOrganizationByProvider(req,res,next) {
    const providerID = req.query.providerID;
    OrganizationService.getOrganizationByProvider(providerID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function createOrganization(req,res,next) {
    const body = req.body ?? {};
    OrganizationService.createOrganization(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function updateOrganization(req,res,next) {
    const body = req.body ?? {};
    OrganizationService.updateOrganization(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function deleteOrganization(req,res,next) {
    const organizationID = req.query.organizationID ?? null;
    OrganizationService.deleteOrganization(organizationID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}