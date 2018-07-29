/* eslint-disable no-console */
// const AmqpConnector = require('./amqp-connector.js');
const logger = require('winston');
const app = require('./app');
const port = app.get('port');
const server = app.listen(port);


process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info(`Feathers application started on ${app.get('host')}:${port}`)
);

// const amqpConnector = new AmqpConnector('localhost:5672', app); // app.get('rabbitmq')
// amqpConnector.connect().then(() => {
//   amqpConnector.receiveFromQueue(app.get('rabbitQueue'));

  // amqpConnector.sendToQueue('my-queue', '{"name": "SubmitContent", "user_id": "JonasNeu"}').then(() => {console.log("SubmitContent successful")});
  // amqpConnector.sendToQueue('my-queue', '{"name": "RateContent", "user_id": "JonasNeu"}').then(() => {console.log("RateContent successful")});
  // amqpConnector.sendToQueue('my-queue', '{"name": "ContentAccepted", "user_id": "JonasNeu"}').then(() => {console.log("ContentAccepted successful")});
// });
