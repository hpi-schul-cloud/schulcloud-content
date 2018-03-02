// rating-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function(app) {
    const mongooseClient = app.get('mongooseClient');
    const rating = new mongooseClient.Schema({
        materialId: { type: mongooseClient.Schema.ObjectId, ref: 'resource', required: true },
        rating: { type: Number, min: 0, max: 5, required: true },
        isTeacherRating: { type: Boolean, required: true },
        topicId: { type: mongooseClient.Schema.Types.ObjectId, required: true },
        courseId: { type: mongooseClient.Schema.Types.ObjectId, required: true },
        createdAt: { type: Date, default: Date.now }
    });

    return mongooseClient.model('rating', rating);
};

// get overall average: db.getCollection('ratings').aggregate([{$group: {_id: 0, avgRating: { $avg: "$rating"}}}])
// get teacher/pupil average: db.getCollection('ratings').aggregate([{$group: {_id: "$isTeacherRating", avgRating: { $avg: "$rating"}}}])
