import { Schema } from "mongoose";
import db from "../../core/mongodb/mongo-connection.js";
var schema = Schema;

const pricelistschema = new schema(
  {
    SNo: { type: String, required: false },
    ServiceCode: { type: String, required: false },
    DiagnosisTestorServiceName: { type: String, required: true },
    Organisationid: { type: String, required: false },
    OrganisationPrices: { type: String, required: false },
    FacilityNPI: { type: String, required: false },
    FacilityName: { type: String, required: false },
    FacilityPrices: { type: String, required: false },
    createdBy: { type: String, default: "" },
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "" },
    updatedDate: { type: Date, default: null },
    version: { type: Number, default: 1 },
    versionRemark: { type: String, uppercase: true, default: "1: BASELINE" },
  },
  {
    versionKey: false,
    strict: true,
    collection: "pricelist",
  }
);

var Pricelist = db.model("pricelist", pricelistschema);

export default Pricelist;
