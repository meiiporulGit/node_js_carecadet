import CollectionKeyGen from './collection-key-gen.schema.js';
import { createId } from '../../shared/common-util.js';

export default {
    createCollectionKeyGen,
    updateCollectionKeyGen,
    deleteCollectionKeyGen,
    getCollectionKeyGen,
};

async function createCollectionKeyGen(body) {
    try {
        console.log("body ", body);
        if (Object.keys(body).length === 0) {
            throw Error("Invalid body parameter");
        }
        const findCollectionKeyGen = await CollectionKeyGen.findOne({ collectionName: body.collectionName });
        console.log("findCollectionKeyGen ", findCollectionKeyGen);
        if (!findCollectionKeyGen) {
            await createId("CollectionKeyGen").then(async (ID) => {
            console.log("body ", body);
            console.log("collectionKeyGenID", ID);
            var collectionKeyGenDetails = new CollectionKeyGen();
            collectionKeyGenDetails.collectionName = body.collectionName,
                collectionKeyGenDetails.collectionKeyGenID = ID,
                collectionKeyGenDetails.code = body.code,
                collectionKeyGenDetails.separator = body.separator,
                collectionKeyGenDetails.lastCounter = body.lastCounter,
                collectionKeyGenDetails.isActive = body.isActive,
                collectionKeyGenDetails.createdBy = body.userID,
                collectionKeyGenDetails.remark = body.remark,
                await collectionKeyGenDetails.save();

            }).catch(err => {
                console.log("error ", err);
                throw Error(err);
            });
            return 'Collection key  created successfully';
        } else {
            throw Error("Collection name already exits");
        }
    } catch (err) {
        throw Error(err);
    } finally { }
}

async function updateCollectionKeyGen(body) {
    try {
        console.log("body ", body);
        if (Object.keys(body).length === 0) {
            throw Error("Invalid body parameter");
        }
        let updateCollectionKeyGenList = await CollectionKeyGen.findOne({ collectionName: body.collectionName });
        console.log("collectionKeyGenID ", updateCollectionKeyGenList);
        if (updateCollectionKeyGenList && updateCollectionKeyGenList.collectionKeyGenID != body.collectionKeyGenID) {
            throw Error("Collection name already exits");
        } else {
            let updateResult = await CollectionKeyGen.findOneAndUpdate({ collectionKeyGenID: body.collectionKeyGenID },
                {
                    $set: {
                        collectionName: body.collectionName,
                        code: body.code,
                        separator: body.separator,
                        lastCounter: body.lastCounter,
                        remark: body.remark,
                        isActive: body.isActive,
                        updatedBy: body.userID,
                        updatedDate: new Date(),
                    },
                });
            // console.log("updateResult ", updateResult);
            if (updateResult) {
                console.log("updateResult ", updateResult);
                return "Collection key  update successfully";
            } else {
                throw Error("Collection key update failure");
            }

        }

    } catch (err) {
        throw Error(err);
    } finally { }
}

async function deleteCollectionKeyGen(collectionKeyGenID) {
    try {
        const deleteRocord = await CollectionKeyGen.deleteOne({ collectionKeyGenID: collectionKeyGenID })
        if (deleteRocord) {
            return "Removed successfully"
        } else {
            throw Error("Delete collection key give error");
        }
    } catch (err) {
        throw Error(err);
    } finally { }
}

async function getCollectionKeyGen(body) {
    if (Object.keys(body).length === 0) {
        throw Error('Invalid body parameter');
    }
    try {  console.log("body ", body);
        let isFirstTimeLoad = body.isFirstTimeLoad ? body.isFirstTimeLoad : false;       
        const pageIndex = body.pageIndex;
        const pageSize = body.pageSize;
        const skip = pageIndex * pageSize;
        const limit = skip + pageSize;

        if (isFirstTimeLoad) {
            let searchDocs = [];
            searchDocs = await CollectionKeyGen.aggregate(
                [
                    {
                        $match: {}

                    }
                ]);

            var obj = {
                totalRecord: searchDocs ? searchDocs.length : 0
            }

            return obj;
        }


        const CollectionKeyGenList = await CollectionKeyGen.aggregate(
            [
            
                { "$sort": { "_id": -1 } },
                { "$limit": limit },
                { "$skip": skip },


                {
                    $lookup: {
                        from: "Contractor",
                        localField: "createdBy",
                        foreignField: "contractorID",
                        as: "createdByUserDetail",
                    },
                },
                {
                    $unwind: {
                        path: "$createdByUserDetail",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "Contractor",
                        localField: "updatedBy",
                        foreignField: "contractorID",
                        as: "updatedByUserDetail",
                    },
                },
                {
                    $unwind: {
                        path: "$updatedByUserDetail",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $sort: {
                        createdDate: 1,
                    },
                },
                {
                    $project: {
                        _id: 0,
                        collectionKeyGenID: 1,
                        collectionName: 1,
                        code: 1,
                        separator: 1,
                        lastCounter: 1,
                        remark: 1,
                        isActive: 1,
                        activeStartDate: 1,
                        activeEndDate: 1,
                        createdBy: "$createdByUserDetail.username",
                        createdDate: 1,
                        updatedBy: "$updatedByUserDetail.username",
                        updatedDate: 1,
                    }
                }
            ]);
        if (CollectionKeyGenList) {
            var obj = {
                CollectionKeyGenList: CollectionKeyGenList,
            }
            console.log("obj",obj);
            return obj;
        } else {
            throw  Error("Get Collection Key Gen list give error");
        }

    }
    catch (error) {
        //Code to handle error comes here
        throw error;
    }finally{}
}
