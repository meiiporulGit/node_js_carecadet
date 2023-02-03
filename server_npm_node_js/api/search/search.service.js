import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config()

const client = new Client({ node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`});

export default {
 search
}

async function search(queryParams) {
    const q = queryParams.q;

    try{
        var result = await client.search(
            {
                index: 'hltest.pricelist',
                runtime_mappings: {
                    FacilityDetails: {
                        type: "lookup",
                        target_index: "hltest.facility",
                        input_field: "FacilityNPI",
                        target_field: "facilityNPI",
                        fetch_fields: [
                          "facilityID",
                          "facilityNPI",
                          "facilityName",
                          "facilityType",
                          "email",
                          "contactPerson",
                          "contact",
                          "providerID"
                        ]
                    },
                },
                query: {
                   bool: {
                     should: {
                        multi_match: {
                            query: q,
                            fields: ["DiagnosisTestorServiceName", "FacilityNPI"]
                        }
                     }
                   }
                },
                fields: [
                    "FacilityDetails"
                ]
            }
        )
        var finalResult = [];
        for(var item of result.hits.hits){
            var result = item._source;
            result.FacilityDetails = {};
            var FacilityDetails = item.fields.FacilityDetails[0] ?? null;
            result.FacilityDetails.facilityID = FacilityDetails?.facilityID[0] ?? null;
            result.FacilityDetails.facilityType = FacilityDetails?.facilityType[0] ?? null;
            result.FacilityDetails.providerID = FacilityDetails?.providerID[0] ?? null;
            result.FacilityDetails.contact = FacilityDetails?.contact[0] ?? null;
            result.FacilityDetails.facilityNPI = FacilityDetails?.facilityNPI[0] ?? null;
            result.FacilityDetails.facilityName = FacilityDetails?.facilityName[0] ?? null;
            result.FacilityDetails.email = FacilityDetails?.email[0] ?? null;
            finalResult.push(result)
        }
        console.log(finalResult)
        return {data: finalResult};
    } catch(e){
        console.log(e)
        throw Error(e)
    }
}