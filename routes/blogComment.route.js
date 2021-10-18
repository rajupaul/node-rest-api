const router=require('express').Router();
const blogCommentController=require('./../controllers/blogComment.controller')
const middleware=require('./../helpers/middleware');

router.get('/:blog_id/comments',blogCommentController.list)
router.post('/:blog_id/comments/create',middleware.auth,blogCommentController.create)
router.put('/comments/:comment_id/update',middleware.auth,blogCommentController.update)
router.delete('/comments/:comment_id/delete',middleware.auth,blogCommentController.delete)
module.exports=router;