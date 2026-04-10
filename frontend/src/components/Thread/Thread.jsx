import React, { useContext, useEffect } from 'react';
import { CommentContext } from '../../context/CommentContext';
import { AuthContext } from '../../context/AuthContext';
import Comment from '../Comment/Comment';
import CommentForm from '../CommentForm/CommentForm';

const Thread = () => {
  const { comments, loading, page, totalPages, fetchComments, addComment } = useContext(CommentContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleAddComment = async (content) => {
    await addComment(content);
  };

  const loadMore = () => {
    if (page < totalPages) {
      fetchComments(page + 1);
    }
  };

  return (
    <div className="thread-container">
      <h2>Discussion Thread</h2>
      <div className="thread-meta">
        <span className="total-comments">Total Comments: {comments.length > 0 ? comments.length + '+' : '0'}</span>
      </div>
      
      {user ? (
        <div className="new-comment-section">
          <h3>Leave a comment</h3>
          <CommentForm onSubmit={handleAddComment} placeholder="What are your thoughts?" />
        </div>
      ) : (
        <div className="login-prompt">
          Please log in to leave a comment.
        </div>
      )}

      {loading && page === 1 ? (
        <div className="loading">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <Comment key={comment._id} comment={comment} />
          ))}
          
          {comments.length === 0 && !loading && (
            <div className="no-comments">No comments yet. Be the first to start the discussion!</div>
          )}
        </div>
      )}

      {page < totalPages && (
         <button className="load-more-btn" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
         </button>
      )}
    </div>
  );
};

export default Thread;
