import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  createTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const VISIBLE_ROWS = 100; // Only render visible rows
const BYTES_PER_ROW = 16;
const ROW_HEIGHT = 20;

// Styled components
const HexTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: '70vh',
  overflow: 'auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
}));

const HexTableCell = styled(TableCell)(({ theme }) => ({
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '4px 8px',
  borderRight: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderRight: 'none',
  },
}));

const OffsetCell = styled(HexTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
  fontWeight: 'bold',
  color: theme.palette.text.secondary,
}));

const HexCell = styled(HexTableCell)(({ theme }) => ({
  textAlign: 'center',
  cursor: 'pointer',
  borderRight: 'none',
  padding: '4px 2px',
  '&:hover': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  },
}));

const AsciiCell = styled(HexTableCell)(({ theme }) => ({
  textAlign: 'center',
  color: theme.palette.text.secondary,
  borderLeft: `1px solid ${theme.palette.divider}`,
}));

interface HexViewerTableProps {
  hexData: Uint8Array;
  totalRows: number;
}

export const HexViewerTable: React.FC<HexViewerTableProps> = ({ hexData, totalRows }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hoveredHexIndex, setHoveredHexIndex] = useState<number | null>(null);
  // Corrected the type from `HTMLDiv-element` to `HTMLDivElement`
  const tableRef = useRef<HTMLDivElement>(null);
  const { palette } = useMemo(() => createTheme(), []);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        setScrollPosition(tableRef.current.scrollTop);
      }
    };
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleScroll);
      return () => tableElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Calculate visible range based on scroll position
  const visibleRange = useMemo(() => {
    if (!hexData || !totalRows) return { start: 0, end: 0 };
    
    const startRow = Math.floor(scrollPosition / ROW_HEIGHT);
    const endRow = Math.min(startRow + VISIBLE_ROWS, totalRows);
    
    return { start: startRow, end: endRow };
  }, [scrollPosition, totalRows, hexData]);

  const formatOffset = useCallback((offset: number) => offset.toString(16).padStart(8, '0').toUpperCase(), []);
  const formatHex = useCallback((byte: number) => byte.toString(16).padStart(2, '0').toUpperCase(), []);
  const formatAscii = useCallback((byte: number) => {
    if (byte >= 0x20 && byte <= 0x7E) return { char: String.fromCharCode(byte), isReplacement: false };
    return { char: '.', isReplacement: true };
  }, []);

  // Generate visible rows for performance
  const visibleRowsData = useMemo(() => {
    const rows = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      const startOffset = i * BYTES_PER_ROW;
      const rowBytes = hexData.slice(startOffset, startOffset + BYTES_PER_ROW);
      
      rows.push({
        rowIndex: i,
        startOffset,
        rowBytes
      });
    }
    return rows;
  }, [hexData, visibleRange]);

  // Add spacer rows for proper scrolling
  const spacerRows = useMemo(() => {
    if (!hexData) return [];
    
    const beforeSpacer = visibleRange.start;
    const afterSpacer = totalRows - visibleRange.end;
    
    return [
      { type: 'before', height: beforeSpacer * ROW_HEIGHT },
      { type: 'after', height: afterSpacer * ROW_HEIGHT }
    ];
  }, [visibleRange, totalRows, hexData]);

  const handleHexHover = (byteIndex: number) => setHoveredHexIndex(byteIndex);
  const handleHexLeave = () => setHoveredHexIndex(null);

  return (
    <Paper elevation={1}>
      <HexTableContainer ref={tableRef} id="hex-table-container">
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <OffsetCell>Offset</OffsetCell>
              {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
                <HexCell key={i} align="center">
                  {i.toString(16).padStart(2, '0').toUpperCase()}
                </HexCell>
              ))}
              <AsciiCell>ASCII</AsciiCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {spacerRows[0]?.height > 0 && (
              <TableRow>
                <TableCell colSpan={BYTES_PER_ROW + 2} sx={{ height: spacerRows[0].height, padding: 0 }} />
              </TableRow>
            )}
            
            {visibleRowsData.map(({ rowIndex, startOffset, rowBytes }) => (
              <TableRow key={rowIndex} hover sx={{ height: `${ROW_HEIGHT}px` }}>
                <OffsetCell>{formatOffset(startOffset)}</OffsetCell>
                {Array.from({ length: BYTES_PER_ROW }, (_, colIndex) => {
                  const byte = rowBytes[colIndex];
                  const globalByteIndex = startOffset + colIndex;
                  const isHighlighted = hoveredHexIndex === globalByteIndex;
                  
                  return (
                    <HexCell 
                      key={colIndex}
                      onMouseEnter={() => handleHexHover(globalByteIndex)}
                      onMouseLeave={handleHexLeave}
                      sx={{
                        backgroundColor: isHighlighted ? palette.primary.main : 'transparent',
                        color: isHighlighted ? palette.primary.contrastText : 'inherit',
                      }}
                    >
                      {byte !== undefined ? formatHex(byte) : ''}
                    </HexCell>
                  );
                })}
                <AsciiCell>
                  {Array.from(rowBytes, (byte, colIndex) => {
                    const globalByteIndex = startOffset + colIndex;
                    const isHighlighted = hoveredHexIndex === globalByteIndex;
                    const ascii = formatAscii(byte);
                    
                    return (
                      <span
                        key={colIndex}
                        title={ascii.isReplacement ? 'Non-printable character' : undefined}
                        style={{
                          backgroundColor: isHighlighted ? palette.primary.main : 'transparent',
                          color: isHighlighted ? palette.primary.contrastText : 'inherit',
                          display: 'inline-block',
                          width: '12px',
                          height: `${ROW_HEIGHT}px`,
                          lineHeight: `${ROW_HEIGHT}px`,
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: ascii.isReplacement ? 'bold' : 'normal',
                          opacity: ascii.isReplacement ? 0.6 : 1,
                        }}
                      >
                        {ascii.char}
                      </span>
                    );
                  })}
                </AsciiCell>
              </TableRow>
            ))}
            
            {spacerRows[1]?.height > 0 && (
              <TableRow>
                <TableCell colSpan={BYTES_PER_ROW + 2} sx={{ height: spacerRows[1].height, padding: 0 }} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </HexTableContainer>
    </Paper>
  );
};
