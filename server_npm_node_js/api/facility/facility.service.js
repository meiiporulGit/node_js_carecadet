import Facility from './facility.schema.js';
import { createId } from '../../shared/common-util.js';

export default {
    createFacility,
    updateFacility,
    deleteFacility,
    getFacilityByProvider,
    getFacilityList,
}

async function createFacility(body) {
    // Check the Body parameters( atleast one parameter should be there)
    console.log("body ", body);
    if (Object.keys(body).length === 0) {
        throw Error("Invalid body parameter");
    }
    const findFacility = await Facility.findOne({facilityNPI: body.facilityNPI,organizationID:body.organizationID });
    console.log('findfacility',findFacility)
    if(!findFacility){
        const facilityDetails = new Facility();
        facilityDetails.facilityID = await createId(Facility.collection.name);      
        facilityDetails.providerID = body.providerID;     
      
        facilityDetails.facilityName = body.facilityName;
        facilityDetails.facilityType = body.facilityType;
        facilityDetails.facilityNPI=body.facilityNPI;
        facilityDetails.address = body.address;
        facilityDetails.GPSCoordinate = body.GPSCoordinate;
        facilityDetails.email = body.email;
        facilityDetails.contact = body.contact; 
        facilityDetails.remark = body.remark;
        facilityDetails.isActive = 'Y';
        facilityDetails.activeStartDate = new Date();
        facilityDetails.createdBy = body.providerID;
        facilityDetails.createdDate = new Date();
        await facilityDetails.save();
        return { message: "Successfully created" };
    } else {
        throw Error('Facility already exists');
    }
}

async function updateFacility(body) {
    console.log("body ", body);
    if (Object.keys(body).length === 0) {
        throw Error("Invalid body parameter");
    }
    const findFacility = await Facility.findOne({facilityID: body.facilityID,organizationID:body.organizationID });
    console.log(body.facilityID,'facid')
    if(findFacility){
        console.log(findFacility,'findFacility')
        await Facility.findOneAndUpdate(
            { facilityID: body.facilityID },
            {
              $set:{
                facilityNPI: body.facilityNPI,
                facilityName: body.facilityName,
                facilityType:body.facilityType,
                address: body.address,
                GPSCoordinate : body.GPSCoordinate,
                email: body.email,
                contact: body.contact,
                remark: body.remark,
                updatedBy: body.providerID,
                updatedDate: new Date(),
              }
            }
        );
        return { message: 'Successfully updated' };
    } else {
        throw Error('facility not found');
    }
}


async function deleteFacility(facilityID) {
    if(facilityID){
        await Facility.deleteOne( { facilityID: facilityID });
        return { message: 'successfully deleted'};
    } else {
        throw Error('Please provide facilityID');
    }
}

async function getFacilityByProvider(providerID) {
    if(providerID){
        const FacilityDetails = await Facility.aggregate(
            [
                { $match: { providerID: providerID }},
                {
                    $project: {
                        _id: 0,
                        facilityID: 1,
                        providerID: 1,
                      
                        facilityName: 1,
                        facilityType:1,
                        facilityNPI:1,
                        address: 1,
                        GPSCoordinate:1,
                        email: 1,
                        contact: 1,
                        remark: 1,
                        isActive: 1,
                        activeStartDate: 1,
                        activeEndDate: 1,
                        createdBy: 1,
                        createdDate: 1,
                        updatedBy: 1,
                        updatedDate: 1
                    }
                },
                // { $limit: 1 },
            ]
        );
        return { data: FacilityDetails };
    } else {
        throw Error('please provide provider id')
    }
} 

async function getFacilityList() {
    const FacilityList = await Facility.aggregate(
        [
            {
                $project: {
                    _id: 0,
                    facilityID: 1,
                    providerID: 1,              
                    facilityName: 1,
                    facilityType:1,
                    facilityNPI:1,
                    address: 1,
                    GPSCoordinate:1,
                    email: 1,
                    contact: 1,
                    remark: 1,
                    isActive: 1,
                    activeStartDate: 1,
                    activeEndDate: 1,
                    createdBy: 1,
                    createdDate: 1,
                    updatedBy: 1,
                    updatedDate: 1
                }
            }, 
        ]
    );
    return { data: FacilityList };
}