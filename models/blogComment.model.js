const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const schema = new mongoose.Schema({
	comment:String,
	blog_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
},{
    timestamps:true,
});


const BlogComment = mongoose.model('BlogComment', schema);
module.exports = BlogComment;