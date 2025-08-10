import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
// Import the new combined HexViewer component
import { HexViewer } from './components/HexViewer';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  
  const theme = createTheme({
    palette: {
      mode,
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Hex Viewer
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              component="label"
              size="small"
            >
              Choose File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            >
              {mode === 'light' ? 'Dark Mode' : 'Light Mode'}
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary">
                File: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* The new simplified component is used here */}
        <HexViewer file={file} />
        
      </Container>
    </ThemeProvider>
  );
}
