import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import chatService from '../services/chatService';

const POLL_MS = 15000;

const FloatingButton = styled.button`
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 120;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  font-weight: 700;
  cursor: pointer;
  animation: chatPulse 3s ease-in-out infinite;

  @keyframes chatPulse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @media (max-width: 576px) { right: 0.75rem; bottom: 0.75rem; padding: 0.65rem 0.85rem; }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2rem;
  height: 1.2rem;
  margin-left: 0.35rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.danger};
  color: white;
  font-size: 0.7rem;
`;

const Panel = styled.section`
  position: fixed;
  right: 1.25rem;
  bottom: 5.25rem;
  z-index: 119;
  width: min(380px, calc(100vw - 1.5rem));
  height: min(560px, calc(100vh - 7rem));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  animation: chatOpen 0.22s ease-out;
  @keyframes chatOpen { from { opacity: 0; transform: translateY(0.75rem) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @media (max-width: 576px) { right: 0.75rem; bottom: 4.6rem; width: calc(100vw - 1.5rem); height: min(620px, calc(100vh - 6rem)); }
`;

const Header = styled.header`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.85rem 1rem; background: ${({ theme }) => theme.colors.primary}; color: white;
  h2 { margin: 0; font-size: 1rem; }
  button { border: 0; background: transparent; color: white; font-size: 1.2rem; cursor: pointer; }
`;
const Messages = styled.div`
  flex: 1; overflow-y: auto; padding: 0.85rem; background: #f7faf8;
`;
const Bubble = styled.div`
  max-width: 82%; margin: 0.45rem 0; padding: 0.55rem 0.7rem; border-radius: 0.75rem;
  background: ${({ $mine }) => ($mine ? '#dff2df' : '#fff')};
  margin-left: ${({ $mine }) => ($mine ? 'auto' : '0')};
  color: ${({ theme }) => theme.colors.textPrimary}; box-shadow: 0 1px 3px rgba(0,0,0,.06);
  .role { font-size: 0.68rem; font-weight: 700; color: ${({ theme }) => theme.colors.textSecondary}; }
  .time { display: block; margin-top: 0.25rem; font-size: 0.65rem; color: ${({ theme }) => theme.colors.textSecondary}; }
`;
const Composer = styled.form`
  display: flex; gap: 0.45rem; padding: 0.7rem; border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  input { flex: 1; min-width: 0; padding: 0.6rem 0.7rem; border: 1px solid ${({ theme }) => theme.colors.borderLight}; border-radius: 0.5rem; }
  button { border: 0; border-radius: 0.5rem; padding: 0 0.85rem; background: ${({ theme }) => theme.colors.primary}; color: white; font-weight: 700; }
`;
const Info = styled.div`
  margin: 0.45rem auto;
  padding: 0.75rem 0.8rem;
  max-width: 94%;
  border: 1px solid rgba(46, 125, 50, 0.16);
  border-radius: 0.75rem;
  background: linear-gradient(145deg, #f1faf1 0%, #ffffff 100%);
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.76rem;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.08);

  &.welcome-card {
    animation: welcomeEnter 0.35s ease-out both;
  }

  .welcome-title {
    display: block;
    margin-bottom: 0.28rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.86rem;
    font-weight: 800;
  }

  .welcome-copy {
    display: block;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .welcome-phone {
    display: block;
    margin-top: 0.42rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-weight: 800;
    text-decoration: none;
  }

  @keyframes welcomeEnter {
    from { opacity: 0; transform: translateY(0.35rem); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const formatDateSeparator = (value) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const today = new Date();
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((currentDay - targetDay) / 86400000);
  const shortDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  if (diffDays === 0) return `📅 Today, ${shortDate}`;
  if (diffDays === 1) return `📅 Yesterday, ${shortDate}`;
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  return `📅 ${weekday}, ${shortDate}`;
};

const getMessageRows = (messages = []) => messages.map((item, index, arr) => {
  const previous = arr[index - 1];
  const currentDate = new Date(item.createdAt);
  const previousDate = previous ? new Date(previous.createdAt) : null;
  const showDate = !previousDate || currentDate.toDateString() !== previousDate.toDateString();
  return { ...item, showDate, dateLabel: showDate ? formatDateSeparator(item.createdAt) : '' };
});

const DateSeparator = styled.div`
  margin: 0.7rem auto 0.4rem;
  padding: 0.2rem 0.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(46, 125, 50, 0.08);
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.01em;
`;

const SystemBubble = styled.div`
  max-width: 92%;
  margin: 0.7rem auto;
  padding: 0.75rem 0.8rem;
  border: 1px solid rgba(46, 125, 50, 0.18);
  border-radius: 0.8rem;
  background: linear-gradient(145deg, #f3faf3 0%, #ffffff 100%);
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: 0 2px 8px rgba(46, 125, 50, 0.08);

  .role { display: block; margin-bottom: 0.2rem; font-size: 0.68rem; font-weight: 700; color: ${({ theme }) => theme.colors.primaryDark}; }
  .time { display: block; margin-top: 0.3rem; font-size: 0.65rem; color: ${({ theme }) => theme.colors.textSecondary}; }
`;

class CustomerChatWidget extends React.Component {
  static contextType = AuthContext;
  state = { open: false, conversation: null, unreadCount: 0, loading: false, sending: false, draft: '' };
  messagesRef = React.createRef();

  componentDidMount() { this.loadConversation(); this.interval = window.setInterval(this.poll, POLL_MS); }
  componentWillUnmount() { window.clearInterval(this.interval); }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.open && (prevState.open !== this.state.open || prevState.conversation?.messages?.length !== this.state.conversation?.messages?.length)) {
      const node = this.messagesRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    }
  }

  poll = async () => {
    try {
      const response = await chatService.getCustomerConversation();
      const unreadCount = Number(response.unreadCount || 0);
      this.setState({ conversation: response.conversation, unreadCount });
      if (this.state.open && unreadCount > 0) await this.markRead();
    } catch { /* transient polling failures do not interrupt the chat */ }
  };

  loadConversation = async () => {
    this.setState({ loading: true });
    try {
      const response = await chatService.getCustomerConversation();
      this.setState({ conversation: response.conversation, unreadCount: Number(response.unreadCount || 0), loading: false });
    } catch { this.setState({ loading: false }); }
  };

  markRead = async () => {
    try { await chatService.markCustomerRead(); this.setState({ unreadCount: 0 }); } catch { /* retry on next poll */ }
  };

  toggle = async () => {
    const open = !this.state.open;
    this.setState({ open });
    if (open) { await this.loadConversation(); await this.markRead(); }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const message = this.state.draft.trim();
    if (!message || this.state.sending) return;
    this.setState({ sending: true });
    try {
      const response = await chatService.sendCustomerMessage(message);
      const nextMessages = [...(this.state.conversation?.messages || [])];
      if (response.message) nextMessages.push(response.message);
      if (response.autoOwnerMessage) nextMessages.push(response.autoOwnerMessage);
      this.setState({
        draft: '', sending: false,
        conversation: { ...(this.state.conversation || {}), messages: nextMessages },
      });
    } catch (error) {
      this.setState({ sending: false });
      toast.error(error?.message || 'Unable to send message. Please try again.');
    }
  };

  render() {
    const { role } = this.context;
    if (String(role || '').toLowerCase() !== 'customer') return null;
    const { open, conversation, unreadCount, loading, sending, draft } = this.state;
    const messages = conversation?.messages || [];
    return <>
      {open && <Panel aria-label="Chat with Owner">
        <Header><h2>💬 Chat with Owner</h2><button type="button" onClick={this.toggle} aria-label="Close chat">×</button></Header>
        <Messages ref={this.messagesRef}>
          {loading && <Info>Loading conversation...</Info>}
          {getMessageRows(messages).map((item) => <React.Fragment key={item.id}>
            {item.showDate && <DateSeparator>{item.dateLabel}</DateSeparator>}
            {item.senderRole === 'SYSTEM' ? <SystemBubble>
              <span className="role">Owner</span>
              <div>{item.message}</div>
              <span className="time">{formatTime(item.createdAt)}</span>
            </SystemBubble> : <Bubble $mine={item.senderRole === 'CUSTOMER'}><span className="role">{item.senderRole === 'CUSTOMER' ? 'You' : 'Owner'}</span><div>{item.message}</div><span className="time">{formatTime(item.createdAt)}</span></Bubble>}
          </React.Fragment>)}
        </Messages>
        <Composer onSubmit={this.handleSubmit}><input value={draft} maxLength="2000" onChange={(event) => this.setState({ draft: event.target.value })} placeholder="Type your message..." aria-label="Message" /><button type="submit" disabled={sending || !draft.trim()}>{sending ? '...' : '➤'}</button></Composer>
      </Panel>}
      <FloatingButton type="button" onClick={this.toggle} aria-expanded={open}>{open ? '× Close' : '💬 Chat with Owner'}{unreadCount > 0 && <Badge>{unreadCount}</Badge>}</FloatingButton>
    </>;
  }
}

export default CustomerChatWidget;
