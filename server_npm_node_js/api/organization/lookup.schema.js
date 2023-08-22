import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;



let LookupSchema = new schema({
state:{type:String},
state_abbr:{type:String},
county:{type:String},
city:{type:String},
ZIP_CODE:{type:String},
LAT:{type:String},
LONG:{type:String},


}
    ,{
    versionKey: false,
    strict: true,
    collection: "CityStateZipcode"
});

const Organization = db.model('CityStateZipcode',LookupSchema);
export default Organization;