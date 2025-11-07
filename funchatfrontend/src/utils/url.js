const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

export const getAvatarUrl = (name, avatar) => {
  if (avatar) return getFileUrl(avatar);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`;
};