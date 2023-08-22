import { Router } from "express";
import FacilityService from "./facility.service.js";
import ResObject from '../../core/util/res-object.js';
import {Lookup} from './facility.schema.js';
import {FacilityTypeLookup} from './facility.schema.js'

const router = Router();

export default router;

router.get('/getFacilityList',getFacilityList);
router.get('/getFacilityByProvider',getFacilityByProvider);
router.post('/createFacility',createFacility);
router.put('/updateFacility',updateFacility);
router.delete('/deleteFacility',deleteFacility);

router.get ("/findfacilityNPI",async(req,res) => {
    let data = await Lookup.aggregate([
        {$project:
        {
            _id : 0,
            facilityNPI : 1,
            facilityName : 1,
            addressLine1 : 1,
            addressLine2 : 1,
            city : 1,
            state : 1,
            zipCode : 1,
            latitude : 1,
            longitude : 1
        }}, 
        
    ])
    res.send(data)
})
router.get ("/findfacilityType", async(req,res) => {
    let data = await FacilityTypeLookup.aggregate([
        {$project : 
        {
            _id : 0,
            facilityTypeId : 1,
            item : 1,
            value : 1
        }}
    ])
    res.send(data)
})

// router.get ("/findfacilityType", async(req,res) => {
//     let data = await FacilityTypeLookup.find({})
//     res.send(data)
// })
function getFacilityList(req,res,next) {
    FacilityService.getFacilityList().then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function getFacilityByProvider(req,res,next) {
    const providerID = req.query.providerID;
    FacilityService.getFacilityByProvider(providerID).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function createFacility(req,res,next) {
    const body = req.body ?? {};
    FacilityService.createFacility(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function updateFacility(req,res,next) {
    const body = req.body ?? {};
 FacilityService.updateFacility(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}

function deleteFacility(req,res,next) {
    const facilityNPI = req.query.facilityNPI ?? null;
   FacilityService.deleteFacility(facilityNPI).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}