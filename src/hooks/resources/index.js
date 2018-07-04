exports.isApproved = async function (context) {
  const count = context.data.approvalCount;
  const _id = context.data._id;

  if (context.data.approved) {
    return context; // if it is already an approved resource, don't do anything
  }

  if (count > 2) {
    context.data.approved = true;
    context.app.service('resources').update(_id, context.data);

    console.log("Content approved. Teacher with ID " + context.data.userId + " should get 50 points"); // TODO: Send event that gives author 50 points
  } else if (count < -2) {
    context.app.service('resources').remove(_id);
  } else {
    console.log("We have to wait for more conclusive ratings.");
  }

  return context;
};

exports.rate = async function (context) {
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

  console.log("Teacher with ID " + context.data.rating.userId + " should get 5 points"); // TODO: Send event that will give context.data.rating.userId 5 points

  context.data = resource;

  return context;
};

exports.created = async function (context) {
  console.log("Teacher with ID " + context.data.userId + " should get 5 points"); // TODO: Send event that will give context.data.rating.userId 5 points

  return context;
};
