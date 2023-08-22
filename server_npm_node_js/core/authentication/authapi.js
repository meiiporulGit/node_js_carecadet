import jwt from 'jsonwebtoken';
import UserSession from '../../api/user/user-session/user-session.schema.js';
import logger from '../logger/logger.js'
import errorHandler from '../error-handler/error-handler.js';
export function startAuthAPI(app) {
    app.use( async function(req,res,next) {
        try{
            // check header or url parameters or post parameters for Authorization
            var Authorization = req.body.authorization || req.query.authorization || req.headers["authorization"];
            console.log("Authorization", Authorization);
            var decoded = jwt.decode(Authorization, { complete: true });
            // console.log("decoded", decoded);
            if (decoded != null && decoded != undefined) {
                var sessionData = await UserSession.findOne({ userName: decoded.payload.userName, isActive: "Y"});
                console.log("SessionData", sessionData);
                if(!sessionData){
                    let custErr = new Error();
                    custErr.name = "TokenExpiredError";
                    errorHandler({ name: 'TokenExpiredError' }, req, res);
                }else {
                    let tokensdata = await jwt.verify(Authorization, process.env.SECRET_KEY + decoded.payload.userName + sessionData.sessionKey, { expiresIn: process.env.TOKEN_EXPIRY_TIME });
                    if (!tokensdata) {
                        let custErr = new Error();
                        custErr.name = "TokenExpiredError";
                        errorHandler({ name: 'TokenExpiredError' }, req, res);
                    } else {
                        res.set({
                            "Content-Type": "application/json;odata=verbose",
                            Authorization: Authorization,
                        });
                        next();
                    }
                }
            } else {
                let custErr = new Error();
                custErr.name = "NoAuthorizationProvided";
                errorHandler(custErr, req, res);
            }
        }catch(err){
            if (err instanceof jwt.TokenExpiredError) {
                let custErr = new Error();
                custErr.name = "TokenExpiredError";
                errorHandler(custErr, req, res);
            } else {
                logger.info("err   "+err);
                errorHandler(err, req, res);
             }
        }
    });
}