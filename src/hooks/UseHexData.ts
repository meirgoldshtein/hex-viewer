import React, { useState, useEffect, useCallback } from 'react';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const BYTES_PER_ROW = 16;

interface HexDataState {
  data: Uint8Array | null;
  fileSize: number;
  isLoading: boolean;
  progress: number;
  error: string | null;
  totalRows: number;
}

export const useHexData = (file: File | null) => {
  const [state, setState] = useState<HexDataState>({
    data: null,
    fileSize: 0,
    isLoading: false,
    progress: 0,
    error: null,
    totalRows: 0,
  });

  const loadFileInChunks = useCallback(async (fileToLoad: File) => {
    setState(s => ({ ...s, isLoading: true, error: null, progress: 0 }));

    const totalChunksCalc = Math.ceil(fileToLoad.size / CHUNK_SIZE);
    
    try {
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < totalChunksCalc; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileToLoad.size);
        const chunk = fileToLoad.slice(start, end);
        
        const chunkData = await new Promise<Uint8Array>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(chunk);
        });
        
        chunks.push(chunkData);
        setState(s => ({ ...s, progress: (i + 1) / totalChunksCalc }));
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to prevent UI freezing
      }
      
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedData = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }
      
      setState(s => ({
        ...s,
        data: combinedData,
        fileSize: fileToLoad.size,
        totalRows: Math.ceil(fileToLoad.size / BYTES_PER_ROW),
        isLoading: false,
        progress: 1,
      }));
    } catch (err) {
      setState(s => ({ ...s, error: err instanceof Error ? err.message : 'Failed to load file', isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (file) {
      if (file.size < 10 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          setState(s => ({
            ...s,
            data: uint8Array,
            fileSize: file.size,
            totalRows: Math.ceil(file.size / BYTES_PER_ROW),
            isLoading: false,
            progress: 1,
          }));
        };
        reader.readAsArrayBuffer(file);
        setState(s => ({ ...s, isLoading: true, error: null, progress: 0 }));
      } else {
        loadFileInChunks(file);
      }
    } else {
      setState({
        data: null,
        fileSize: 0,
        isLoading: false,
        progress: 0,
        error: null,
        totalRows: 0,
      });
    }
  }, [file, loadFileInChunks]);

  return state;
};
