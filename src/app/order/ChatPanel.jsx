import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCheck, Clock, MessageSquare, Send } from 'lucide-react';
import { getMessages, sendMessage } from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTimeBR } from '../../utils/format';
import './ChatPanel.css';

const POLL_MS = 10000;

export default function ChatPanel({ orderId, counterpart }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const shouldScroll = useRef(true);

  const load = useCallback(async () => {
    try {
      const json = await getMessages(orderId, 1);
      const list = json?.data?.messages || [];
      setMessages([...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    } catch {}
    finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!shouldScroll.current) return;
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, pendingList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    const tempId = `tmp-${Date.now()}`;
    setPendingList((list) => [...list, { tempId, content, failed: false }]);
    setDraft('');
    setSending(true);
    shouldScroll.current = true;
    try {
      const json = await sendMessage(orderId, content);
      if (json?.success) {
        setPendingList((list) => list.filter((m) => m.tempId !== tempId));
        await load();
        return;
      }
      throw new Error(json?.message);
    } catch {
      setPendingList((list) => list.map((m) => (m.tempId === tempId ? { ...m, failed: true } : m)));
    } finally {
      setSending(false);
    }
  };

  const retry = async (item) => {
    setPendingList((list) => list.map((m) => (m.tempId === item.tempId ? { ...m, failed: false } : m)));
    try {
      const json = await sendMessage(orderId, item.content);
      if (json?.success) {
        setPendingList((list) => list.filter((m) => m.tempId !== item.tempId));
        await load();
        return;
      }
      throw new Error();
    } catch {
      setPendingList((list) => list.map((m) => (m.tempId === item.tempId ? { ...m, failed: true } : m)));
    }
  };

  const isMine = (message) => String(message.sender_id) === String(user?.id);

  return (
    <div className="chat">
      <div
        className="chat-log"
        onScroll={(e) => {
          const el = e.currentTarget;
          shouldScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {loading ? (
          <div className="chat-loading">
            <div className="skel" style={{ height: 44, width: '62%' }} />
            <div className="skel" style={{ height: 44, width: '48%', marginLeft: 'auto' }} />
            <div className="skel" style={{ height: 44, width: '56%' }} />
          </div>
        ) : messages.length === 0 && pendingList.length === 0 ? (
          <div className="chat-empty">
            <span className="empty-ico">
              <MessageSquare size={22} />
            </span>
            <strong>Comece a conversa</strong>
            <p>
              Combine os detalhes do serviço com {counterpart?.name || 'a outra parte'}: horário, acesso ao local e o
              que for necessário.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`chat-msg ${isMine(message) ? 'chat-mine' : 'chat-theirs'}`}>
                <p>{message.content}</p>
                <span className="chat-time">
                  {formatDateTimeBR(message.created_at)}
                  {isMine(message) &&
                    (message.read_at ? <CheckCheck size={13} /> : <Check size={13} />)}
                </span>
              </div>
            ))}

            {pendingList.map((item) => (
              <div key={item.tempId} className="chat-msg chat-mine chat-pending">
                <p>{item.content}</p>
                <span className="chat-time">
                  {item.failed ? (
                    <button type="button" className="chat-retry" onClick={() => retry(item)}>
                      <AlertCircle size={13} />
                      Falhou — tentar de novo
                    </button>
                  ) : (
                    <>
                      Enviando
                      <Clock size={13} />
                    </>
                  )}
                </span>
              </div>
            ))}
          </>
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-form" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          placeholder="Escreva uma mensagem..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
        />
        <button type="submit" className="chat-send" disabled={!draft.trim() || sending} aria-label="Enviar">
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
