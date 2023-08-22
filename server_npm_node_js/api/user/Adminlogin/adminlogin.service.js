import Provider from '../provider/provider.schema.js';
import UserSession from '../user-session/user-session.schema.js';
import { uuid } from '../../../shared/common-util.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default {
    adminlogout,
    adminlogin,
    updateConfirmEmail
}

async function adminlogout(body){
    var userName = body.userName;
    await UserSession.updateMany({ userName: userName },{
        $set: {
            isActive: "N",
            updatedBy: "Admin",
            updatedDate: new Date(),
            endDate: new Date(),
            activeEndDate: new Date()
        }
    });
    return { message: "Successfully logged out"};
}

async function adminlogin(body){
    console.log(body,"login");
    var userType = body.userType;
    if(userType == "ADMIN") {
        var username = body.userName;
        var password = body.password;
        var role=body.userType
        console.log(role,"checkrole")
        var sessionKey = await uuid();
        const findProvider = await Provider.findOne({ username: username ,role:role});
        console.log('findProvider',findProvider);
        if(findProvider!== null||undefined) {
            let comparePassword = await bcrypt.compare(password, findProvider.password);
            if(comparePassword){
                // if(findProvider.isActive!=="Pending"){
                const token = jwt.sign({ userName: findProvider.username }, process.env.SECRET_KEY + username + sessionKey, { expiresIn: process.env.TOKEN_EXPIRY_TIME });
                const refreshToken = jwt.sign({ userName: findProvider.username },process.env.SECRET_KEY, { expiresIn: process.env.TOKEN_EXPIRY_TIME });
                console.log("token", token);
                let responseObj = {};
                responseObj.userName = findProvider.username;
                responseObj.userID = findProvider.providerID;
                responseObj.firstName = findProvider.firstName;
                responseObj.lastName = findProvider.lastName;
                responseObj.email = findProvider.email;
                responseObj.isActive = findProvider.isActive;
             
                
                responseObj.userType = "ADMIN";
                responseObj.token = token;
                responseObj.refreshToken = refreshToken;
                await createUserSession(findProvider.username,sessionKey, "ADMIN", findProvider.providerID)
                return {data: responseObj};
            // }
            //     else{throw Error('Pending Account.Please Verify Your Email!');}
            } else {
                throw Error('Incorrect password');
                            }
        } else {
            throw Error("User not found")
        }
    } 
    else {
        throw Error("User not found")
    }
}

async function createUserSession(userName,sessionKey, collectionName, userID) {
    console.log("collectionName", collectionName);
    let findUserSession = await UserSession.findOne({ userName: userName });
    if(!findUserSession){
        var userSession = new UserSession(); 
        userSession.userSessionID = sessionKey;
        userSession.sessionKey = sessionKey;
        userSession.applicationId = process.env.APP_ID;
        userSession.userName = userName;
        userSession.collectionName = collectionName;
        userSession.isActive = 'Y';
        userSession.createdBy = userID;
        await userSession.save();
    } else {
        let activeUserSession = await UserSession.updateMany(
            { userName: userName, isActive: 'Y'},
            {
                $set: {
                    isActive: "N",
                    updatedBy: userID,
                    updatedDate: new Date(),
                    endDate: new Date(),
                    activeEndDate: new Date()
                }
            }
        );
        if(activeUserSession){
            var userSession = new UserSession();
            userSession.userSessionID = sessionKey;
            userSession.sessionKey = sessionKey;
            userSession.applicationId = process.env.APP_ID;
            userSession.userName = userName;
            userSession.collectionName = collectionName;
            userSession.isActive = 'Y';
            userSession.createdBy = userID;
            await userSession.save();
        }
    }

}

async function updateConfirmEmail(body){
        console.log("body",body);
       
        if (Object.keys(body).length === 0) {
            throw Error("Invalid body parameter");
        }
        const decoded = jwt.verify(body.email,process.env.SECRET_KEY)
       
        // console.log("decoded",decoded);
        const findProvider = await Provider.findOne({ email:decoded.email })
        console.log("findProvider",findProvider)
        if(!findProvider){
            throw Error(' provider does exists ')
        } else {
           
            await Provider.findOneAndUpdate(
                { email:decoded.email},
               
                
                {
                    $set: {
                      isActive:'Active',
                        updatedDate: new Date(),
                    }
                }
            );
            return { message: 'Successfully updated'}
        }
    }