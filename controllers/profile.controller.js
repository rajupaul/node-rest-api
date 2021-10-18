const { Validator } = require('node-input-validator');
const bcrypt=require('bcrypt');
const User=require('./../models/user.model');
const jwt=require('jsonwebtoken');
const fs=require('fs');
exports.current_user=(req,res)=>{
	return res.status(200).send({
		message:'Current user data successfully fetched',
		data:req.user
	});
}
exports.change_password=async(req,res)=>{
	try{
		const v = new Validator(req.body, {
			old_password: 'required',
			new_password: 'required',
			confirm_password: 'required|same:new_password'
		});

		const matched = await v.check();

		if (!matched) {
			return res.status(422).send(v.errors);
		}

		let current_user=req.user;
		if(bcrypt.compareSync(req.body.old_password,current_user.password)){

			let hashPassword=bcrypt.hashSync(req.body.new_password,10);
			await User.updateOne({
				_id:current_user._id
			},{
				password:hashPassword
			});

			let userData=await User.findOne({_id:current_user._id})

			let jwt_secret=process.env.JWT_SECRET||'mysecret';
			let token=jwt.sign({
			  data: userData
			}, jwt_secret, { expiresIn: '12h' });

			return res.status(200).send({
				message:'Password successfully updated',
				data:userData,
				token:token
			});

		}else{
			return res.status(400).send({
				message:'Old password does not matched',
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

exports.update_profile=async (req,res)=>{
	try{
		let rules={
			first_name:'required|minLength:2|maxLength:100',
			last_name:'required|minLength:2|maxLength:100',
		};
		if(req.files && req.files.profile_image){
			req.body['profile_image']=req.files.profile_image;
			rules['profile_image']='required|mime:jpg,jpeg,png';
		}
		const v = new Validator(req.body,rules);

		const matched = await v.check();

		if (!matched) {
			return res.status(422).send(v.errors);
		}

		let current_user=req.user;

		if(req.files && req.files.profile_image){
            var image_file= req.files.profile_image;
            var image_file_name=Date.now()+'-profile-image-'+image_file.name;
            var image_path=publicPath+'/uploads/profile_images/'+image_file_name;
            await image_file.mv(image_path);


            if(current_user.profile_image && current_user.profile_image==''){
	            let old_path=publicPath+'/uploads/profile_images/'+current_user.profile_image;
	            if(fs.existsSync(old_path)){
	            	fs.unlinkSync(old_path);
	            }
            }


		}else{
			var image_file_name=current_user.profile_image;
		}

		await User.updateOne({
			_id:current_user._id
		},{
			first_name:req.body.first_name,
			last_name:req.body.last_name,
			profile_image:image_file_name,
			profession:req.body.profession?req.body.profession:''
		});

			let userData=await User.findOne({_id:current_user._id})
			let jwt_secret=process.env.JWT_SECRET||'mysecret';
			let token=jwt.sign({
			  data: userData
			}, jwt_secret, { expiresIn: '12h' });

			return res.status(200).send({
				message:'Profile successfully updated',
				data:userData,
				token:token
			});


	}catch(err){
		return res.status(400).send({
			message:err.message,
			data:err
		});
	}

}





