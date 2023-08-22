import { Router } from "express";

import {FacilityTypeLookup} from './facility.schema.js'

const router = Router();

export default router;

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