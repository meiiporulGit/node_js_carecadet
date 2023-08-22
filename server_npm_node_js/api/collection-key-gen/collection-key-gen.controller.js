import { Router } from 'express';
const router = Router();
import CollectiobKeyGenService from './collection-key-gen.service.js';

export default router;

router.post('/createCollectionKeyGen', createCollectionKeyGen);
router.patch('/updateCollectionKeyGen', updateCollectionKeyGen);
router.delete('/deleteCollectionKeyGen', deleteCollectionKeyGen);
router.post('/getCollectionKeyGen', getCollectionKeyGen);


function createCollectionKeyGen(req, res, next) {
    const body = req.body ? req.body : {};
    CollectiobKeyGenService.createCollectionKeyGen(body).then((message) => {
        res.json({ message: message });
    }).catch(next);
}

function updateCollectionKeyGen(req, res, next) {
    const body = req.body ? req.body : {};
    CollectiobKeyGenService.updateCollectionKeyGen(body)
        .then(response => {
            res.json(response);
        }).catch(next);
}

function deleteCollectionKeyGen(req, res, next) {
    console.log("req.query.collectionKeyGenID",req.query.collectionKeyGenID);
    if (!req.query.collectionKeyGenID) {
        throw "Params not yet passed";
    }
    console.log("req.query.collectionKeyGenID", req.query.collectionKeyGenID);
    CollectiobKeyGenService.deleteCollectionKeyGen(req.query.collectionKeyGenID)
        .then(response => {
            res.json(response);
        }).catch(next);
}

function getCollectionKeyGen(req, res, next) {
    const body = req.body ? req.body : {};
    // if (!req.query.contractorID) {
    //     throw "Params not yet passed";
    // }
    CollectiobKeyGenService.getCollectionKeyGen(body).then(response => {
        res.json(response);
    }).catch(next);
}

