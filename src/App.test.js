import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the summarize button', () => {
  render(<App />);
  const button = screen.getByRole('button', { name: /summarize meeting/i });
  expect(button).toBeInTheDocument();
});
