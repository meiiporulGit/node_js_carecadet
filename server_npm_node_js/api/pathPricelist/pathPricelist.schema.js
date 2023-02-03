import { Schema } from "mongoose";
import db from "../../core/mongodb/mongo-connection.js";
var schema = Schema;

const pathPricelistschema = new schema(
  {
    status:{type:String,default:"Pending"},
    filePath:{type:String,require:true},
    fileFormat:{type:String,require:true},
    providerName:{type:String,require:true},
    providerID:{type:String,require:true},
    organizationID:{type:String,require:true},
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
    collection: "PathPricelist",
  }
);

var PathPricelist = db.model("PathPricelist", pathPricelistschema);

export default PathPricelist;
