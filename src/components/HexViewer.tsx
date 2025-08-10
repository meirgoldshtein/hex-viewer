import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material';
import { useHexData } from '../hooks/UseHexData';
import { HexViewerTable } from './HexViewerTable';

const BYTES_PER_ROW = 16;
const ROW_HEIGHT = 20;

interface HexViewerProps {
  file: File | null;
}

export const HexViewer: React.FC<HexViewerProps> = ({ file }) => {
  const [offsetInput, setOffsetInput] = useState<string>('');
  const [offsetError, setOffsetError] = useState<string | null>(null);

  const { data, isLoading, progress, error, totalRows } = useHexData(file);

  const jumpToOffset = useCallback((offsetStr: string) => {
    if (!data) return;
    setOffsetError(null);

    let offset: number;
    if (offsetStr.startsWith('0x') || offsetStr.startsWith('0X')) {
      offset = parseInt(offsetStr.slice(2), 16);
    } else {
      offset = parseInt(offsetStr, 10);
    }

    if (isNaN(offset) || offset < 0 || offset >= data.length) {
      setOffsetError(`Invalid offset. Must be between 0 and ${data.length - 1}`);
      return;
    }

    const targetRow = Math.floor(offset / BYTES_PER_ROW);
    const tableElement = document.getElementById('hex-table-container');
    if (tableElement) {
      tableElement.scrollTo({ top: targetRow * ROW_HEIGHT, behavior: 'smooth' });
    }

    setOffsetInput('');
    setOffsetError(`Jumped to offset 0x${offset.toString(16).toUpperCase()}`);
    setTimeout(() => setOffsetError(null), 3000);
  }, [data]);

  const handleOffsetKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      jumpToOffset(offsetInput);
    }
  };

  if (!file) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No file selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a file to view its hexadecimal representation
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        {data && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Jump to offset"
              value={offsetInput}
              onChange={(e) => setOffsetInput(e.target.value)}
              onKeyPress={handleOffsetKeyPress}
              error={!!offsetError}
              helperText={offsetError}
              InputProps={{
                startAdornment: <InputAdornment position="start">0x</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => jumpToOffset(offsetInput)}
                      disabled={!offsetInput.trim()}
                    >
                      Jump
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">
            Loading file... {Math.round(progress * 100)}%
          </Typography>
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {data && (
        <HexViewerTable hexData={data} totalRows={totalRows} />
      )}
    </Box>
  );
};
