const router=require('express').Router();
const profileController=require('./../controllers/profile.controller')
const middleware=require('./../helpers/middleware');
router.get('/current-user',middleware.auth,profileController.current_user);
router.post('/change-password',middleware.auth,profileController.change_password);
router.put('/update-profile',middleware.auth,profileController.update_profile);
module.exports=router;