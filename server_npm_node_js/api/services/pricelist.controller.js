import { Router } from "express";
import PricelistService from "./pricelist.service.js";
import ResObject from "../../core/util/res-object.js";
const router = Router();

export default router;

router.post("/uploadPricelist", uploadPricelist);
router.post("/unknownHeaderPricelist", unknownHeaderPricelist);
router.post("/publishPricelist", publishPricelist);
router.get("/getPriceList", getPriceList);
router.get("/getPriceListbyFacility", getPriceListbyFacility);
router.get("/getPriceListbyService", getPriceListbyService);
router.put("/updatePricelist", updatePricelist);
router.delete("/deletePricelist", deletePricelist);
router.delete("/bulkdelete", bulkDelete);
router.put("/bulkupdate", bulkUpdate);
router.get("/getPriceListone", getPriceListone);
router.post("/createservice", createService);





function getPriceList(req, res, next) {
  PricelistService.getPriceList()
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function uploadPricelist(req, res, next) {
  // let file = req.files.screenshot;
  // console.log("Body",req.body);
  let file = req.body;
  PricelistService.uploadPricelist(file)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
  // console.log("check");
  // res.send(200);
}

function unknownHeaderPricelist(req, res, next) {
  // let file = req.files.screenshot;
  // console.log("Body",req.body);
  let file = req.body;
  PricelistService.unKnownHeaderPricelist(file)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
  // console.log("check");
  // res.send(200);
}

function publishPricelist(req, res, next) {
  let file = req.body;
  PricelistService.publishPricelist(file)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}
function getPriceListbyFacility(req, res, next) {
  const facilityNPI = req.query;
  PricelistService.getPriceListbyFacility(facilityNPI)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function getPriceListbyService(req, res, next) {
  const DiagnosisTestorServiceName = req.query;
  PricelistService.getPriceListbyService(DiagnosisTestorServiceName)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}
function updatePricelist(req, res, next) {
  const body = req.body ?? {};
  PricelistService.updatePricelist(body)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function bulkUpdate(req, res, next) {
  const body = req.body ?? {};
  PricelistService.bulkUpdate(body)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function bulkDelete(req, res, next) {
  const body = req.body ?? {};
  PricelistService.bulkDelete(body)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function deletePricelist(req, res, next) {
  const _id = req.query._id ?? null;
  PricelistService.deletePricelist(_id)
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function getPriceListone(req, res, next) {
  PricelistService.getPriceListone()
    .then((obj) => {
      new ResObject(res, obj);
    })
    .catch(next);
}

function createService(req,res,next) {
  const body = req.body ?? {};
 PricelistService.createService(body).then(obj => {
      new ResObject(res,obj);
  }).catch(next);
}




