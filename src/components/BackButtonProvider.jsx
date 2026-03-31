// src/components/BackButtonProvider.jsx
// Drop this inside <BrowserRouter> (but outside <Routes>) in App.jsx.
// It wires up the hardware back button globally and shows the exit prompt
// when the user is on a root/home page.
//
// Usage (already done for you in the updated App.jsx):
//   <BrowserRouter>
//     <BackButtonProvider>
//       <Layout />          ← your existing layout/routes wrapper
//     </BackButtonProvider>
//   </BrowserRouter>

import { useState, useCallback } from 'react';
import useBackButton from '../hooks/useBackButton';
import ExitPrompt from './ExitPrompt';

// Separate child so hook can access the router context
function BackButtonHandler({ onExitPrompt }) {
  useBackButton({ onExitPrompt });
  return null;
}

export default function BackButtonProvider({ children }) {
  const [promptKey, setPromptKey]   = useState(0);
  const [visible,   setVisible]     = useState(false);

  const handleExitPrompt = useCallback(() => {
    setPromptKey(k => k + 1);   // re-mount to restart animation + timer
    setVisible(true);
  }, []);

  return (
    <>
      <BackButtonHandler onExitPrompt={handleExitPrompt} />
      {children}
      <ExitPrompt
        key={promptKey}
        visible={visible}
        onDismiss={() => setVisible(false)}
      />
    </>
  );
}
