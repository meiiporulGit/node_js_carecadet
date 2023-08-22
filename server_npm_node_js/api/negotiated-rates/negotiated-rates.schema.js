import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;





const NegotiatedRatesSchema = new schema({
    billing_code: { type: String },
    billing_code_type: { type: String },
    billing_code_type_version: { type: String },
    description: { type: String },
    name:  { type: String },
    negotiation_arrangement: { type: String },
    billing_class: { type: String },
    expiration_date: { type: String },
    negotiated_rate: { type: Number, default: 0.0 },
    negotiated_type: { type: String },
    service_code: { type: Array, of: String },
    npi: { type: Array },
    tin_type: { type: String },
    tin_value: { type: String },
    plan_id:{ type: String },
    plan_name: { type: String },
    payer_or_reporting_name:{ type: String },
    in_network_file_raw_name:{ type: String },
    hash_id: { type: Number},
     
    
},
{
    versionKey: false,
    strict: true,
    collection: "NegotiatedRates"
});

export const NegotiatedRates = db.model("NegotiatedRates", NegotiatedRatesSchema);