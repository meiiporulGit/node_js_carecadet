const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'AgraCity API',
    description: 'AgraCity API documentation',
  },
  host: 'localhost:4200',
  schemes: ['http'],
};

const outputFile = './swagger.json';
const endpointsFiles = ['./server.js'];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);