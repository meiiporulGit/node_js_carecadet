import { Router } from "express";
import ResObject from "../../../core/util/res-object.js";
import LoginService from "./login.service.js";

//accessToken
import jwt from "jsonwebtoken";
import UserSession from "../user-session/user-session.schema.js";
import logger from "../../../core/logger/logger.js";
import errorHandler from "../../../core/error-handler/error-handler.js";
// test
const router = Router();

export default router;

router.post("/login", login);
router.post("/logout", logout);
// router.post("/refresh", refreshToken);
router.post("/access", accessToken);
router.get('/confirm',confirmEmail);

function login(req, res, next) {
  var body = req.body ?? {};
  LoginService.login(body)
    .then((obj) => {
      console.log(obj);
      new ResObject(res, obj);
    })
    .catch(next);
}

function logout(req, res, next) {
  var body = req.body ?? {};
  LoginService.logout(body)
    .then((obj) => {
      console.log(obj);
      new ResObject(res, obj);
    })
    .catch(next);
}

// function refreshToken(req, res) {
//   const token =
//     req.body.token || req.query.token || req.headers["x-access-token"];
//   //console.log("token==============================================================================", token);
//   var decoded = jwt.decode(token, { complete: true });
//   console.log("decode", decoded);
//   if (token) {
//     // Verifying refresh token
//     jwt.verify(
//       token,
//       process.env.SECRET_KEY,
//       { expiresIn: process.env.TOKEN_EXPIRY_TIME },
//       (err, _decoded) => {
//         if (err) {
//           const accessToken = jwt.sign(
//             {
//               userName: decoded.payload.userName,
//             },
//             process.env.SECRET_KEY +
//               decoded.payload.userName +
//               decoded.payload.sessionKey,
//             { expiresIn: process.env.TOKEN_EXPIRY_TIME }
//           );
//           return res.json({ accessToken });
//           // // Wrong Refresh Token
//           // return res.status(401).json({ message: 'Unauthorized' });
//         }
//         // else {
//         //     // Correct token we send a new access token
//         //     // const accessToken = jwt.sign({
//         //     //     userName: decoded.payload.userName,
//         //     // },  process.env.SECRET_KEY + decoded.payload.userName + decoded.payload.sessionKey, { expiresIn: process.env.TOKEN_EXPIRY_TIME }
//         //     // );
//         //     // return res.json({ accessToken });
//         // }
//       }
//     );
//   } else {
//     return res.status(406).json({ message: "Unauthorized" });
//   }
// }

// function refreshToken(refreshToken) {
//   console.log(refreshToken, "rT");
//   let storeToken = "";
//   const decoded = jwt.decode(refreshToken, { complete: true });
//   if (refreshToken) {
//     // Verifying refresh token
//     jwt.verify(
//       refreshToken,
//       process.env.SECRET_KEY,
//       { expiresIn: process.env.TOKEN_EXPIRY_TIME },
//       (err, _decoded) => {
//         if (err) {
//           // Wrong Refresh Token
//           const accessToken = jwt.sign(
//             {
//               userName: decoded.payload.userName,
//             },
//             process.env.SECRET_KEY +
//               decoded.payload.userName +
//               decoded.payload.sessionKey,
//             { expiresIn: process.env.TOKEN_EXPIRY_TIME }
//           );
//           console.log(accessToken, "ac");
//           storeToken = { accessToken };
//           // return res.status(401).json({ message: 'Unauthorized' });
//         }
//         // else {
//         //     // Correct token we send a new access token
//         //     const accessToken = jwt.sign({
//         //         userName: decoded.payload.userName,
//         //     },  process.env.SECRET_KEY + decoded.payload.userName + decoded.payload.sessionKey, { expiresIn: process.env.TOKEN_EXPIRY_TIME }
//         //     );
//         //     return res.json({ accessToken });
//         // }
//       }
//     );
//   } else {
//     return res.status(406).json({ message: "Unauthorized" });
//   }
//   return storeToken;
// }

async function accessToken(req, res) {
  try {
    console.log(req.body.token, "token===================");
    var refreshc = req.body.token;
    var decoded = jwt.decode(refreshc, { complete: true });
    if (decoded != null && decoded != undefined) {
      var sessionData = await UserSession.findOne({
        userName: decoded.payload.userName,
        isActive: "Y",
      });
      console.log("SessionData", sessionData);
      if (!sessionData) {
        console.log("see");

        let custErr = new Error();
        custErr.name = "TokenExpiredError";
        errorHandler({ name: "TokenExpiredError" }, req, res);
      } else {
        // Verifying refresh token
        console.log("checkd");
        jwt.verify(
          refreshc,
          process.env.SECRET_KEY +
            decoded.payload.userName +
            sessionData.sessionKey,
          { expiresIn: process.env.TOKEN_EXPIRY_TIME },
          (err, _decoded) => {
            if (err) {
              const accessToken = jwt.sign(
                { userName: decoded.payload.userName },
                process.env.SECRET_KEY +
                  decoded.payload.userName +
                  sessionData.sessionKey,
                { expiresIn: process.env.TOKEN_EXPIRY_TIME }
              );
              console.log(accessToken, "access");
              return res.json({ accessToken });
              // // Wrong Refresh Token
              // return res.status(401).json({ message: 'Unauthorized' });
            }
            // else {
            //     // Correct token we send a new access token
            //     // const accessToken = jwt.sign({
            //     //     userName: decoded.payload.userName,
            //     // },  process.env.SECRET_KEY + decoded.payload.userName + decoded.payload.sessionKey, { expiresIn: process.env.TOKEN_EXPIRY_TIME }
            //     // );
            //     // return res.json({ accessToken });
            // }
          }
        );
      }
    } else {
      let custErr = new Error();
      custErr.name = "NoAuthorizationProvided";
      errorHandler(custErr, req, res);
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      let custErr = new Error();
      custErr.name = "TokenExpiredError";
      errorHandler(custErr, req, res);
    } else {
      logger.info("err   " + err);
      errorHandler(err, req, res);
    }
  }
}

function confirmEmail(req,res,next){
  const query= req.query
  console.log("confirmEmail",query)

  LoginService.updateConfirmEmail(query).then(obj=>{
    console.log("verify successully")
    res.redirect(`${process.env.APPBASE_URL}/provider/login`)
}
).catch(next)
}

  // if (query){
  //   try{
  //     jwt.verify(query,process.env.SECRET_KEY,(e,decoded)=>{
  //       if(e){
  //         console.log(e)
  //         return res.sendStatus(403)
  //       }
  //       else{
  //         query.email = decoded;
  //         console.log("decoded",email);

  //         LoginService.updateConfirmEmail(decoded).then(obj=>{
  //           console.log("verify successully")
  //           res.json("sucess updated")
  //       }
  //       ).catch(next)
  //       }
  //     })
  //   }
  //   catch(err){
  //     console.log(err)
  //   }
  // }

//