import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import Pricelist from '../services/pricelist.schema.js';
dotenv.config()

const client = new Client({ node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`});

export default {
 search
}

// async function search(queryParams) {
//     const q = queryParams.q;
//     const location = queryParams.location;
//     const lat = queryParams.lat;
//     const lon = queryParams.lon;
//     var query = []
//     if(q != null) {
//         query.push(
//             {
//                 multi_match: {
//                     query: q,
//                     fields: ["DiagnosisTestorServiceName", "FacilityName"]
//                 }
//             }
//         )
//     }
//     if(location != null) {
//         query.push(
//             {
//                 multi_match: {
//                   query: location,
//                   fields: ["addressLine1", "addressLine2","city","state"]
//                 }
//             }
//         )
//     }
//     if(lat != null || lon != null){
//         query.push(
//             {
//                 geo_distance: {
//                   distance: "30km",
//                   location: {
//                     lat: lat ?? 0,
//                     lon: lon ?? 0,
//                   }
//                 }
//             }
//         )
//     }
//     try{
//         var result = await client.search(
//             {
//                 index: "hltest.pricelist,hltest.lookup",
//                 runtime_mappings: {
//                     location: {
//                         type: "geo_point",
//                         script:  `
//                             double lat = 0.0;
//                             double lon = 0.0;
//                             if(doc.containsKey('latitude.keyword') && doc['latitude.keyword'].size() != 0){
//                                 lat = Double.parseDouble(doc['latitude.keyword'].value);
//                             } 
//                             if(doc.containsKey('longitude.keyword')  && doc['longitude.keyword'].size() != 0) {
//                                 lon = Double.parseDouble(doc['longitude.keyword'].value);
//                             }
//                             emit(lat,lon);
//                         `
                        
//                     }
//                 },
//                 query: {
//                     bool: {
//                         should: query
//                     }                    
//                 }
//             }
//         );
//         var services = [];
//         var facilities = [];
//         for(var item of result.hits.hits) {
//             if(item._index == "hltest.lookup"){
//                 facilities.push(item._source.facilityNPI)
//             }
//             if(item._index == "hltest.pricelist"){
//                 services.push(item._source.ServiceCode)
//             }
//         }
//         const finalResult = await Pricelist.aggregate(
//             [
//                 {
//                     $match: {
//                         $or: [
//                             { "ServiceCode": { $in: services }},
//                             { "FacilityNPI": { $in: facilities }}
//                         ]
//                     }
//                 }, 
//                 {
//                     $lookup: {
//                         as: "facilityDetails",
//                         from: "Lookup",
//                         localField: "FacilityNPI",
//                         foreignField: "facilityNPI"
//                     }
//                 },
//                 {
//                     $unwind: {
//                         path: "$facilityDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 {
//                     $project: {
//                         _id: 0,
//                         SNo: 1,
//                         ServiceCode: 1,
//                         DiagnosisTestorServiceName: 1,
//                         Organisationid: 1,
//                         OrganisationPrices: 1,
//                         FacilityNPI: 1,
//                         FacilityName: 1,
//                         FacilityPrices: 1,
//                         createdBy: 1,
//                         createdDate: 1,
//                         updatedBy: 1,
//                         updatedDate: 1,
//                         "FacilityDetails": "$facilityDetails",
//                     }
//                 }
//             ]
//         )
//         return {data: finalResult};
//     } catch(e){
//         console.log(e)
//         throw Error(e)
//     }
// }

async function search(queryParams) {
    const q = queryParams.q;
    const location = queryParams.location;
    const lat = queryParams.lat;
    const lon = queryParams.lon;
    var facility_query = []
    if(location != null) {
        facility_query.push(
            {
                multi_match: {
                  query: location,
                  fields: ["addressLine1", "addressLine2","city","state","zipCode"]
                }
            }
        )
    }
    if(lat != null || lon != null){
        facility_query.push(
            {
                geo_distance: {
                  distance: "30km",
                  location: {
                    lat: lat ?? 0,
                    lon: lon ?? 0,
                  }
                }
            }
        )
    }
    try{
        var result = await client.search(
            {
                from: 0, size: 30,
                index: "hltest.lookup",
                runtime_mappings: {
                    location: {
                        type: "geo_point",
                        script:  `
                            double lat = 0.0;
                            double lon = 0.0;
                            if(doc.containsKey('latitude.keyword') && doc['latitude.keyword'].size() != 0){
                                lat = Double.parseDouble(doc['latitude.keyword'].value);
                            } 
                            if(doc.containsKey('longitude.keyword')  && doc['longitude.keyword'].size() != 0) {
                                lon = Double.parseDouble(doc['longitude.keyword'].value);
                            }
                            emit(lat,lon);
                        `
                        
                    }
                },
                query: {
                    bool: {
                        should: facility_query
                    }                    
                }
            }
        );
        var services = [];
        if(location == null && lat == null && lon == null){
            var result = await client.search(
                {
                    index: "hltest.pricelist",
                    query: {
                        bool: {
                            should: [
                                {
                                    match: {
                                        "DiagnosisTestorServiceName": q
                                    }
                                }
                            ]
                        }
                    }
                }
            )
            for(var service of result.hits.hits) {
                services.push(service._source?.ServiceCode ?? "")
            }
        }
        for(var item of result.hits.hits) {
            var result = await client.search(
                {
                    index: "hltest.pricelist",
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        "DiagnosisTestorServiceName": q
                                    }
                                },
                                {
                                    term: {
                                        "FacilityNPI": {
                                            value: item._source?.facilityNPI ?? "",
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            )
            for(var service of result.hits.hits) {
                services.push(service._source?.ServiceCode ?? "")
            }
        }
        const finalResult = await Pricelist.aggregate(
            [
                {
                    $match: {
                        "ServiceCode": { $in: services },
                    }
                }, 
                {
                    $lookup: {
                        as: "facilityDetails",
                        from: "Lookup",
                        localField: "FacilityNPI",
                        foreignField: "facilityNPI"
                    }
                },
                {
                    $unwind: {
                        path: "$facilityDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 0,
                        SNo: 1,
                        ServiceCode: 1,
                        DiagnosisTestorServiceName: 1,
                        Organisationid: 1,
                        OrganisationPrices: 1,
                        FacilityNPI: 1,
                        FacilityName: 1,
                        FacilityPrices: 1,
                        createdBy: 1,
                        createdDate: 1,
                        updatedBy: 1,
                        updatedDate: 1,
                        "FacilityDetails": "$facilityDetails",
                    }
                }
            ]
        )
        return {data: finalResult};
    } catch(e){
        console.log(e)
        throw Error(e)
    }
}