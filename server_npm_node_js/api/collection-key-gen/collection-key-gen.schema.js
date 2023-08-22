import { Schema } from 'mongoose';
var schema = Schema;
import db from '../../core/mongodb/mongo-connection.js';

let CollectionKeyGenSchema = new schema({
    collectionKeyGenID: { type: String, required: [true, 'Enter a collection key ID'], trim: true, unique: [true, 'collection key id already exist'] },
    collectionName:{ type: String, required: [true, 'Enter a collection name'], trim: true, unique: [true, 'collection name already exist'] },
    code: { type: String, required: true,uppercase:true },
    separator: { type: String },
    lastCounter: { type: Number,  required: [true, 'Enter a last Counter'], trim: true, },
    remark: { type: String, default: "", uppercase: true, trim: true },
    isActive: { type: String, required: [true, 'Enter a active status'] },
    activeStartDate: { type: Date, default: Date.now },
    activeEndDate: { type: Date, default: null },
    createdBy: { type: String, default: ""},
    createdDate: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "" },
    updatedDate: { type: Date, default: null },
    version: { type: Number, default: 1 },
    versionRemark: { type: String, uppercase: true, default: "1: BASELINE" }
}, {
    versionKey: false,
    strict: true,
    collection: "CollectionKeyGen"
});

// Compile model from schema
var CollectionKeyGenMenu = db.model('CollectionKeyGen', CollectionKeyGenSchema);
export default CollectionKeyGenMenu;
