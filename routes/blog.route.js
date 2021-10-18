const router=require('express').Router();
const blogController=require('./../controllers/blog.controller')
const middleware=require('./../helpers/middleware');

router.get('/',blogController.list)
router.get('/:blog_id',middleware.api,blogController.details)
router.post('/create',middleware.auth,blogController.create);
router.put('/:blog_id/update',middleware.auth,blogController.update)
router.delete('/:blog_id/delete',middleware.auth,blogController.delete)
router.post('/:blog_id/toggle-like',middleware.auth,blogController.toggle_like)
module.exports=router;