import io from 'socket.io-client';
import { store } from '../store/store';
import { updateRealTimeData } from '../store/slices/deviceSlice';
import { updateRealTimeUsage } from '../store/slices/usageSlice';
import { addAlert } from '../store/slices/alertSlice';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(homeId) {
    if (this.socket && this.socket.connected) {
      if (homeId) this.socket.emit('join-home', homeId);
      return;
    }

    if (this.socket) {
      this.socket.connect();
      if (homeId) this.socket.emit('join-home', homeId);
      return;
    }

    this.socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      if (homeId) {
        this.socket.emit('join-home', homeId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('deviceUpdate', (data) => {
      store.dispatch(updateRealTimeData(data));
      store.dispatch(updateRealTimeUsage(data));
    });

    this.socket.on('newAlert', (alert) => {
      store.dispatch(addAlert(alert));

      const severity = alert.severity;
      const toastMethod = severity === 'critical' ? 'error' :
        severity === 'high' ? 'error' :
          severity === 'medium' ? 'custom' : 'success';

      if (toastMethod === 'custom') {
        toast(alert.title, {
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: '#ffffff',
          },
        });
      } else {
        toast[toastMethod](alert.title);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinHome(homeId) {
    if (this.socket && homeId) {
      this.socket.emit('join-home', homeId);
    }
  }
}

export default new SocketService();