const mongoose=require('mongoose');
const schema = new mongoose.Schema({
	slug:String,
 	name: String 
},{
	timestamps:true
});

const Category = mongoose.model('Category', schema);
module.exports = Category;