import { Schema } from "mongoose";
import db from '../../core/mongodb/mongo-connection.js';
var schema = Schema;

let Address = new schema({
    addressLine1: { type: String, required: [true,'Enter Address Line 1'], trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true, required: [true,'Enter City'] },
    state: { type: String, trim: true, required: [true,'Enter State'] },
    zipCode: { type: String, trim: true, required: [true,'Enter zip code'] },
},{
    _id: false
})

let FacilitySchema = new schema({
    facilityID: { type: String, required: [true, 'Enter a Facility ID'], trim: true, unique: [true, 'facility id already exist'] },
    providerID: { type: String, 
        // required: [true, 'Enter a provider ID'], 
        trim: true, 
        // unique: [true, 'provider id already exist'] 
    },
    facilityName: { type: String, required: [ true,'Enter Facility Name'] ,trim: true},
    facilityType:{type: String, required: [ true,'Enter Facility Type'] ,trim: true},
    facilityNPI:{type: String, trim: true},
    address: Address,
    email: { type: String,  required: [ true, 'Enter a email'], trim: true},
    contact: { type: String,  required: [ true, 'Enter a contact'], trim: true},
    remark: { type: String, default: "", uppercase: true, trim: true },
    isActive: { type: String, required: [true, 'Enter a active status'], default: 'Y' },
    activeStartDate: { type: Date, default: Date.now },
    activeEndDate: { type: Date, default: null },
    createdBy: { type: String, default: ""},
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "" },
    updatedDate: { type: Date, default: null },
    version: { type: Number, default: 1 },
    versionRemark: { type: String, uppercase: true, default: "1: BASELINE" }
},{
    versionKey: false,
    strict: true,
    collection: "Facility"
});
let LookupSchema = new schema({
   
    // facilityID: { type: String, required: [true, 'Enter a Facility ID'], trim: true, unique: [true, 'facility id already exist'] },
     facilityName: { type: String, required: [ true,'Enter Facility Name'] ,trim: true},
    facilityType:{type: String, required: [ true,'Enter Facility Type'] ,trim: true},
    facilityNPI:{type: String, trim: true},
    addressLine1: { type: String, required: [true,'Enter Address Line 1'], trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true, required: [true,'Enter City'] },
    state: { type: String, trim: true, required: [true,'Enter State'] },
    zipCode: { type: String, trim: true, required: [true,'Enter zip code'] },
    email: { type: String,  required: [ true, 'Enter a email'], trim: true},
    contact: { type: String,  required: [ true, 'Enter a contact'], trim: true},
   
   
},
{
    versionKey: false,
    strict: true,
    collection: "Lookup"
})
export const Lookup = db.model('Lookup',LookupSchema)
const Facility = db.model('Facility',FacilitySchema);
export default Facility;