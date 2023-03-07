import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import Pricelist from '../services/pricelist.schema.js';
import { Lookup } from '../facility/facility.schema.js';

dotenv.config()

const client = new Client({ node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`});

export default {
 search
}

// async function search(queryParams) {
//     const q = queryParams.q ?? "";
//     const location = queryParams.location;
//     const lat = queryParams.lat;
//     const lon = queryParams.lon;
//     var facility_query = [];
//     if(location != null) {
//         facility_query.push(
//             {
//                 multi_match: {
//                   query: location,
//                   fields: ["addressLine1", "addressLine2","city","state","zipCode"]
//                 }
//             }
//         );
//         if(!isNaN(parseInt(location))){
//             const zipcode = parseInt(location)
//             facility_query.push(
//                 {
//                     range: {
//                       "zipcode": {
//                         "gte": zipcode - 15,
//                         "lte": zipcode + 15
//                       }
//                     }
//                 }
//             );
//         }
//     }
//     if(lat != null || lon != null){
//         facility_query.push(
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
//                 from: 0, size: 30,
//                 index: "hltest.lookup",
//                 runtime_mappings: {
//                     zipcode: {
//                         type: "long",
//                         script: `
//                           if(!doc['zipCode.keyword'].empty) {
//                             def m = /^([0-9]+)$/.matcher(doc['zipCode.keyword'].value);
//                             if ( m.matches() ) {
//                                 emit(Integer.parseInt(m.group(1)))
//                             } else {
//                               emit(0)
//                             }
//                           } else {
//                             emit(0)
//                           }
                          
//                         `
//                       },
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
//                         should: facility_query
//                     }                    
//                 }
//             }
//         );
//         var services = [];
//         if(location == null && lat == null && lon == null){
//             var result = await client.search(
//                 {
//                     index: "hltest.pricelist",
//                     query: {
//                         bool: {
//                             should: [
//                                 {
//                                     match: {
//                                         "DiagnosisTestorServiceName": q
//                                     }
//                                 }
//                             ]
//                         }
//                     }
//                 }
//             )
//             for(var service of result.hits.hits) {
//                 services.push(service._source?.ServiceCode ?? "")
//             }
//         }
//         for(var item of result.hits.hits) {
//             var query = [
//                 {
//                     term: {
//                         "FacilityNPI": {
//                             value: item._source?.facilityNPI ?? "",
//                         }
//                     }
//                 }
//             ];
//             if(q.trim() !== '' ){
//                 query.push(
//                     {
//                         match: {
//                             "DiagnosisTestorServiceName": q
//                         }
//                     },
//                 )
//             }
//             var result = await client.search(
//                 {
//                     index: "hltest.pricelist",
//                     query: {
//                         bool: {
//                             must: query
//                         }
//                     }
//                 }
//             )
//             for(var service of result.hits.hits) {
//                 services.push(service._source?.ServiceCode ?? "")
//             }
//         }
//         const finalResult = await Pricelist.aggregate(
//             [
//                 {
//                     $match: {
//                         "ServiceCode": { $in: services },
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
    const q = queryParams.q ?? "";
    const location = queryParams.location;
    const lat = queryParams.lat;
    const lon = queryParams.lon;
    const distance = queryParams.distance ?? '30mi';
    try{
        var facility_query = [];
        var facility_filter = [];
        if(location != null) {
            facility_query.push(
                {
                    multi_match: {
                      query: location,
                      fields: ["addressLine1", "addressLine2","city","state","zipCode"]
                    }
                }
            );
            if(!isNaN(parseInt(location))){
                const result = await client.search(
                    {
                        index: "hltest.citystatezipcode",
                        query: {
                            bool: {
                                must: {
                                    term: {
                                        "ZIP_CODE": {
                                            value: location,
                                        }
                                    }
                                }
                            }
                        }
                    }
                )
                if(result.hits.hits.length > 0){
                    facility_filter.push(
                        {
                            geo_distance: {
                                distance: distance,
                                location: {
                                  lat: +result.hits.hits[0]._source["LAT"] ?? 0,
                                  lon: +result.hits.hits[0]._source["LONG"] ?? 0,
                                }
                              }
                        }
                    )
                }
            } 
        } else {
            if(lat != null || lon != null){
                facility_filter.push(
                    {
                        geo_distance: {
                          distance: distance,
                          location: {
                            lat: lat ?? 0,
                            lon: lon ?? 0,
                          }
                        }
                    }
                )
            }
        }  
        var result = await client.search(
            {
                index: "hltest.lookup",
                from: 0, size: 1000,
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
                        should: facility_query,
                        filter: facility_filter,
                    }                    
                },
            }
        );
        var services = [];
        if(location == null && lat == null && lon == null){
            var result = await client.search(
                {
                    from: 0, size: 1000,
                    index: "hltest.pricelist",
                    query: {
                        bool: {
                            should: [
                                {
                                    match: {
                                        "DiagnosisTestorServiceName": {
                                            query: q,
                                            operator: "and"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            )
            for(var service of result.hits.hits) {
                const FacilityDetails = await Lookup.findOne({ facilityNPI: service._source?.FacilityNPI});
                service._source.FacilityDetails = FacilityDetails;
                services.push(service._source);
            }
        }
        for(var item of result.hits.hits) {
            var query = [
                {
                    term: {
                        "FacilityNPI": {
                            value: item._source?.facilityNPI ?? "",
                        }
                    }
                }
            ];
            if(q.trim() !== '' ){
                query.push(
                    {
                        match: {
                            "DiagnosisTestorServiceName": {
                                query: q,
                                operator: "and"
                            }
                        }
                    },
                )
            }
            var result = await client.search(
                {
                    from: 0, size: 1000,
                    index: "hltest.pricelist",
                    query: {
                        bool: {
                            must: query
                        }
                    }
                }
            )
            for(var service of result.hits.hits) {
                const FacilityDetails = await Lookup.findOne({ facilityNPI: service._source?.FacilityNPI});
                service._source.FacilityDetails = FacilityDetails;
                services.push(service._source);
            }
        }
        return {data: services};
    } catch(e){
        console.log(e)
        throw Error(e)
    }
}