import React, { createContext, useState, useCallback } from 'react';
import api from '../services/api';

export const CommentContext = createContext();

export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get(`/comments?page=${p}&limit=10&parent=null`);
      if (p === 1) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }
      setPage(data.page);
      setTotalPages(data.pages);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, []);

  const addComment = async (content) => {
    const { data } = await api.post('/comments', { content });
    setComments([data, ...comments]);
  };

  const addReply = async (parentId, content) => {
    const { data } = await api.post(`/comments/${parentId}/reply`, { content });
    // Increase reply count optimistically on top-level comment if possible
    setComments(prev => prev.map(c => c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c));
    return data;
  };

  const updateComment = async (id, content) => {
    const { data } = await api.put(`/comments/${id}`, { content });
    setComments(prev => prev.map(c => c._id === id ? { ...c, content: data.content } : c));
    return data;
  };

  const deleteComment = async (id) => {
    await api.delete(`/comments/${id}`);
    setComments(prev => prev.filter(c => c._id !== id));
  };

  const toggleLike = async (id, type) => {
    const { data } = await api.post(`/comments/${id}/${type}`);
    setComments(prev => prev.map(c => c._id === id ? { ...c, likes: data.likes, dislikes: data.dislikes } : c));
    return data;
  };

  return (
    <CommentContext.Provider value={{
      comments, loading, page, totalPages,
      fetchComments, addComment, addReply, updateComment, deleteComment, toggleLike
    }}>
      {children}
    </CommentContext.Provider>
  );
};
