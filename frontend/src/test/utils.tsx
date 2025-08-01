// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Add any global providers here (Router, Theme, etc.)
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId="test-client-id">
      {children}
    </GoogleOAuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
