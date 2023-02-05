import { Router } from "express";
import ResObject from "../../../core/util/res-object.js";
import ProviderService from './provider.service.js'

const router = Router();

export default router;

router.get('/getProviderList', getProviderList);
router.post('/createProvider',createProvider);
router.put('/updateProvider',updateProvider);
router.delete('/deleteProvider',deleteProvider);
router.post("/createAdmin",createAdmin)
// router.get('/confirm',confirmEmail)

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