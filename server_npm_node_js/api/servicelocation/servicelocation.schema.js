import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;



let LocationSchema = new schema({
service_code:{type:String},
serviceLocationName:{type:String},

}
    ,{
    versionKey: false,
    strict: true,
    collection: "ServiceLocationLookup"
});

const ServiceLocationSchema = db.model('ServiceLocationLookup',LocationSchema);
export default ServiceLocationSchema;