const { Validator } = require('node-input-validator');
const Blog=require('./../models/blog.model');
const category=require('./../models/category.model');
const mongoose=require('mongoose');
const fs=require('fs');
const BlogLike=require('./../models/blogLike.model');
exports.list=async(req,res)=>{

	try{
		// let query={};
		// if(req.query.category){
		// 	query.category=req.query.category;
		// }
		// if(req.query.keyword){
		// 	query.$or=[
		// 		{ "title" : { $regex: req.query.keyword, $options: 'i' } },
		// 		{ "short_description" : { $regex: req.query.keyword, $options: 'i' } },
		// 	];
		// }
		// let blogs=await Blog.find(query)
		// .populate('category')
		// .populate('created_by')
		// .skip(0)
		// .limit(2)
		// .sort({ createdAt: -1 });
		// return res.status(200).send({
		// 	message:'Blog successfully fetched',
		// 	data:blogs
		// });

		let query=[
			{
				$lookup:
				{
				 from: "users",
				 localField: "created_by",
				 foreignField: "_id",
				 as: "creator"
				}
			},
			{$unwind: '$creator'},
			{
				$lookup:
				{
				 from: "categories",
				 localField: "category",
				 foreignField: "_id",
				 as: "category_details"
				}
			},
			{$unwind: '$category_details'},
		];

		if(req.query.keyword && req.query.keyword!=''){ 
			query.push({
			  $match: { 
			    $or :[
			      {
			        title : { $regex: req.query.keyword } 
			      },
			      {
			        'category_details.name' : { $regex: req.query.keyword } 
			      },
			      {
			        'creator.email' : { $regex: req.query.keyword } 
			      }
			    ]
			  }
			});
		}

		if(req.query.category){		
			query.push({
			    $match: { 
			    	'category_details.slug':req.query.category,
			    }	
			});
		}

		if(req.query.user_id){		
			query.push({
			    $match: { 
			    	created_by:mongoose.Types.ObjectId(req.query.user_id),
			    }	
			});
		}

		let total=await Blog.countDocuments(query);
		let page=(req.query.page)?parseInt(req.query.page):1;
		let perPage=(req.query.perPage)?parseInt(req.query.perPage):10;
		let skip=(page-1)*perPage;
		query.push({
			$skip:skip,
		});
		query.push({
			$limit:perPage,
		});

		query.push(
	    	{ 
	    		$project : {
    			"_id":1,
    			"createdAt":1,
	    		"title": 1,
	    		"short_description":1,
	    		"description":1,
				"image":1,
	    		"category_details.name":1,
				"category_details.slug":1,
				"category_details._id":1,
				"creator._id":1 ,
	    		"creator.email":1 ,
	    		"creator.first_name":1,
	    		"creator.last_name":1,
	    		"comments_count":{$size:{"$ifNull":["$blog_comments",[]]}},
	    		"likes_count":{$size:{"$ifNull":["$blog_likes",[]]}}
	    		} 
	    	}
	    );
	    if(req.query.sortBy && req.query.sortOrder){
			var sort = {};
			sort[req.query.sortBy] = (req.query.sortOrder=='asc')?1:-1;
			query.push({
				$sort: sort
			});
		}else{
			query.push({
				$sort: {createdAt:-1}
			});	
		}

		let blogs=await Blog.aggregate(query);
		return res.send({
	  		message:'Blog successfully fetched',
	  		data:{
	  			blogs:blogs.map(doc => Blog.hydrate(doc)),
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

exports.details=async(req,res)=>{
	try{

		let blog_id=req.params.blog_id;

		if(!mongoose.Types.ObjectId.isValid(blog_id)){
			return res.status(400).send({
		  		message:'Invalid blog id',
		  		data:{}
		  	});
		}

		// let blog=await Blog.findOne({_id:blog_id})
		// .populate('category')
		// .populate('created_by');
		let query=[
			{
				$lookup:
				{
				 from: "users",
				 localField: "created_by",
				 foreignField: "_id",
				 as: "creator"
				}
			},
			{$unwind: '$creator'},
			{
				$lookup:
				{
				 from: "categories",
				 localField: "category",
				 foreignField: "_id",
				 as: "category_details"
				}
			},
			{$unwind: '$category_details'},
			{
				$match:{
					'_id':mongoose.Types.ObjectId(blog_id)
				}
			},
			{ 
	    		$project : {
    			"_id":1,
    			"createdAt":1,
	    		"title": 1,
	    		"short_description":1,
	    		"description":1,
				"image":1,
	    		"category_details.name":1,
				"category_details.slug":1,
				"category_details._id":1,
				"creator._id":1 ,
	    		"creator.email":1 ,
	    		"creator.first_name":1,
	    		"creator.last_name":1,
	    		"comments_count":{$size:{"$ifNull":["$blog_comments",[]]}},
	    		"likes_count":{$size:{"$ifNull":["$blog_likes",[]]}}
	    		} 
	    	}
		];

		let blogs=await Blog.aggregate(query);

		if(blogs.length>0){
			let blog=blogs[0];
			let current_user=req.user;
			let liked_by_current_user=false;
			if(current_user){
				let blog_like=await BlogLike.findOne({
					blog_id:blog._id,
					user_id:current_user._id
				});
				if(blog_like){
					liked_by_current_user=true;
				}
			}

			return res.status(200).send({
				message:'Blog successfully fetched',
				data:{
					blog:Blog.hydrate(blog) ,
					meta:{
						liked_by_current_user:liked_by_current_user
					}
				}
			});
		}else{
			return res.status(400).send({
				message:'No blog found',
				data:{}
			});	
		}



	}catch(err){
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	}
}
exports.create=async (req,res)=>{

	if(req.files && req.files.image){
		req.body['image']=req.files.image;
	}
	const v = new Validator(req.body, {
		title:'required|minLength:5|maxLength:100',
		short_description:'required',
		description:'required',
		category: 'required',
		image:'required|mime:jpg.jpeg,png'
	});
	const matched = await v.check();
	if (!matched) {
		return res.status(422).send(v.errors);
	}

	try{

	    if(req.files && req.files.image){
            var image_file= req.files.image;
            var image_file_name=Date.now()+'-blog-image-'+image_file.name;
            var image_path=publicPath+'/uploads/blog_images/'+image_file_name;
            await image_file.mv(image_path);
		}

	  	const newBlog = new Blog({
	  	 title:req.body.title,
		 short_description:req.body.short_description,
	  	 description:req.body.description,
	  	 category:req.body.category,
	  	 created_by:req.user._id,
	  	 image:image_file_name
	  	});
	  	let blogData=await newBlog.save();
	  	
		let query=[
			{
				$lookup:
				{
				 from: "users",
				 localField: "created_by",
				 foreignField: "_id",
				 as: "creator"
				}
			},
			{$unwind: '$creator'},
			{
				$lookup:
				{
				 from: "categories",
				 localField: "category",
				 foreignField: "_id",
				 as: "category_details"
				}
			},
			{$unwind: '$category_details'},
			{
				$match:{
					'_id':mongoose.Types.ObjectId(blogData._id)
				}
			},
			{ 
	    		$project : {
    			"_id":1,
    			"createdAt":1,
	    		"title": 1,
	    		"short_description":1,
	    		"description":1,
				"image":1,
	    		"category_details.name":1,
				"category_details.slug":1,
				"category_details._id":1,
				"creator._id":1 ,
	    		"creator.email":1 ,
	    		"creator.first_name":1,
	    		"creator.last_name":1,
	    		"comments_count":{$size:{"$ifNull":["$blog_comments",[]]}},
	    		"likes_count":{$size:{"$ifNull":["$blog_likes",[]]}}
	    		} 
	    	}
		];

		let blogs=await Blog.aggregate(query);

	  	
	  	return res.status(201).send({
	  		message:'Blog created successfully',
	  		data:Blog.hydrate(blogs[0]) 
	  	});



	}catch(err){

		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});

	}
}

exports.update=async(req,res)=>{
	let blog_id=req.params.blog_id;
	if(!mongoose.Types.ObjectId.isValid(blog_id)){
		return res.status(400).send({
	  		message:'Invalid blog id',
	  		data:{}
	  	});
	}
	Blog.findOne({_id:blog_id}).then(async(blog)=>{
		if(!blog){
			return res.status(400).send({
		  		message:'No blog found',
		  		data:{}
		  	});
		}else{
			let current_user=req.user;

			if(blog.created_by!=current_user._id){
				return res.status(400).send({
			  		message:'Access denied',
			  		data:{}
			  	});
			}else{

				try{
					let rules={
						title:'required|minLength:5|maxLength:100',
						short_description:'required',
						description:'required',
						category: 'required'
					};
					if(req.files && req.files.image){
						req.body['image']=req.files.image;
						rules['image']='required|mime:jpg.jpeg,png'
					}
					const v = new Validator(req.body, rules);
					const matched = await v.check();
					if (!matched) {
						return res.status(422).send(v.errors);
					}

				    if(req.files && req.files.image){
			            var image_file= req.files.image;
			            var image_file_name=Date.now()+'-blog-image-'+image_file.name;
			            var image_path=publicPath+'/uploads/blog_images/'+image_file_name;
			            await image_file.mv(image_path);

			            let old_path=publicPath+'/uploads/blog_images/'+blog.image;
			            if(fs.existsSync(old_path)){
			            	fs.unlinkSync(old_path);
			            }

					}else{
						var image_file_name=blog.image;
					}


					await Blog.updateOne({_id:blog_id},{
				  	 title:req.body.title,
					 short_description:req.body.short_description,
				  	 description:req.body.description,
				  	 category:req.body.category,
				  	 image:image_file_name
					});



					let query=[
					{
						$lookup:
						{
						 from: "users",
						 localField: "created_by",
						 foreignField: "_id",
						 as: "creator"
						}
					},
					{$unwind: '$creator'},
					{
						$lookup:
						{
						 from: "categories",
						 localField: "category",
						 foreignField: "_id",
						 as: "category_details"
						}
					},
					{$unwind: '$category_details'},
					{
						$match:{
							'_id':mongoose.Types.ObjectId(blog_id)
						}
					},
					{ 
			    		$project : {
		    			"_id":1,
		    			"createdAt":1,
			    		"title": 1,
			    		"short_description":1,
			    		"description":1,
						"image":1,
			    		"category_details.name":1,
						"category_details.slug":1,
						"category_details._id":1,
						"creator._id":1 ,
			    		"creator.email":1 ,
			    		"creator.first_name":1,
			    		"creator.last_name":1,
			    		"comments_count":{$size:{"$ifNull":["$blog_comments",[]]}},
			    		"likes_count":{$size:{"$ifNull":["$blog_likes",[]]}}
			    		} 
			    	}
				];

				let blogs=await Blog.aggregate(query);
			  	return res.status(200).send({
			  		message:'Blog successfully updated',
			  		data:Blog.hydrate(blogs[0]) 
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

exports.delete=async (req,res)=>{
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
			let current_user=req.user;
			if(blog.created_by!=current_user._id){
				return res.status(400).send({
			  		message:'Access denied',
			  		data:{}
			  	});
			}else{

				let old_path=publicPath+'/uploads/blog_images/'+blog.image;
				if(fs.existsSync(old_path)){
					fs.unlinkSync(old_path);
				}

				await Blog.deleteOne({_id:blog_id});
				return res.status(200).send({
			  		message:'Blog successfully deleted',
			  		data:{}
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

exports.toggle_like=async(req,res)=>{
	let blog_id=req.params.blog_id;
	if(!mongoose.Types.ObjectId.isValid(blog_id)){
		return res.status(400).send({
	  		message:'Invalid blog id',
	  		data:{}
	  	});
	}

	Blog.findOne({_id:blog_id}).then(async(blog)=>{
		if(!blog){
			return res.status(400).send({
		  		message:'No blog found',
		  		data:{}
		  	});
		}else{
			let current_user=req.user;

			BlogLike.findOne({
				blog_id:blog_id,
				user_id:current_user._id
			}).then(async (blog_like)=>{
				try{
					if(!blog_like){
						let blogLikeDoc=new BlogLike({
							blog_id:blog_id,
							user_id:current_user._id
						});
						let likeData=await blogLikeDoc.save();
						await Blog.updateOne({
							_id:blog_id
						},{
							$push:{blog_likes:likeData._id}
						})
						return res.status(200).send({
					  		message:'Like successfully added',
					  		data:{}
					  	});

					}else{

						await BlogLike.deleteOne({
							_id:blog_like._id
						});

						await Blog.updateOne({
							_id:blog_like.blog_id
						},{
							$pull:{blog_likes:blog_like._id}
						})

						return res.status(200).send({
					  		message:'Like successfully removed',
					  		data:{}
					  	});


					}
				}catch(err){
					return res.status(400).send({
				  		message:err.message,
				  		data:err
				  	});
				}

			}).catch((err)=>{
				return res.status(400).send({
			  		message:err.message,
			  		data:err
			  	});
			})

		}
	}).catch((err)=>{
		return res.status(400).send({
	  		message:err.message,
	  		data:err
	  	});
	})



}




