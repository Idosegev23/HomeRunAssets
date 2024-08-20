import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const MessageContext = createContext();

const initialState = {
  queue: [],
  sending: false,
  progress: 0,
  totalMessages: 0,
};

function messageReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, ...action.payload] };
    case 'START_SENDING':
      return { ...state, sending: true };
    case 'STOP_SENDING':
      return { ...state, sending: false, progress: 0 };
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_TOTAL_MESSAGES':
      return { ...state, totalMessages: action.payload };
    case 'REMOVE_FROM_QUEUE':
      return { ...state, queue: state.queue.slice(1) };
    default:
      return state;
  }
}

export function MessageProvider({ children }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);

  useEffect(() => {
    if (state.sending && state.queue.length > 0) {
      const sendNextMessage = async () => {
        const message = state.queue[0];
        try {
          await sendMessage(message);
          dispatch({ type: 'UPDATE_PROGRESS', payload: (state.totalMessages - state.queue.length + 1) / state.totalMessages * 100 });
          dispatch({ type: 'REMOVE_FROM_QUEUE' });
        } catch (error) {
          console.error('נכשל בשליחת ההודעה:', error);
          dispatch({ type: 'STOP_SENDING' });
        }
      };
      sendNextMessage();
    } else if (state.sending && state.queue.length === 0) {
      dispatch({ type: 'STOP_SENDING' });
    }
  }, [state.sending, state.queue]);

  const sendMessage = async (message) => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error("כתובת ה-API לא מוגדרת. אנא בדוק את משתני הסביבה שלך.");
    }

    const response = await axios.post(`${apiBaseUrl}/api/sendMessage`, message, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status !== 200) {
      throw new Error(`שגיאה בשליחת ההודעה: ${response.statusText}`);
    }

    return response.data;
  };

  return (
    <MessageContext.Provider value={{ state, dispatch }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  return useContext(MessageContext);
}