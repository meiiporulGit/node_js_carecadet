import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;

let InsuranceProviderLookupSchema = new schema({
    insuranceProviderID:{type: String, trim: true},
insuranceProvider:{type: String, trim: true},
      },
{
    versionKey: false,
    strict: true,
    collection: "InsuranceProviderLookup"
})

 


export const InsuranceProviderLookup = db.model('InsuranceProviderLookup',InsuranceProviderLookupSchema)

