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
                query: {
                   bool: {
                     should: {
                        multi_match: {
                            query: q,
                            fields: ["DiagnosisTestorServiceName", "FacilityNPI"]
                        }
                     }
                   }
                }
            }
        )
        var finalResult = [];
        for(var item of result.hits.hits){
            finalResult.push(item._source)
        }
        console.log(finalResult)
        return {data: finalResult};
    } catch(e){
        console.log(e)
        throw Error(e)
    }
}