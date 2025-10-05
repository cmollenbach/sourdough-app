import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

type Props = { onLoginSuccess: (token: string, provider: string) => void };

export const SocialLoginButtons: React.FC<Props> = ({ onLoginSuccess }) => {
  return (
    <div>
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
      <button disabled style={{ marginTop: 8 }}>Continue with Apple (Coming soon)</button>
    </div>
  );
};