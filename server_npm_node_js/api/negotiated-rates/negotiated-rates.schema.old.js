import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;

const NegotiatedPrices = new schema({
    negotiated_rate: { type: Number, default: 0.0 },
    service_code: { type: Array, of: String },
    negotiated_type: { type: String },
    expiration_date: { type: String },
    billing_class: { type: String },
    billing_code_modifier: { type: Array },
    additional_information: { type: String },
},
{
    _id: false
})

const ProviderGroups = new schema({
    npi: { type: Array },
    tin: {
        type: { type: String },
        value: { type: String },
    }
},
{
    _id: false
})

const NegotiatedRate = new schema({
    negotiated_prices: [NegotiatedPrices],
    provider_groups: [ProviderGroups]
},
{
    _id: false
})

const NegotiatedRatesSchema = new schema({
    negotiation_arrangement: { type: String },
    name:  { type: String },
    billing_code_type: { type: String },
    billing_code_type_version: { type: String },
    billing_code: { type: String },
    description: { type: String },
    in_network_hash_id: { type: String },
    negotiated_rates: [NegotiatedRate]
},
{
    versionKey: false,
    strict: true,
    collection: "NegotiatedRates"
});

export const NegotiatedRates = db.model("NegotiatedRates", NegotiatedRatesSchema);