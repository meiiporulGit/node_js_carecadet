import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import { Facility } from '../facility/facility.schema.js';
import { Lookup } from '../facility/facility.schema.js';
import Pricelist from '../services/pricelist.schema.js';
import Cashprice from './cash_price.schema.js';
import CityStateZipcode from '../organization/lookup.schema.js';
import { getNegotiatedRatesByCodeAndNPI } from '../negotiated-rates/negotiated-rates.service.js';

dotenv.config()

const client = new Client({ node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}` });

export default {
  search,
  negotiatedSearch,
  serviceNameSearch,
  serviceLocationSearch

}


async function search(body) {

  const q = body.q ?? "";
  const location = body.location;
  var lat = +body.lat;
  var lon = +body.lon;
  const distance = body.distance ?? '30mi';
  const facilityType = body.facilityType;
  const ratingRange = body.ratingRange;
  const range = body.range;
  console.log(body, 'body')

  try {
    var facility_query = [];
    var facility_filter = [];
    if (location != null) {
      facility_query.push(
        {
          multi_match: {
            query: location,
            fields: ["addressLine1", "addressLine2", "city", "state", "zipCode"]
          }
        }
      );
      if (!isNaN(parseInt(location))) {
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
        if (result.hits.hits.length > 0) {
          lat = +result.hits.hits[0]._source["LAT"] ?? 0;
          lon = +result.hits.hits[0]._source["LONG"] ?? 0;

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
      if (lat != null || lon != null) {
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
        index: "hltest.npi_details",
        from: 0, size: 1000,
        runtime_mappings: {
          location: {
            type: "geo_point",
            script: `
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
        _source: [
          "facilityNPI"
        ]
      }
    );
    var services = [];
    if (location == null && lat == null && lon == null) {
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
    }

    var facilityNPIList = result.hits.hits.map((value) => value._source.facilityNPI);

    var query = [
      {
        terms: {
          "FacilityNPI": facilityNPIList,
        }
      }
    ];
    if (q.trim() !== '') {
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
        },
        _source: false
      }
    )
    console.log(result.hits.hits, 'result')
    var serviceIDList = result.hits.hits.map((value) => value._id);

    var serviceMatchQuary = {
      distance: {
        $gte: 0,
        $lte: 100,
      },


    };
    if (facilityType != null) {
      serviceMatchQuary['facilityDetails.facilityType.MainfacilityType'] = facilityType;
    }


    
    if (ratingRange != null) {
      if (ratingRange[0] === 0 && ratingRange[1] === 0) {//[0,0]
        serviceMatchQuary['$or'] =
          [
            { "facilityDetails.rating": null },]
      } else {
        if (ratingRange[0] === 0 || ratingRange[1] === 0) { //[0,6]
          if (ratingRange[0] === 0) { //[0,8]
            serviceMatchQuary['$or'] =
              [
                { "facilityDetails.rating": null },
                {
                  "facilityDetails.rating": {
                   
                    $lte: ratingRange[1]
                  }
                }
              ]
          }
          if (ratingRange[1] === 0) { //[5,0]
            serviceMatchQuary['$or'] =
              [
                { "facilityDetails.rating": null },
                {
                  "facilityDetails.rating": {
                    $gte: ratingRange[0],
                    // $lte: ratingRange[1]
                  }
                }
              ]
          }
        } else { //[4,5]

          serviceMatchQuary['$or'] =
            [
             
              {
                "facilityDetails.rating": {
                  $gte: ratingRange[0],
                  $lte: ratingRange[1]
                }
              }
            ]
        }
      }
      

    }

    if (range != null) {
      serviceMatchQuary['$expr'] = {
        $and: [
          {
            $gte: [
              {
                $toDouble: "$FacilityPrices"
              },
              range[0]
            ]
          },
          {
            $lte: [
              {
                $toDouble: "$FacilityPrices"
              },
              range[1]
            ]
          },
        ],
      }
    }
    var serviceList = await Pricelist.aggregate(
      [
        {
          '$match': {
            '$expr': {
              '$in': [
                {
                  '$toString': '$_id'
                }, serviceIDList
              ]
            }
          }
        }, {
          '$lookup': {
            'from': 'Facility',
            'let': {
              'facilityNPI': '$FacilityNPI'
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': [
                      '$facilityNPI', '$$facilityNPI'
                    ]
                  }
                }
              }, {
                '$lookup': {
                  'from': 'npi_details',
                  'let': {
                    'facilityNPI': '$facilityNPI'
                  },
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$eq': [
                            '$facilityNPI', '$$facilityNPI'
                          ]
                        }
                      }
                    }, {
                      '$project': {
                        '_id': 0,
                        'rating': 1
                      }
                    }
                  ],
                  'as': 'rating'
                }
              }, {
                '$unwind': {
                  'path': '$rating',
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$project': {
                  '_id': 0,
                  'facilityID': 1,
                  'facilityNPI': 1,
                  'facilityName': 1,
                  'facilityNPI': 1,
                  'facilityType': 1,
                  'providerID': 1,
                  'address': 1,
                  'GPSCoordinate': 1,
                  'email': 1,
                  'contact': 1,
                  'rating': {
                    '$toInt': '$rating.rating'
                  }
                }
              }
            ],
            'as': 'facilityDetails'
          }
        }, {
          '$unwind': {
            'path': '$facilityDetails',
            'preserveNullAndEmptyArrays': true
          }
        }, {
          '$addFields': {
            'r': 6371,
            'pibyeighty': {
              '$divide': [
                3.14159265359, 180
              ]
            }
          }
        }, {
          '$addFields': {
            'dlat': {
              '$multiply': [
                {
                  '$subtract': [
                    {
                      '$convert': {
                        'input': '$facilityDetails.GPSCoordinate.latitude',
                        'to': 'double'
                      }
                    }, {
                      '$convert': {
                        'input': lat,
                        'to': 'double'
                      }
                    }
                  ]
                }, '$pibyeighty'
              ]
            },
            'dlong': {
              '$multiply': [
                {
                  '$subtract': [
                    {
                      '$convert': {
                        'input': '$facilityDetails.GPSCoordinate.longitude',
                        'to': 'double'
                      }
                    }, {
                      '$convert': {
                        'input': lon,
                        'to': 'double'
                      }
                    }
                  ]
                }, '$pibyeighty'
              ]
            }
          }
        }, {
          '$addFields': {
            'a': {
              '$add': [
                {
                  '$multiply': [
                    {
                      '$sin': {
                        '$divide': [
                          '$dlat', 2
                        ]
                      }
                    }, {
                      '$sin': {
                        '$divide': [
                          '$dlat', 2
                        ]
                      }
                    }
                  ]
                }, {
                  '$multiply': [
                    {
                      '$cos': {
                        '$multiply': [
                          {
                            '$convert': {
                              'input': lat,
                              'to': 'double'
                            }
                          }, '$pibyeighty'
                        ]
                      }
                    }, {
                      '$cos': {
                        '$multiply': [
                          {
                            '$convert': {
                              'input': '$facilityDetails.GPSCoordinate.latitude',
                              'to': 'double'
                            }
                          }, '$pibyeighty'
                        ]
                      }
                    }, {
                      '$sin': {
                        '$divide': [
                          '$dlong', 2
                        ]
                      }
                    }, {
                      '$sin': {
                        '$divide': [
                          '$dlong', 2
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          }
        }, {
          '$addFields': {
            'distance': {
              '$multiply': [
                {
                  '$multiply': [
                    {
                      '$multiply': [
                        6371, {
                          '$multiply': [
                            2, {
                              '$atan2': [
                                {
                                  '$sqrt': '$a'
                                }, {
                                  '$sqrt': {
                                    '$subtract': [
                                      1, '$a'
                                    ]
                                  }
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }, 1000
                  ]
                }, 0.000621371
              ]
            }
          }
        },
        {
          '$match': serviceMatchQuary,
        },
        {
          '$project': {
            '_id': 0,
            'SNo': 1,
            'ServiceCode': 1,
            'DiagnosisTestorServiceName': 1,
            'Organisationid': 1,
            'OrganisationPrices': 1,
            'FacilityNPI': 1,
            'FacilityName': 1,
            'FacilityPrices': {
              $convert: {
                input: '$FacilityPrices',
                to: "double",
              }
            },
            'price': '$FacilityPrices',
            'facilityDetails': 1,
            'distance': {
              '$round': [
                '$distance', 2
              ]
            },
            'priceType': 'facilityPrice',
            'createdDate': 1,
            'updatedDate': 1,
            'createdBy': 1,
            'updatedBy': 1
          }
        },
        {
          '$sort': {
            'distance': 1
          }
        }
      ]
    );

    services.push(...serviceList);
    var queryCash = [
      {
        terms: {
          "NPI": facilityNPIList,
        }
      }
    ];

    if (q.trim() !== '') {
      queryCash.push(
        {
          match: {
            "serviceName": {
              query: q,
              operator: "and"
            }

          }
        },
      )
    }
    if (facilityType == null || facilityType == "FACT-5") {
      var result = await client.search(
        {
          from: 0, size: 1000,
          index: "hltest.provider_cash_price",
          query: {
            bool: {
              must: queryCash
            }
          },
          _source: false
        }
      )
      var cashpriceserviceIDList = result.hits.hits.map((value) => value._id);

      var serviceMatchQuary = {
        distance: {
          $gte: 0,
          $lte: 100,
        },

      };

       
      if (ratingRange != null) {
        if (ratingRange[0] === 0 && ratingRange[1] === 0) {//[0,0]
          serviceMatchQuary['$or'] =
            [
              { "facilityDetails.rating": null },]
        } else {
          if (ratingRange[0] === 0 || ratingRange[1] === 0) { //[0,6]
            if (ratingRange[0] === 0) { //[0,8]
              serviceMatchQuary['$or'] =
                [
                  { "facilityDetails.rating": null },
                  {
                    "facilityDetails.rating": {
                     
                      $lte: ratingRange[1]
                    }
                  }
                ]
            }
            if (ratingRange[1] === 0) { //[5,0]
              serviceMatchQuary['$or'] =
                [
                  { "facilityDetails.rating": null },
                  {
                    "facilityDetails.rating": {
                      $gte: ratingRange[0],
                      // $lte: ratingRange[1]
                    }
                  }
                ]
            }
          } else { //[4,5]

            serviceMatchQuary['$or'] =
              [
                
                {
                  "facilityDetails.rating": {
                    $gte: ratingRange[0],
                    $lte: ratingRange[1]
                  }
                }
              ]
          }
        }
       
      }

      if (range != null) {
        serviceMatchQuary['$expr'] = {
          $and: [
            {
              $gte: [
                {
                  $toDouble: "$cashPrice"
                },
                range[0]
              ]
            },
            {
              $lte: [
                {
                  $toDouble: "$cashPrice"
                },
                range[1]
              ]
            },
          ],
        }
      }
      var cashPriceserviceList = await Cashprice.aggregate(
        [
          {
            $match: {
              $expr: {
                $in: [
                  {
                    $toString: "$_id",
                  },
                  cashpriceserviceIDList
                ],
              },
            },
          },
          {
            $lookup: {
              from: "npi_details",
              let: {
                facilityNPI: "$NPI",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$facilityNPI",
                        "$$facilityNPI",
                      ],
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    facilityNPI: 1,
                    facilityName: 1,
                    addressLine1: 1,
                    city: 1,
                    state: 1,
                    zipCode: 1,
                    latitude: 1,
                    longitude: 1,
                    rating: {
                      $toInt: "$rating",
                    },
                  },
                },
              ],
              as: "facilityDetails",
            },
          },
          {
            $unwind: {
              path: "$facilityDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              r: 6371,
              pibyeighty: {
                $divide: [3.14159265359, 180],
              },
            },
          },
          {
            $addFields: {
              dlat: {
                $multiply: [
                  {
                    $subtract: [
                      {
                        $convert: {
                          input:
                            "$facilityDetails.latitude",
                          to: "double",
                        },
                      },
                      {
                        $convert: {
                          input: lat,
                          to: "double",
                        },
                      },
                    ],
                  },
                  "$pibyeighty",
                ],
              },
              dlong: {
                $multiply: [
                  {
                    $subtract: [
                      {
                        $convert: {
                          input:
                            "$facilityDetails.longitude",
                          to: "double",
                        },
                      },
                      {
                        $convert: {
                          input: lon,
                          to: "double",
                        },
                      },
                    ],
                  },
                  "$pibyeighty",
                ],
              },
            },
          },
          {
            $addFields: {
              a: {
                $add: [
                  {
                    $multiply: [
                      {
                        $sin: {
                          $divide: ["$dlat", 2],
                        },
                      },
                      {
                        $sin: {
                          $divide: ["$dlat", 2],
                        },
                      },
                    ],
                  },
                  {
                    $multiply: [
                      {
                        $cos: {
                          $multiply: [
                            {
                              $convert: {
                                input: lat,
                                to: "double",
                              },
                            },
                            "$pibyeighty",
                          ],
                        },
                      },
                      {
                        $cos: {
                          $multiply: [
                            {
                              $convert: {
                                input:
                                  "$facilityDetails.latitude",
                                to: "double",
                              },
                            },
                            "$pibyeighty",
                          ],
                        },
                      },
                      {
                        $sin: {
                          $divide: ["$dlong", 2],
                        },
                      },
                      {
                        $sin: {
                          $divide: ["$dlong", 2],
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          {
            $addFields: {
              distance: {
                $multiply: [
                  {
                    $multiply: [
                      {
                        $multiply: [
                          6371,
                          {
                            $multiply: [
                              2,
                              {
                                $atan2: [
                                  {
                                    $sqrt: "$a",
                                  },
                                  {
                                    $sqrt: {
                                      $subtract: [
                                        1,
                                        "$a",
                                      ],
                                    },
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      1000,
                    ],
                  },
                  0.000621371,
                ],
              },
            },
          },
          {
            $match: serviceMatchQuary,
          },
          {
            $project: {
              _id: 0,
              serviceCode: 1,
              code_type: 1,
              serviceName: 1,
              hospitalID: 1,
              inpatient_outpatient_flag: 1,
              cashPrice: {
                $convert: {
                  input: '$cashPrice',
                  to: "double",
                },

              },
              dis_min: {
                $convert: {
                  input: '$dis_min',
                  to: "double",
                },

              },
              dis_max: {
                $convert: {
                  input: '$dis_max',
                  to: "double",
                },

              },
              price: '$cashPrice',
              NPI: 1,
              facilityDetails: 1,
              distance: {
                $round: ["$distance", 2],
              },
              priceType: "cashPrice",
              createdDate: 1,
              updatedDate: 1,
              createdBy: 1,
              updatedBy: 1,
            },
          },
          {
            $sort: {
              distance: 1,
            },
          },
        ]
      );

      services.push(...cashPriceserviceList);
      console.log(cashPriceserviceList, "cplist")
    }


    var sortServicesbydistance = services.sort((a, b) => {
      return a.distance - b.distance;
    });

    return { data: sortServicesbydistance }
  } catch (e) {
    console.log(e)
    throw Error(e)
  }
}

async function negotiatedSearch(body) {
  const q = body.q ?? "";
  const location = body.location;
  var lat = body.lat;
  var lon = body.lon;
  const distance = body.distance ?? '30mi';
  const facilityType = body.facilityType;
  const serviceCode = body.serviceCode != null ? +body.serviceCode : "21";
  const insuranceProvider = body.insuranceProvider != null ? body.insuranceProvider : "INSP-1";
  const negotiatedRates = body.negotiatedRates;
  console.log(body, 'body')
  console.log(serviceCode, "ServiceCode")
  try {
    var facility_query = [];
    var facility_filter = [];
    if (location != null) {
      facility_query.push(
        {
          multi_match: {
            query: location,
            fields: ["addressLine1", "addressLine2", "city", "state", "zipCode"]
          }
        }
      );
      if (!isNaN(parseInt(location))) {
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
        if (result.hits.hits.length > 0) {
          lat = +result.hits.hits[0]._source["LAT"] ?? 0;
          lon = +result.hits.hits[0]._source["LONG"] ?? 0;
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
      if (lat != null || lon != null) {
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
        index: "hltest.npi_details",
        from: 0, size: 1000,
        runtime_mappings: {
          location: {
            type: "geo_point",
            script: `
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
        _source: [
          "facilityNPI"
        ]
      }
    );
    var services = [];
    if (location == null && lat == null && lon == null) {
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

    }
    var facilityNPIList = result.hits.hits.map((value) => value._source.facilityNPI);

    var query = [
      {
        terms: {
          "FacilityNPI": facilityNPIList,
        }
      }
    ];
    if (q.trim() !== '') {
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
        },
        _source: false,
      }
    )

    var serviceIDList = result.hits.hits.map((value) => value._id);

    console.log(serviceIDList, "sid");
    var serviceMatchQuary = {
      distance: {
        $gte: 0,
        $lte: 100,
      },
      "facilityDetails.negotiatedRates": {
        $ne: null,
      },
    };
    if (facilityType != null) {
      serviceMatchQuary['facilityDetails.facilityType.MainfacilityType'] = facilityType;
    }

    if (negotiatedRates != null) {
      serviceMatchQuary['$expr'] = {
        $and: [
          {
            $gte: [
              "$facilityDetails.negotiatedRates.negotiated_rate",
              negotiatedRates[0]
            ]
          },
          {
            $lte: [
              "$facilityDetails.negotiatedRates.negotiated_rate",
              negotiatedRates[1]
            ]
          },
        ],
      }
    }

    var serviceList = await Pricelist.aggregate(
      [
        {
          $match: {
            $expr: {
              $in: [
                {
                  $toString: "$_id",
                },
                serviceIDList,
              ],
            },
          },
        },
        {
          $lookup: {
            from: "Facility",
            let: {
              facilityNPI: "$FacilityNPI",
              serviceCode: "$ServiceCode",
              serviceName: "$DiagnosisTestorServiceName"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$facilityNPI",
                      "$$facilityNPI",
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "payer_neg_rates",
                  let: {
                    facilityNPI: "$$facilityNPI",
                    serviceCode: "$$serviceCode",
                    serviceName: "$$serviceName"
                  },
                  pipeline: [
                    {
                      $unwind: {
                        path: "$npi",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $unwind: {
                        path: "$service_code",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            {
                              $toString: "$npi",
                            },
                            "$$facilityNPI",
                          ],
                        },
                      },
                    },
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            "$billing_code",
                            "$$serviceCode",
                          ],
                        },
                      },
                    },
                    {
                      $match: {
                        $expr: {
                          $eq: [
                            "$name",
                            "$$serviceName",
                          ],
                        },
                      "insuranceProviderID": insuranceProvider,
                      "service_code": { $in: [`${serviceCode}`] },
                      },
                    },
                    {
                      $project: {
                        _id: 0,
                        negotiation_arrangement: 1,
                        name: 1,
                        billing_code_type: 1,
                        billing_code_type_version: 1,
                        billing_code: 1,
                        description: 1,
                        negotiated_rate: 1,
                        insuranceProviderID: 1,
                      },
                    },                   
                  ],
                  as: "negRates",
                },
              },
              {
                $unwind: {
                  path: "$negRates",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 0,
                  facilityID: 1,
                  facilityNPI: 1,
                  facilityName: 1,
                  facilityNPI: 1,
                  facilityType: 1,
                  providerID: 1,
                  address: 1,
                  GPSCoordinate: 1,
                  email: 1,
                  contact: 1,
                  negotiatedRates: "$negRates",
                },
              },
            ],
            as: "facilityDetails",
          },
        },
        {
          $unwind: {
            path: "$facilityDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            r: 6371,
            pibyeighty: {
              $divide: [3.14159265359, 180],
            },
          },
        },
        {
          $addFields: {
            dlat: {
              $multiply: [
                {
                  $subtract: [
                    {
                      $convert: {
                        input:
                          "$facilityDetails.GPSCoordinate.latitude",
                        to: "double",
                      },
                    },
                    {
                      $convert: {
                        input: lat ?? 0,
                        to: "double",
                      },
                    },
                  ],
                },
                "$pibyeighty",
              ],
            },
            dlong: {
              $multiply: [
                {
                  $subtract: [
                    {
                      $convert: {
                        input:
                          "$facilityDetails.GPSCoordinate.longitude",
                        to: "double",
                      },
                    },
                    {
                      $convert: {
                        input: lon ?? 0,
                        to: "double",
                      },
                    },
                  ],
                },
                "$pibyeighty",
              ],
            },
          },
        },
        {
          $addFields: {
            a: {
              $add: [
                {
                  $multiply: [
                    {
                      $sin: {
                        $divide: ["$dlat", 2],
                      },
                    },
                    {
                      $sin: {
                        $divide: ["$dlat", 2],
                      },
                    },
                  ],
                },
                {
                  $multiply: [
                    {
                      $cos: {
                        $multiply: [
                          {
                            $convert: {
                              input: lat ?? 0,
                              to: "double",
                            },
                          },
                          "$pibyeighty",
                        ],
                      },
                    },
                    {
                      $cos: {
                        $multiply: [
                          {
                            $convert: {
                              input:
                                "$facilityDetails.GPSCoordinate.latitude",
                              to: "double",
                            },
                          },
                          "$pibyeighty",
                        ],
                      },
                    },
                    {
                      $sin: {
                        $divide: ["$dlong", 2],
                      },
                    },
                    {
                      $sin: {
                        $divide: ["$dlong", 2],
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            distance: {
              $multiply: [
                {
                  $multiply: [
                    {
                      $multiply: [
                        6371,
                        {
                          $multiply: [
                            2,
                            {
                              $atan2: [
                                {
                                  $sqrt: "$a",
                                },
                                {
                                  $sqrt: {
                                    $subtract: [
                                      1,
                                      "$a",
                                    ],
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    1000,
                  ],
                },
                0.000621371,
              ],
            },
          },
        },
        {
          $match: serviceMatchQuary,
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
            facilityDetails: 1,
            negotiatedRates: "$facilityDetails.negotiatedRates",
            distance: {
              $round: ["$distance", 2],
            },
            createdDate: 1,
            updatedDate: 1,
            createdBy: 1,
            updatedBy: 1,
          },
        },
        { $unset: "facilityDetails.negotiatedRates" },
        {
          $group: {
            _id: "$FacilityNPI",

            SNo: { $first: "$SNo" },
            ServiceCode: { $first: "$ServiceCode" },
            DiagnosisTestorServiceName: { $first: "$DiagnosisTestorServiceName" },
            Organisationid: { $first: "$Organisationid" },
            OrganisationPrices: { $first: "$OrganisationPrices" },
            FacilityNPI: { $first: "$FacilityNPI" },
            FacilityName: { $first: "$FacilityName" },
            FacilityPrices: { $first: "$FacilityPrices" },
            facilityDetails: { $first: "$facilityDetails" },
            distance: {
              $first: "$distance"
            },
            createdDate: { $first: "$createdDate" },
            updatedDate: { $first: "$updatedDate" },
            createdBy: { $first: "$createdBy" },
            updatedBy: { $first: "$updatedBy" },
            price: {

              $addToSet: "$negotiatedRates.negotiated_rate"
            },

          },

        },
        {
          $project: {
            _id: 1,
            SNo: 1,
            ServiceCode: 1,
            DiagnosisTestorServiceName: 1,
            Organisationid: 1,
            OrganisationPrices: 1,
            FacilityNPI: 1,
            FacilityName: 1,
            FacilityPrices: 1,
            facilityDetails: 1,
            distance: 1,
            createdDate: 1,
            updatedDate: 1,
            createdBy: 1,
            updatedBy: 1,
            negotiatedRates:
            {
              negotiated_rate: {
                $avg: "$price"
              }

            }
          }
        },
        {
          $sort: {
            distance: 1,
          },

        },

      ]
    )
    services.push(...serviceList);
    console.log(serviceList)

    var sortServicesbydistance = services.sort((a, b) => {
      return a.distance - b.distance;
    });

    console.log(sortServicesbydistance, "sortBY")

    return { data: sortServicesbydistance };
  } catch (e) {
    console.log(e)
    throw Error(e)
  }
}



async function serviceNameSearch(body) {
  const q = body.q ?? "";
  console.log(body, 'body')
  try {
    var result = await client.search(
      {
        from: 0, size: 1000,
        index: "hltest.pricelist",
        query: {
         
          multi_match: {
            query: q,
            type: "bool_prefix",
            operator: "OR",
            fields: ["DiagnosisTestorServiceName"]
          }
        },
        _source: [
          "DiagnosisTestorServiceName"
        ]
      }
    )

    var listServiceName = result.hits.hits.map((value) => value._source.DiagnosisTestorServiceName)

    var result = await client.search(
      {
        from: 0, size: 1000,
        index: "hltest.provider_cash_price",
        query: {
          
          multi_match: {
            query: q,
            type: "bool_prefix",
            operator: "OR",
            fields: ["serviceName"]
          }

        },
        _source: [
          "serviceName"
        ]
      }
    )
    var cashPriceServiceName = result.hits.hits.map((value) => value._source.serviceName)
    var listServices = [...cashPriceServiceName, ...listServiceName]
    var serviceNameList = [];
    serviceNameList.push(...Array.from(new Set(listServices)))
    return { data: serviceNameList }
  }
  catch (e) {
    console.log(e)
    throw Error(e)
  }
}


async function serviceLocationSearch(body) {
  var lat = +body.lat;
  var lon = +body.lon;
  try {
    var serviceLocationList = await CityStateZipcode.aggregate([
      {
        $addFields: {
          r: 6371,
          pibyeighty: {
            $divide: [3.14159265359, 180],
          },
          input_lat: lat,
          input_lng: lon,
        },
      },
      {
        $addFields: {
          dlat: {
            $multiply: [
              {
                $subtract: [
                  {
                    $convert: {
                      input: "$LAT",
                      to: "double",
                    },
                  },
                  {
                    $convert: {
                      input: "$input_lat",
                      to: "double",
                    },
                  },
                ],
              },
              "$pibyeighty",
            ],
          },
          dlong: {
            $multiply: [
              {
                $subtract: [
                  {
                    $convert: {
                      input: "$LONG",
                      to: "double",
                    },
                  },
                  {
                    $convert: {
                      input: "$input_lng",
                      to: "double",
                    },
                  },
                ],
              },
              "$pibyeighty",
            ],
          },
        },
      },
      {
        $addFields: {
          a: {
            $add: [
              {
                $multiply: [
                  {
                    $sin: {
                      $divide: ["$dlat", 2],
                    },
                  },
                  {
                    $sin: {
                      $divide: ["$dlat", 2],
                    },
                  },
                ],
              },
              {
                $multiply: [
                  {
                    $cos: {
                      $multiply: [
                        {
                          $convert: {
                            input: "$input_lat",
                            to: "double",
                          },
                        },
                        "$pibyeighty",
                      ],
                    },
                  },
                  {
                    $cos: {
                      $multiply: [
                        {
                          $convert: {
                            input: "$LAT",
                            to: "double",
                          },
                        },
                        "$pibyeighty",
                      ],
                    },
                  },
                  {
                    $sin: {
                      $divide: ["$dlong", 2],
                    },
                  },
                  {
                    $sin: {
                      $divide: ["$dlong", 2],
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          distance: {
            $multiply: [
              {
                $multiply: [
                  {
                    $multiply: [
                      6371,
                      {
                        $multiply: [
                          2,
                          {
                            $atan2: [
                              {
                                $sqrt: "$a",
                              },
                              {
                                $sqrt: {
                                  $subtract: [
                                    1,
                                    "$a",
                                  ],
                                },
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  1000,
                ],
              },
              0.000621371,
            ],
          },
        },
      },
      {
        $sort:

        {
          distance: 1,
        },

      },
      {
        $limit: 1
      }
    ])
    if (serviceLocationList[0]) {
      return { data: serviceLocationList[0].ZIP_CODE }
    } else {
      return { data: null }
    }
  }
  catch (e) {
    console.log(e)
    throw Error(e)
  }
}



































































