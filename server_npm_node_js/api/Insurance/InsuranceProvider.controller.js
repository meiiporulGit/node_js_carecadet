import { Router } from "express";

import {InsuranceProviderLookup} from "./InsuranceProvider.schema.js"

const router = Router();

export default router;

router.get ("/findinsuranceProvider", async(req,res) => {
    let data = await InsuranceProviderLookup.aggregate([
        {$project : 
        {
            _id : 0,
            insuranceProviderID:1,
            insuranceProvider:1
        }}
    ])
    res.send(data)
    console.log("1111111111")
})