import { Schema } from "mongoose";
import db from "../../core/mongodb/mongo-connection.js";
var schema = Schema;

const cashpriceschema = new schema(
  {    
    serviceCode: { type: String },
    code_type:{ type: String },
    serviceName:  { type: String },
    hospitalID: { type: String },
    inpatient_outpatient_flag: { type: String },
    cashPrice: { type: String },
    dis_min: { type: String },
    dis_max: { type: String },
    NPI: { type: String },
  },
  {
    versionKey: false,
    strict: true,
    collection: "provider_cash_price",
  }
);

var Cashprice = db.model("provider_cash_price", cashpriceschema);

export default Cashprice;