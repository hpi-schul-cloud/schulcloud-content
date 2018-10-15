const AmqpConnector = require('./../../amqp-connector.js');

const amqpConnector = new AmqpConnector('localhost:5672'); // app.get('rabbitmq'), app
amqpConnector.connect().then(() => {console.log("Successfully connected to amqp");});

exports.isApproved = async function (context) {
  const count = context.data.approvalCount;
  const _id = context.data._id;

  if (context.data.approved) {
    return context; // if it is already an approved resource, don't do anything
  }

  if (count > 2) {
    context.data.approved = true;
    context.app.service('resources').update(_id, context.data);

    amqpConnector.sendToQueue('my-queue', '{"name": "ContentAccepted", "user_id": "' + context.data.userId + '"}').then(() => {console.log("ContentAccepted successful")});
  } else if (count < -2) {
    context.data.denied = true;
    context.app.service('resources').update(_id, context.data);
  } else {
    console.log("We have to wait for more conclusive ratings.");
  }

  return context;
};

exports.rate = async function (context) {
  console.log("in rating hook; approved? ", context.data.approved);
  const _id = context.params.req.params.__feathersId;

  const resource = await context.app.service('resources').get(_id);


  const approvalModifier = context.data.approved ? 1 : -1;
  if (resource.approvalCount) {
    resource.approvalCount += approvalModifier;
  } else {
    resource.approvalCount = approvalModifier;
  }
  if (resource.ratings) {
    resource.ratings.push(context.data.rating)
  } else {
    resource.ratings = [context.data.rating]
  }

  console.log("Is it approved? ", context.data.approved, " approvalModifier: ", approvalModifier);
  console.log('{"name": "RateContent", "user_id": "' + context.data.rating.userId + '"}');
  amqpConnector.sendToQueue('my-queue', '{"name": "RateContent", "user_id": "' + context.data.rating.userId + '"}').then(() => {console.log("RateContent successful")});

  context.data = resource;

  return context;
};

exports.created = async function (context) {
  console.log("Created with the following data:");
  console.log(context.data);
  if (context.data.onlyPrivat) {
    amqpConnector.sendToQueue('my-queue', '{"name": "SubmitContent", "user_id": "' + context.data.userId + '"}').then(() => {console.log("SubmitContent successful for user ", context.data.userId)});
  } else {
    amqpConnector.sendToQueue('my-queue', '{"name": "PublishContent", "user_id": "' + context.data.userId + '"}').then(() => {console.log("PublishContent successful for user ", context.data.userId)});
  }

  return context;
};
