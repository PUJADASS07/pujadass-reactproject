import React, { useState } from 'react';

const CommentForm = ({ onSubmit, initialValue = '', onCancel, placeholder = 'Add a comment...' }) => {
  const [content, setContent] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows="3"
        required
      />
      <div className="form-actions">
        {onCancel && <button type="button" onClick={onCancel} className="btn-cancel">Cancel</button>}
        <button type="submit" className="btn-submit" disabled={!content.trim()}>Submit</button>
      </div>
    </form>
  );
};

export default CommentForm;
