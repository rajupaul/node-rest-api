const Blog=require('./../models/blog.model');
const BlogComment=require('./../models/blogComment.model');
const mongoose=require('mongoose');
const { Validator } = require('node-input-validator');
exports.list=(req,res)=>{
	let blog_id=req.params.blog_id;
	if(!mongoose.Types.ObjectId.isValid(blog_id)){
		return res.status(400).send({
	  		message:'Invalid blog id',
	  		data:{}
	  	});
	}

	Blog.findOne({_id:blog_id}).then(async (blog)=>{
		if(!blog){
			return res.status(400).send({
				message:'No blog found',
				data:{}
			});	
		}else{

			try{
				let query=[
					{
						$lookup:
						{
						 from: "users",
						 localField: "user_id",
						 foreignField: "_id",
						 as: "user"
						}
					},
					{$unwind: '$user'},
					{
						$match:{
							'blog_id':mongoose.Types.ObjectId(blog_id)
						}
					},
					{
						$sort:{
							createdAt:-1
						}
					}
				];

				let total=await BlogComment.countDocuments(query);
				let page=(req.query.page)?parseInt(req.query.page):1;
				let perPage=(req.query.perPage)?parseInt(req.query.perPage):10;
				let skip=(page-1)*perPage;
				query.push({
					$skip:skip,
				});
				query.push({
					$limit:perPage,
				});

				let comments=await BlogComment.aggregate(query);
				return res.send({
		  		    message:'Comment successfully fetched',
			  		data:{
			  			comments:comments,
			  			meta:{
			  				total:total,
			  				currentPage:page,
			  				perPage:perPage,
			  				totalPages:Math.ceil(total/perPage)
		  			    }
			  		}
		  	    });

			}catch(err){
				return res.status(400).send({
			  		message:err.message,
			  		data:err
			  	});
			}



		}
	}).catch((err)=>{
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	})	



}
exports.create=async (req,res)=>{
	let blog_id=req.params.blog_id;
	if(!mongoose.Types.ObjectId.isValid(blog_id)){
		return res.status(400).send({
	  		message:'Invalid blog id',
	  		data:{}
	  	});
	}
	Blog.findOne({_id:blog_id}).then(async (blog)=>{
		if(!blog){
			return res.status(400).send({
				message:'No blog found',
				data:{}
			});	
		}else{

			try{
				const v = new Validator(req.body, {
					comment:'required',
				});
				const matched = await v.check();
				if (!matched) {
					return res.status(422).send(v.errors);
				}

				let newCommentDocument= new BlogComment({
					comment:req.body.comment,
					blog_id:blog_id,
					user_id:req.user._id
				});

				let commentData=await newCommentDocument.save();

				await Blog.updateOne(
					{_id:blog_id},
					{
						$push: { blog_comments :commentData._id  } 
					}
				)


				let query=[
					{
						$lookup:
						{
						 from: "users",
						 localField: "user_id",
						 foreignField: "_id",
						 as: "user"
						}
					},
					{$unwind: '$user'},
					{
						$match:{
							'_id':mongoose.Types.ObjectId(commentData._id)
						}
					},

				];

				let comments=await BlogComment.aggregate(query);

				return res.status(200).send({
					message:'Comment successfully added',
					data:comments[0]
				});


			}catch(err){
				return res.status(400).send({
			  		message:err.message,
			  		data:err
			  	});
			}

		
		}
	}).catch((err)=>{
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	})

}

exports.update=async (req,res)=>{
	let comment_id=req.params.comment_id;
	if(!mongoose.Types.ObjectId.isValid(comment_id)){
		return res.status(400).send({
	  		message:'Invalid comment id',
	  		data:{}
	  	});
	}

	BlogComment.findOne({_id:comment_id}).then(async (comment)=>{
		if(!comment){
			return res.status(400).send({
				message:'No comment found',
				data:{}
			});	
		}else{

			let current_user=req.user;

			if(comment.user_id!=current_user._id){
				return res.status(400).send({
					message:'Access denied',
					data:{}
				});	
			}else{

				try{
					const v = new Validator(req.body, {
						comment:'required',
					});
					const matched = await v.check();
					if (!matched) {
						return res.status(422).send(v.errors);
					}

					await BlogComment.updateOne({_id:comment_id},{
						comment:req.body.comment
					});


					let query=[
						{
							$lookup:
							{
							 from: "users",
							 localField: "user_id",
							 foreignField: "_id",
							 as: "user"
							}
						},
						{$unwind: '$user'},
						{
							$match:{
								'_id':mongoose.Types.ObjectId(comment_id)
							}
						},

					];

					let comments=await BlogComment.aggregate(query);

					return res.status(200).send({
						message:'Comment successfully updated',
						data:comments[0]
					});


				}catch(err){
					return res.status(400).send({
				  		message:err.message,
				  		data:err
				  	});
				}

				
			}




		}
	}).catch((err)=>{
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	})



}

exports.delete=(req,res)=>{
	let comment_id=req.params.comment_id;
	if(!mongoose.Types.ObjectId.isValid(comment_id)){
		return res.status(400).send({
	  		message:'Invalid comment id',
	  		data:{}
	  	});
	}

	BlogComment.findOne({_id:comment_id}).then(async (comment)=>{
		if(!comment){
			return res.status(400).send({
				message:'No comment found',
				data:{}
			});	
		}else{

			let current_user=req.user;

			if(comment.user_id!=current_user._id){
				return res.status(400).send({
					message:'Access denied',
					data:{}
				});	
			}else{
				try{
					await BlogComment.deleteOne({_id:comment_id})
					await Blog.updateOne(
						{_id:comment.blog_id},
						{
							$pull:{blog_comments:comment_id}
						}
					)

					return res.status(200).send({
						message:'Comment successfully deleted',
						data:{}
					});	
				}catch(err){
					return res.status(400).send({
				  		message:err.message,
				  		data:err
				  	});
				}


				
			}

		}
	}).catch((err)=>{
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	})


}






