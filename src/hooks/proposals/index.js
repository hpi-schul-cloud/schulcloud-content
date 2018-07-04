exports.isApproved = async function (context) {
  const count = context.data.approvalCount;
  const _id = context.data._id;
  // TODO: Instead of just logging the action, do it. ;)
  if (count > 2) {
    console.log("Approved!");
    // console.log(context.data);
    context.app.service('teacherContents').create(context.data);
    context.app.service('proposals').remove(_id);
    // TODO: Send event that gives author 50 points
    console.log("Teacher with ID " + context.data.userId + " should get 50 points");
  } else if (count < -2) {
    context.app.service('proposals').remove(_id);
  } else {
    console.log("We have to wait for more conclusive ratings.");
  }
  return context;
};

exports.rate = async function (context) {
  const _id = context.params.req.params.__feathersId;

  const proposal = await context.app.service('proposals').get(_id);

  const approvalModifier = context.data.approved ? 1 : -1;
  proposal.approvalCount += approvalModifier;
  proposal.ratings.push(context.data.rating);

  // TODO: Send event that will give context.data.rating.userId 5 points
  console.log("Teacher with ID " + context.data.rating.userId + " should get 5 points");

  context.data = proposal;
  // Returning will resolve the promise with the `context` object
  return context;
};

exports.created = async function (context) {
  // TODO: Send event that will give context.data.rating.userId 5 points
  console.log("Teacher with ID " + context.data.userId + " should get 5 points");

  return context;
};
