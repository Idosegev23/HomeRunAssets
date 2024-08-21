import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
const MessageContext = createContext();

const initialState = {
  queue: [],
  sending: false,
  progress: 0,
  totalMessages: 0,
  dailyMessageCount: 0,
  failedMessages: [],
};

function messageReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, ...action.payload] };
    case 'REMOVE_FROM_QUEUE':
      return { ...state, queue: state.queue.filter((_, index) => index !== action.payload) };
    case 'UPDATE_MESSAGE':
      return { 
        ...state, 
        queue: state.queue.map((msg, index) => 
          index === action.payload.index ? { ...msg, ...action.payload.message } : msg
        ) 
      };
    case 'START_SENDING':
      return { ...state, sending: true };
    case 'STOP_SENDING':
      return { ...state, sending: false, progress: 0 };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_TOTAL_MESSAGES':
      return { ...state, totalMessages: action.payload };
    case 'INCREMENT_DAILY_COUNT':
      return { ...state, dailyMessageCount: state.dailyMessageCount + 1 };
    case 'ADD_FAILED_MESSAGE':
      return { ...state, failedMessages: [...state.failedMessages, action.payload] };
    case 'CLEAR_FAILED_MESSAGES':
      return { ...state, failedMessages: [] };
    case 'UPDATE_FAILED_MESSAGE':
      return {
        ...state,
        failedMessages: state.failedMessages.map((msg, index) =>
          index === action.payload.index ? { ...msg, ...action.payload.message } : msg
        )
      };
    case 'REMOVE_FAILED_MESSAGE':
      return { ...state, failedMessages: state.failedMessages.filter((_, index) => index !== action.payload) };
    case 'RESET_DAILY_COUNT':
      return { ...state, dailyMessageCount: 0 };
    default:
      return state;
  }
}

export function MessageProvider({ children }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  const sendMessage = async (message) => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error("API base URL is not defined. Please check your environment variables.");
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/sendMessage`, {
        phoneNumber: message.customer.Cell,
        text: message.message
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error(`Error sending message: ${response.statusText}`);
      }

      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (state.sending && state.queue.length > 0) {
      const sendNextMessage = async () => {
        const message = state.queue[0];
        try {
          await sendMessage(message);
          dispatch({ type: 'INCREMENT_DAILY_COUNT' });
          dispatch({ type: 'REMOVE_FROM_QUEUE', payload: 0 });
        } catch (error) {
          dispatch({ 
            type: 'ADD_FAILED_MESSAGE', 
            payload: { ...message, error: error.message } 
          });
          dispatch({ type: 'REMOVE_FROM_QUEUE', payload: 0 });
        } finally {
          dispatch({ 
            type: 'UPDATE_PROGRESS', 
            payload: ((state.totalMessages - state.queue.length + 1) / state.totalMessages) * 100 
          });
        }
      };
      sendNextMessage();
    } else if (state.sending && state.queue.length === 0) {
      dispatch({ type: 'STOP_SENDING' });
    }
  }, [state.sending, state.queue, state.totalMessages]);

  useEffect(() => {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // next day
      0, 0, 0 // at 00:00:00 hours
    );
    const msToMidnight = night.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      dispatch({ type: 'RESET_DAILY_COUNT' });
    }, msToMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <MessageContext.Provider value={{ state, dispatch }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  return useContext(MessageContext);
}
