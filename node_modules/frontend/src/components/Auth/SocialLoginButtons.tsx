import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';

type Props = { onLoginSuccess: (token: string, provider: string) => void };

export const SocialLoginButtons: React.FC<Props> = ({ onLoginSuccess }) => {
  const isNative = Capacitor.isNativePlatform();
  
  return (
    <div>
      {/* Only show Google Login on web, not on native mobile */}
      {!isNative && (
        <GoogleLogin
          onSuccess={credentialResponse => {
            if (credentialResponse.credential) {
              onLoginSuccess(credentialResponse.credential, 'google');
            }
          }}
          onError={() => {
            alert('Google login failed. Please try again.');
          }}
          useOneTap
        />
      )}
      {isNative && (
        <p className="text-sm text-gray-600 mb-4">
          Google Sign-In is available on the web version. Please use email/password login on mobile.
        </p>
      )}
      <button disabled style={{ marginTop: 8 }}>Continue with Apple (Coming soon)</button>
    </div>
  );
};