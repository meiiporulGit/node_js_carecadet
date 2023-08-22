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

let Contactpersoninformation ={
    firstName: { type: String, required: [true,'Enter Firstname'], trim: true },
    lastName: { type: String,required: [true,'Enter lastname'],trim: true },
    role: { type: String, trim: true, required: [true,'Enter Role'] },
    contact: { type: String, trim: true, required: [true,'Enter contact'] },
    email: { type: String, trim: true, required: [true,'Enter Email'] },
}

let OrganizationSchema = new schema({
    organizationID: { type: String, required: [true, 'Enter a organization ID'], trim: true, unique: [true, 'organization id already exist'] },
    providerID: { type: String, 
        // required: [true, 'Enter a provider ID'], 
        trim: true, 
        // unique: [true, 'provider id already exist'] 
    },
    organizationName: { type: String, required: [ true,'Enter Organization Name'] ,trim: true},
    orgImg:{type:String},
    address: Address,
    email: { type: String,  required: [ true, 'Enter a email'], trim: true},
    contact: { type: String,  required: [ true, 'Enter a contact'], trim: true},
    contactPerson:Contactpersoninformation,
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
    collection: "Organization"
});

const Organization = db.model('Organization',OrganizationSchema);
export default Organization;