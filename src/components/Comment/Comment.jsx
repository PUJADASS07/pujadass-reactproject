import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CommentContext } from '../../context/CommentContext';
import CommentForm from '../CommentForm/CommentForm';
import api from '../../services/api';
import { ThumbsUp, ThumbsDown, MessageSquare, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Comment = ({ comment: initialComment, parentCommentId = null, onReplyDelete }) => {
  const { user } = useContext(AuthContext);
  const { toggleLike, updateComment, deleteComment, addReply } = useContext(CommentContext);
  
  const [commentState, setCommentState] = useState(initialComment);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const isOwner = user && commentState.user._id === user._id;
  const hasLiked = user && commentState.likes.includes(user._id);
  const hasDisliked = user && commentState.dislikes.includes(user._id);
  
  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const { data } = await api.get(`/comments?parent=${commentState._id}&limit=100`);
      setReplies(data.comments);
      setShowReplies(true);
      setLoadingReplies(false);
    } catch (error) {
      console.error("Failed to fetch replies", error);
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = () => {
    if (!showReplies && replies.length === 0 && commentState.replyCount > 0) {
      fetchReplies();
    } else {
      setShowReplies(!showReplies);
    }
  };

  const handleReplySubmit = async (content) => {
    const newReply = await addReply(commentState._id, content);
    setReplies(prev => [...prev, newReply]);
    setCommentState(prev => ({ ...prev, replyCount: (prev.replyCount || 0) + 1 }));
    setIsReplying(false);
    setShowReplies(true);
  };

  const handleEditSubmit = async (content) => {
    const updated = await updateComment(commentState._id, content);
    setCommentState(prev => ({ ...prev, content: updated.content }));
    setIsEditing(false);
  };

  const handleLike = async () => {
    if (!user) return alert("Please login to vote");
    const isCurrentlyLiked = hasLiked;
    
    let newLikes = [...commentState.likes];
    let newDislikes = [...commentState.dislikes];

    if (isCurrentlyLiked) {
      newLikes = newLikes.filter(id => id !== user._id);
    } else {
      newLikes.push(user._id);
      newDislikes = newDislikes.filter(id => id !== user._id);
    }

    setCommentState(prev => ({ ...prev, likes: newLikes, dislikes: newDislikes }));
    
    const updated = await toggleLike(commentState._id, 'like');
    setCommentState(prev => ({ ...prev, likes: updated.likes, dislikes: updated.dislikes }));
  };

  const handleDislike = async () => {
    if (!user) return alert("Please login to vote");
    const isCurrentlyDisliked = hasDisliked;
    
    let newLikes = [...commentState.likes];
    let newDislikes = [...commentState.dislikes];

    if (isCurrentlyDisliked) {
      newDislikes = newDislikes.filter(id => id !== user._id);
    } else {
      newDislikes.push(user._id);
      newLikes = newLikes.filter(id => id !== user._id);
    }

    setCommentState(prev => ({ ...prev, likes: newLikes, dislikes: newDislikes }));
    
    const updated = await toggleLike(commentState._id, 'dislike');
    setCommentState(prev => ({ ...prev, likes: updated.likes, dislikes: updated.dislikes }));
  };
  
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
       deleteComment(commentState._id);
       if (onReplyDelete) {
           onReplyDelete(commentState._id);
       }
    }
  };

  const handleReplyDeleteLocal = (replyId) => {
      setReplies(prev => prev.filter(r => r._id !== replyId));
      setCommentState(prev => ({ ...prev, replyCount: Math.max(0, (prev.replyCount || 0) - 1) }));
  };

  return (
    <div className={`comment-card ${parentCommentId ? 'nested-reply' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{commentState.user?.username || 'Unknown'}</span>
        <span className="comment-time">{formatDistanceToNow(new Date(commentState.createdAt), { addSuffix: true })}</span>
      </div>
      
      {isEditing ? (
        <CommentForm 
          initialValue={commentState.content} 
          onSubmit={handleEditSubmit} 
          onCancel={() => setIsEditing(false)} 
        />
      ) : (
        <div className="comment-content">{commentState.content}</div>
      )}

      <div className="comment-actions">
        <button className={`action-btn ${hasLiked ? 'active-like' : ''}`} onClick={handleLike}>
          <ThumbsUp size={16} /> {commentState.likes.length}
        </button>
        <button className={`action-btn ${hasDisliked ? 'active-dislike' : ''}`} onClick={handleDislike}>
          <ThumbsDown size={16} /> {commentState.dislikes.length}
        </button>
        
        <button className="action-btn" onClick={() => setIsReplying(!isReplying)}>
          <MessageSquare size={16} /> Reply
        </button>

        {isOwner && (
          <>
            <button className="action-btn owner-action" onClick={() => setIsEditing(!isEditing)}>
              <Edit2 size={16} />
            </button>
            <button className="action-btn owner-action delete" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>

      {isReplying && (
        <div className="reply-form-container">
          <CommentForm onSubmit={handleReplySubmit} onCancel={() => setIsReplying(false)} placeholder="Write a reply..." />
        </div>
      )}

      {commentState.replyCount > 0 && (
        <button className="toggle-replies-btn" onClick={handleToggleReplies}>
           {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
           {showReplies ? "Hide Replies" : `View ${commentState.replyCount} Replies`}
        </button>
      )}

      {loadingReplies && <div className="loading-small">Loading...</div>}

      {showReplies && (
        <div className="replies-container">
          {replies.map(reply => (
             <Comment 
                key={reply._id} 
                comment={reply} 
                parentCommentId={commentState._id} 
                onReplyDelete={handleReplyDeleteLocal}
             />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;
