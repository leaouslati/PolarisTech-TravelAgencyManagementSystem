import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function CustomerMessages() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [content, setContent]   = useState('');
  const [sending, setSending]   = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const currentUserId = Number(JSON.parse(localStorage.getItem('user') || '{}')?.user_id);

  useEffect(() => {
    api.get(`/bookings/${bookingId}/messages`)
      .then(res => setMessages(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = content.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await api.post(`/bookings/${bookingId}/messages`, { content: text });
      setMessages(prev => [...prev, res.data.data]);
      setContent('');
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-4
                      bg-white dark:bg-slate-800
                      border-b border-slate-200 dark:border-slate-700
                      shrink-0">
        <button
          onClick={() => navigate('/customer/bookings')}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100
                     dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700
                     transition-colors"
          aria-label="Go back"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Booking {bookingId}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Conversation with your agent</p>
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
              <svg className="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No messages yet.</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Send a message to start the conversation with your agent.
            </p>
          </div>
        )}

        {!loading && messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
                {msg.sender_name}
              </span>
              <div
                className={`max-w-[75%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl shadow-sm
                  ${isMe
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                  }`}
              >
                <p className="text-sm leading-relaxed wrap-break-word">{msg.content}</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 px-1">
                {formatTime(msg.sent_at)}
              </span>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800 px-4 sm:px-6 py-3">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Type a message… (Enter to send)"
            aria-label="Message input"
            className="flex-1 resize-none px-4 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl
                       placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-500
                       transition-colors duration-200 max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            aria-label="Send message"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl
                       transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 shrink-0"
          >
            {sending ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
