import { Router } from "express";
import PathPricelistService from "./pathPricelist.service.js";
import ResObject from "../../core/util/res-object.js";
import path from "path"
import fs from "fs"
import csv from "csvtojson"


const router = Router();

const __dirname = path.resolve(path.dirname(""));

export default router;

router.get("/verify", fileConfirm);
router.get("/getPathByProvider",getPathInfoByProvider)
router.get("/check",getFile)
router.get("/nonStandard",nonStandard)

function fileConfirm(req, res, next) {
    const body=req.query
    PathPricelistService.fileConfirmation(body)
      .then((obj) => {
       if(obj.message==="Successfully verified"){
        res.sendFile('./api/pathPricelist/PathPrice.html', {root: __dirname })
       }else{
        res.json(obj.message)
       }
      })
      .catch(next);
  }

  function getPathInfoByProvider(req, res, next) {
    const body=req.query
    PathPricelistService.getPathInfoByProvider(body)
      .then((obj) => {
        new ResObject(res, obj);
      })
      .catch(next);
  }

  function nonStandard(req,res,next){
    PathPricelistService.nonStandard().then((obj)=>{
      new ResObject(res,obj)
    }).catch(next)
  }

  function getFile(req,res,next){
    const body=req.query
   const inputPath="uploads/"+body.file
// console.log(inputPath)



  // console.log(fileData,"check file")
  csv()
  .fromFile(inputPath)
  
  .then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
     res.json(jsonArrayObj)
   })

   

  
  // parse(fileData, {columns: false, trim: true}, function(err, rows) {
  //   // Your CSV data is in an array of arrys passed to this callback as rows.
  // })
// })
  }