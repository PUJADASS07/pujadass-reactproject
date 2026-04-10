const express = require('express');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const Comment = require('../models/Comment');

const router = express.Router();

// GET /api/comments?page=1&limit=10&parent=null
// Fetch comments (with pagination and optional parent filter)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const parentId = req.query.parent === 'null' ? null : req.query.parent || null;
    
    // Sort by descending if top-level, else ascending for replies
    const sort = parentId === null ? { createdAt: -1 } : { createdAt: 1 };

    const skip = (page - 1) * limit;

    const query = { parentCommentId: parentId };
    
    const comments = await Comment.find(query)
      .populate('user', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments(query);
    
    // To support "total replies count", maybe fetch direct children count
    const commentsWithReplyCount = await Promise.all(comments.map(async (c) => {
        const replyCount = await Comment.countDocuments({ parentCommentId: c._id });
        const obj = c.toObject();
        obj.replyCount = replyCount;
        return obj;
    }));

    res.json({
      comments: commentsWithReplyCount,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/comments (Create top-level comment)
router.post('/', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const comment = await Comment.create({
      content,
      user: req.user._id,
      parentCommentId: null
    });

    await comment.populate('user', 'username');
    const obj = comment.toObject();
    obj.replyCount = 0;
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/comments/:id/reply (Reply to a comment)
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const parentId = req.params.id;
    
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const parentExists = await Comment.findById(parentId);
    if (!parentExists) return res.status(404).json({ message: 'Parent comment not found' });

    const comment = await Comment.create({
      content,
      user: req.user._id,
      parentCommentId: parentId
    });

    await comment.populate('user', 'username');
    const obj = comment.toObject();
    obj.replyCount = 0;
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/comments/:id (Edit comment)
router.put('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.body.content) {
      comment.content = req.body.content;
    }

    const updatedComment = await comment.save();
    await updatedComment.populate('user', 'username');
    
    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/comments/:id (Delete comment)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Also delete all replies recursively? 
    // For simplicity, let's just delete the comment and its direct replies, or mark it as deleted.
    // We will just do a cascade delete
    async function deleteReplies(commentId) {
       const replies = await Comment.find({ parentCommentId: commentId });
       for (const r of replies) {
           await deleteReplies(r._id);
           await Comment.findByIdAndDelete(r._id);
       }
    }
    await deleteReplies(comment._id);
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/comments/:id/like
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id;

    // remove from dislikes if there
    comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());

    const isLiked = comment.likes.find(id => id.toString() === userId.toString());
    if (isLiked) {
      // unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // like
      comment.likes.push(userId);
    }

    await comment.save();
    await comment.populate('user', 'username');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/comments/:id/dislike
router.post('/:id/dislike', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userId = req.user._id;

    // remove from likes if there
    comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());

    const isDisliked = comment.dislikes.find(id => id.toString() === userId.toString());
    if (isDisliked) {
      // undislike
      comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId.toString());
    } else {
      // dislike
      comment.dislikes.push(userId);
    }

    await comment.save();
    await comment.populate('user', 'username');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
