import React, { useState, useRef, useCallback } from 'react';
import { useChatWebSocket } from '../context/ChatWebSocketContext';
import { useAuth } from '../context/AuthContext';
import { Box, TextField, IconButton, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, AttachFile, Image, Video, Audio, Description } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const MessageInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '24px',
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const FilePreview = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  margin: theme.spacing(1, 0),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const UploadProgress = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '4px',
  backgroundColor: theme.palette.grey[200],
  borderRadius: '2px',
  overflow: 'hidden',
  '& > div': {
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    transition: 'width 0.3s ease',
  },
}));

interface FileUpload {
  file: File;
  progress: number;
  error?: string;
}

export const ChatMessenger: React.FC = () => {
  const { sendMessage, isConnected } = useChatWebSocket();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = selectedFiles.map(file => ({
      file,
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileUpload = useCallback(async (fileUpload: FileUpload) => {
    try {
      const formData = new FormData();
      formData.append('file', fileUpload.file);

      const response = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setFiles(prev => prev.map(f => 
            f.file === fileUpload.file ? { ...f, progress } : f
          ));
        },
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data;
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.file === fileUpload.file ? { ...f, error: error.message } : f
      ));
      throw error;
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!message.trim() && files.length === 0) return;

    try {
      // Upload files first
      const uploadedFiles = await Promise.all(
        files.map(async (fileUpload) => {
          const data = await handleFileUpload(fileUpload);
          return {
            file_name: fileUpload.file.name,
            file_type: fileUpload.file.name.split('.').pop()?.toLowerCase() || '',
            file_size: fileUpload.file.size,
            url: data.url,
          };
        })
      );

      // Send message with uploaded files
      sendMessage({
        type: 'chat_message',
        message: {
          content: message,
          message_type: files.length > 0 ? 'mixed' : 'text',
          files: uploadedFiles,
        },
      });

      // Clear input and files
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [message, files, sendMessage, handleFileUpload]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image />;
    }
    if (['mp4', 'avi', 'mov', 'webm'].includes(extension || '')) {
      return <Video />;
    }
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) {
      return <Audio />;
    }
    return <Description />;
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* File Previews */}
      {files.map((fileUpload, index) => (
        <FilePreview key={index} elevation={1}>
          {getFileIcon(fileUpload.file)}
          <Typography variant="body2" noWrap>
            {fileUpload.file.name}
          </Typography>
          <UploadProgress>
            <Box sx={{ width: `${fileUpload.progress}%` }} />
          </UploadProgress>
          {fileUpload.error && (
            <Typography color="error" variant="caption">
              {fileUpload.error}
            </Typography>
          )}
        </FilePreview>
      ))}

      {/* Message Input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          multiple
        />
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={!isConnected}
        >
          <AttachFile />
        </IconButton>
        <MessageInput
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!isConnected}
        />
        <IconButton
          onClick={handleSend}
          disabled={!isConnected || (!message.trim() && files.length === 0)}
          color="primary"
        >
          {!isConnected ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>
    </Box>
  );
}; 