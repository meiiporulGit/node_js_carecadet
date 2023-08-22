import CollectionKeyGen from '../api/collection-key-gen/collection-key-gen.schema.js';

export function uuid(){
  return new Promise((resolve, reject) => {
      var dt = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (dt + Math.random()*16)%16 | 0;
          dt = Math.floor(dt/16);
          return (c=='x' ? r :(r&0x3|0x8)).toString(16);
      });
      resolve(uuid);
  })
}

export function createId(collectionName) {
    console.log("collectionName ", collectionName);
    return new Promise((resolve, reject) => {
      try {
        let updateQuery = {
          $set: {
            updatedDate: new Date()
          },
          $inc: {
            lastCounter: 1
          }
        }
        CollectionKeyGen.findOneAndUpdate(
          {
            collectionName: collectionName
          },
          updateQuery
          ,
          { new: true },
          // {upsert: true},
          async function (err, data) {
            if (err) {
              return reject(err);
            } else {

              if (data) {
                let lastCounter = data.lastCounter;
                let code = data.code;
                let separator = data.separator;
                
                console.log("updatedDoc ", data);
                let id = code + separator + lastCounter;
                return resolve(id);
              } else {
                return reject(Error(collectionName + " collection name not found"));
              }
            }
          }
        );
      } catch (err) {
        reject(err);
      } finally { }
    })
  }