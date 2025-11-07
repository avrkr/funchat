import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        toast.error('Invalid verification token');
        navigate('/login');
        return;
      }

      try {
        const response = await authAPI.verifyEmail({ token });
        const { user, token: authToken } = response.data;
        
        login(user, authToken);
        setVerified(true);
        toast.success('Email verified successfully!');
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Email verification failed');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate, login]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-center">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="verify-success">
            <div className="verify-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="auth-title">Email Verified!</h2>
            <p className="auth-subtitle">Your email has been verified successfully. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmail;