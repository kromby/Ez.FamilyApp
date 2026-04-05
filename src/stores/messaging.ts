import { create } from 'zustand';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface MessagingState {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
