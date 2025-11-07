import React, { useState, useEffect } from 'react';
import { User, Mail, Save, Camera } from 'lucide-react';
import { usersAPI, uploadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await usersAPI.updateProfile(formData);
      updateUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await uploadAPI.uploadFile(formData);
      const newAvatar = response.data.fileUrl;

      const profileResponse = await usersAPI.updateProfile({ avatar: newAvatar });
      updateUser(profileResponse.data);
      setFormData(prev => ({ ...prev, avatar: newAvatar }));
      toast.success('Avatar updated successfully!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-content">
          <h2 className="profile-title">Profile Settings</h2>

          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <img
                className="profile-avatar"
                src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=667eea&color=fff`}
                alt={formData.name}
              />
              <label
                htmlFor="avatar-upload"
                className="profile-avatar-edit"
              >
                <Camera />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="avatar-upload-input"
                />
              </label>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{formData.name}</h3>
              <p className="profile-email">{formData.email}</p>
              <p className="profile-verification">
                {user?.isEmailVerified ? (
                  <span className="profile-verified">✓ Email verified</span>
                ) : (
                  <span className="profile-not-verified">! Email not verified</span>
                )}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="form-input-container">
                <div className="form-input-icon">
                  <User />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="form-input-container">
                <div className="form-input-icon">
                  <Mail />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="form-input"
                  placeholder="Your email address"
                />
              </div>
              <p className="form-help">
                Email cannot be changed for security reasons.
              </p>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className="save-btn"
              >
                {saving ? (
                  <>
                    <div className="loading-spinner"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;