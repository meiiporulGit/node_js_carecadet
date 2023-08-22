import { Schema } from "mongoose";
var schema = Schema;
import db from "../../../core/mongodb/mongo-connection.js";

let UserSessionSchema = new schema({
    userSessionID: { type: String, required: [true, 'Enter a Usersession id'], unique: [true, 'Usersession id already exist'] },
    sessionKey: { type: String, required: [true, 'Enter a Sessionkey'] },
    applicationId: { type: String, default: "", },
    userName: { type: String, required: [true, 'Enter a Username'] },
    collectionName: { type: String, required: [true, 'Enter a Collection name'] },
    deviceDetail: { type: Array, default: [] },
    startDate: { type: Date, default: Date.now},
    endDate: { type: Date },
    activeStartDate: { type: Date, default: Date.now},
    activeEndDate: { type: Date },
    remark: { type: String, default: "", uppercase: true, trim: true },
    isActive: { type: String, required: [true, 'Enter a Active status'] },
    createdBy: { type: String, required: true },
    createdDate: { type: Date, default: Date.now},
    updatedBy: { type: String, default: "" },
    updatedDate: { type: Date, default: null },
    version: {type: Number, default: 1},
    versionRemark: {type: String, uppercase: true, default: "1: BASELINE"}
},{
    versionKey: false,
    strict: true,
    collection: "UserSession"
});

var UserSession = db.model('UserSession',UserSessionSchema);
export default UserSession;