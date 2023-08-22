import { Router } from "express";

import ServiceLocationSchema from './servicelocation.schema.js';

const router = Router();

export default router;

router.get ("/findservicelocation", async(req,res) => {
    let data = await ServiceLocationSchema.aggregate([
        {$project : 
        {
            _id : 0,
            service_code:1,
            serviceLocationName : 1
         
        }}
    ])
    res.send(data)
})