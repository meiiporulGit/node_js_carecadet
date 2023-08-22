import Organization from './organization.schema.js';
import { createId } from '../../shared/common-util.js';
import Lookup from "./lookup.schema.js"

export default {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationByProvider,
    getOrganizationList,
    getCityStateList
}

async function createOrganization(body) {
    // Check the Body parameters( atleast one parameter should be there)
    console.log("body ", body);
    if (Object.keys(body).length === 0) {
        throw Error("Invalid body parameter");
    }
    const findOrganization = await Organization.findOne({ providerID: body.providerID });
    if(!findOrganization){
        const organizationDetails = new Organization();
        organizationDetails.organizationID = await createId(Organization.collection.name);
        organizationDetails.providerID = body.providerID;
        organizationDetails.organizationName = body.organizationName;
        organizationDetails.orgImg = body.orgImg;
        organizationDetails.address = body.address;
        organizationDetails.email = body.email;
        organizationDetails.contact = body.contact;
        organizationDetails.contactPerson=body.contactPerson;
        organizationDetails.remark = body.remark;
        organizationDetails.isActive = 'Y';
        organizationDetails.activeStartDate = new Date();
        organizationDetails.createdBy = body.providerID;
        organizationDetails.createdDate = new Date();
        await organizationDetails.save();
        return { message: "Successfully created" };
    } else {
        throw Error('Organization already exists');
    }
}

async function updateOrganization(body) {
    console.log("body ", body);
    if (Object.keys(body).length === 0) {
        throw Error("Invalid body parameter");
    }
   
    const findOrganization = await Organization.findOne({ organizationID: body.organizationID });

    if(findOrganization){
        await Organization.findOneAndUpdate(
            { organizationID: body.organizationID },
            {
                $set:{
                    organizationName: body.organizationName,
                    orgImg:body.orgImg,
                    address: body.address,
                    email: body.email,
                    contact: body.contact,
                    contactPerson:body.contactPerson,
                    remark: body.remark,
                    updatedBy: body.providerID,
                    updatedDate: new Date(),
                }
               
            }
        );
        return { message: 'Successfully saved' };
    } else {
        throw Error('organization not found');
    }
}

async function deleteOrganization(organizationID) {
    if(organizationID){
        await Organization.deleteOne( { organizationID: organizationID });
        return { message: 'successfully deleted'};
    } else {
        throw Error('provider organizationID');
    }
}

async function getOrganizationByProvider(providerID) {
    if(providerID){
        const OrganizationDetails = await Organization.aggregate(
            [
                { $match: { providerID: providerID }},
                {
                    $project: {
                        _id: 0,
                        organizationID: 1,
                        providerID: 1,
                        organizationName: 1,
                        orgImg:1,
                        address: 1,
                        email: 1,
                        contact: 1,
                        contactPerson:1,
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
                { $limit: 1 },
            ]
        );
        return { data: OrganizationDetails };
    } else {
        throw Error('please provider provider id')
    }
} 

async function getOrganizationList() {
    const OrganizationList = await Organization.aggregate(
        [
            {
                $project: {
                    _id: 0,
                    organizationID: 1,
                    providerID: 1,
                    organizationName: 1,
                    orgImg:1,
                    address: 1,
                    email: 1,
                    contact: 1,
                    contactPerson:1,
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
    return { data: OrganizationList };
}

async function getCityStateList() {
    const OrganizationList = await Lookup.aggregate(
        [
            {
                $project: {
                    _id: 0,
                   state:1,
                   city:1,
                   ZIP_CODE:1
                }
            },
        ]
    );
    return { data: OrganizationList };
}
