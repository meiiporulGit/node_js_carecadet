import { Router } from "express";
import SearchService from "./search.service.js"
import ResObject from "../../core/util/res-object.js";
const router = Router();

export default router;

router.get('', search)

function search(req, res, next) {
    SearchService.search(req.query)
    .then((obj) => {
        new ResObject(res, obj);
      })
      .catch(next);
}