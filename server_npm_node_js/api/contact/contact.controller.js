import { Router } from "express";

import ContactEmailSerivce from "./contact.service.js"
import ResObject from '../../core/util/res-object.js';

const router = Router();

export default router;


router.post("/contactEmail",contactEmail)


function contactEmail(req,res,next) {
    const body=req.body
    ContactEmailSerivce.createEmail(body).then(obj => {
        new ResObject(res,obj);
    }).catch(next);
}