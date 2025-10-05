// src/test/App.test.tsx
import { render, screen } from './utils';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });

  it('should be a verification test', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBeTruthy();
  });
});
