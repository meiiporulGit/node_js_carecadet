import { Schema } from 'mongoose'
var schema = Schema;
import db from '../../../core/mongodb/mongo-connection.js'
import bcrypt from 'bcryptjs';

let ProviderSchema = new schema({
    providerID: { type: String, unique: [ true, 'Provider already exists '], required: [ true, 'Enter a provider id']},
    firstName: { type: String, required: [ true, 'Enter a first name']},
    lastName: { type: String,  
        required: [ true, 'Enter a last name']
    },
    email: { type:String,  required: [ true, 'Enter a email'], unique: [ true, 'Already a email exists']},
    contact: { type: String,  
        // required: [ true, 'Enter a contact']
    },
    username: { type: String,  
        // required: [ true, 'Enter a first name']
    },
    password: { type: String,  required: [ true, 'Enter a password']},
    role: { type: String, default: 'owner'},
    // status: {
    //     type: String, 
    //     enum: ['Pending', 'Active'],
    //     default: 'Pending'
    //   },
    // confirmationCode: { type: String,unique: true },
        
    remark: { type: String, default: "", uppercase: true, trim: true },
    isActive: { type: String, 
        // required: [true, 'Enter a active status'],default: 'Y',
        enum: ['Pending', 'Active','Y']
     },
     resetLink:{type:String,default:""},
   
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
    collection: "Provider",
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
    }
});

ProviderSchema.pre('save', function (next) {
    var user = this;
    // generate a salt
    bcrypt.genSalt(parseInt(process.env.SALT_WORK_FACTOR),function (err,salt) {
        if (err) return next(err);
        //set the hashed password back on our user document
         // hash the password using our new salt
         bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);
            //set the hashed password back on our user document
            user.password = hash;
            next();
        });
    })
});

const Provider = db.model("Provider", ProviderSchema);
export default Provider;
