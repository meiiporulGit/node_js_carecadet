import { NegotiatedRates } from "./negotiated-rates.schema.js";

export async function getNegotiatedRatesByCodeAndNPI(billingCode, facilityNPI, serviceCode, insuranceProvider) {
  const NegotiatedPrices = await NegotiatedRates.aggregate(
      [
        {
            '$unwind': {
                'path': '$service_code', 
                'preserveNullAndEmptyArrays': true
            }
        },  {
            '$unwind': {
                'path': '$npi', 
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$match': {
                'billing_code': billingCode, 
                'service_code': serviceCode,
                "insuranceProviderID": insuranceProvider, 
                '$expr': {
                    '$eq': [
                        {
                            '$toString': '$npi'
                        }, facilityNPI
                    ]
                }
            }
        }
    ]
    );
    return NegotiatedPrices;
}

// export async function rates(cc){
//     console.log(cc,"cje")
//    const check=  await NegotiatedRates.aggregate(
//         [
//             { $match: { name: cc.name }},
//             {
//                 $project: {
//                     name:1,
//                     "negotiated_rates":1
//                 }}
//         ])
//         console.log("ch",check)
//         const arrayCheck=[]
//  check.forEach(d=>{
//     console.log(d,"cc")
//       d.negotiated_rates.forEach((ccc,i)=>{
//        console.log("inc",ccc)
//        ccc.provider_groups.forEach(dd=>{
//         console.log(dd,"dd")
//         if(dd.npi.includes(cc.npi)){
//             console.log("check")
//             // const ff={
//             //     id:i,
//             //     nprice:ccc.negotiated_prices,
//             //     npi:dd.npi
//             // }
//             arrayCheck.push(i)
//         }
//        })
       
//        })
//     })
//     console.log(arrayCheck,"arr")
//         return arrayCheck
// }