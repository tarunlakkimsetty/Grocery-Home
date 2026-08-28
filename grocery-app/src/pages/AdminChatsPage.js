import React from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import chatService from '../services/chatService';

const Shell = styled.div`display:flex; flex-direction:column; gap:1rem;`;
const Toolbar = styled.div`display:flex; justify-content:space-between; align-items:center; gap:0.75rem; flex-wrap:wrap; h1{margin:0; font-size:1.5rem;} input{padding:.6rem .75rem; border:1px solid #dee2e6; border-radius:6px; min-width:220px;}`;
const Layout = styled.div`display:grid; grid-template-columns: minmax(220px, 0.75fr) minmax(0, 1.5fr); min-height:560px; background:white; border:1px solid #e9ecef; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,.08); @media(max-width:768px){grid-template-columns:1fr;}`;
const List = styled.div`border-right:1px solid #e9ecef; overflow:auto; @media(max-width:768px){max-height:240px; border-right:0; border-bottom:1px solid #e9ecef;}`;
const Row = styled.button`width:100%; display:block; text-align:left; border:0; border-bottom:1px solid #f0f2f5; background:${({$active}) => ($active ? '#edf7ed' : 'white')}; padding:.8rem; cursor:pointer; .top{display:flex; justify-content:space-between; font-weight:700;} .preview{display:block; color:#6c757d; font-size:.78rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:.3rem;} .time{font-size:.68rem; color:#6c757d;}`;
const Badge = styled.span`background:#e53935;color:#fff;border-radius:999px;padding:.1rem .4rem;font-size:.7rem;`;
const Conversation = styled.div`display:flex; flex-direction:column; min-width:0;`;
const Header = styled.div`padding:1rem; border-bottom:1px solid #e9ecef; h2{margin:0;font-size:1rem;} p{margin:.25rem 0 0;color:#6c757d;font-size:.8rem;}`;
const Messages = styled.div`flex:1; min-height:0; overflow:auto; padding:1rem; background:#f7faf8;`;
const Bubble = styled.div`max-width:75%; margin:.45rem 0; margin-left:${({$mine}) => ($mine ? 'auto' : '0')}; padding:.55rem .7rem; border-radius:.75rem; background:${({$mine}) => ($mine ? '#dff2df' : '#fff')}; box-shadow:0 1px 3px rgba(0,0,0,.06); .role{font-size:.68rem;font-weight:700;color:#6c757d;}.time{display:block;font-size:.65rem;color:#6c757d;margin-top:.25rem;}`;
const Composer = styled.form`display:flex;gap:.5rem;padding:.75rem;border-top:1px solid #e9ecef;input{flex:1;min-width:0;padding:.65rem;border:1px solid #dee2e6;border-radius:6px;}button{border:0;border-radius:6px;background:#2e7d32;color:#fff;padding:0 1rem;font-weight:700;}`;
const formatTime = (value) => value ? new Date(value).toLocaleString([], { dateStyle:'short', timeStyle:'short' }) : '';
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
const DateSeparator = styled.div`margin:0.7rem auto 0.4rem; display:inline-flex; align-items:center; justify-content:center; padding:.2rem .7rem; border-radius:999px; background:rgba(46,125,50,0.08); color:#6c757d; font-size:.68rem; font-weight:700;`;
const SystemBubble = styled.div`max-width:75%; margin:.7rem auto; padding:.55rem .7rem; border-radius:.75rem; background:linear-gradient(145deg,#f3faf3,#fff); border:1px solid rgba(46,125,50,0.16); box-shadow:0 1px 3px rgba(0,0,0,.06); .role{font-size:.68rem;font-weight:700;color:#2e7d32;}.time{display:block;font-size:.65rem;color:#6c757d;margin-top:.25rem;}`;

class AdminChatsPage extends React.Component {
  state = { conversations: [], selectedCustomerId: null, conversation: null, search: '', draft: '', loading: true, sending: false };
  messagesRef = React.createRef();
  componentDidMount() { this.loadList(); this.interval = window.setInterval(this.loadList, 15000); }
  componentWillUnmount() { window.clearInterval(this.interval); }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.conversation?.messages?.length !== this.state.conversation?.messages?.length) {
      const node = this.messagesRef.current;
      if (node) node.scrollTop = node.scrollHeight;
    }
  }
  loadList = async () => {
    try {
      const response = await chatService.getAdminChats(this.state.search);
      const conversations = response.conversations || [];
      this.setState({ conversations, loading: false });
      const queryCustomerId = Number(new URLSearchParams(window.location.search).get('customerId'));
      const selected = this.state.selectedCustomerId || (queryCustomerId > 0 ? queryCustomerId : null) || conversations.find((item) => Number(item.unread_for_admin) > 0)?.customer_id || conversations[0]?.customer_id;
      if (selected && !this.state.selectedCustomerId) this.selectCustomer(selected);
    } catch { this.setState({ loading: false }); }
  };
  selectCustomer = async (customerId) => {
    this.setState({ selectedCustomerId: customerId, conversation: null });
    try { const response = await chatService.getAdminChat(customerId); this.setState({ conversation: response.conversation }); await chatService.markAdminRead(customerId); this.loadList(); }
    catch (error) { toast.error(error?.message || 'Unable to load conversation.'); }
  };
  handleSearch = (event) => { this.setState({ search: event.target.value }, this.loadList); };
  submit = async (event) => {
    event.preventDefault(); const message = this.state.draft.trim(); const customerId = this.state.selectedCustomerId;
    if (!message || !customerId || this.state.sending) return;
    this.setState({ sending: true });
    try { const response = await chatService.sendAdminMessage(customerId, message); this.setState((prev) => ({ draft:'', sending:false, conversation:{...prev.conversation, messages:[...(prev.conversation?.messages || []), response.message]} })); this.loadList(); }
    catch (error) { this.setState({ sending:false }); toast.error(error?.message || 'Unable to send message. Please try again.'); }
  };
  render() {
    const { conversations, selectedCustomerId, conversation, draft, loading, sending } = this.state;
    return <Shell><Toolbar><h1>💬 Customer Chats</h1><input value={this.state.search} onChange={this.handleSearch} placeholder="Search customers or phone" aria-label="Search customers" /></Toolbar><Layout><List>{loading && <p style={{padding:'1rem'}}>Loading chats...</p>}{conversations.map((item) => <Row type="button" key={item.customer_id} $active={Number(selectedCustomerId) === Number(item.customer_id)} onClick={() => this.selectCustomer(item.customer_id)}><span className="top"><span>{item.customer_name}</span>{Number(item.unread_for_admin) > 0 && <Badge>{item.unread_for_admin}</Badge>}</span><span className="preview">{item.last_message || 'No messages yet'}</span><span className="time">{formatTime(item.last_message_at)}</span></Row>)}</List><Conversation>{conversation ? <><Header><h2>{conversation.customer_name}</h2><p>{conversation.customer_phone}</p></Header><Messages ref={this.messagesRef}>{getMessageRows(conversation.messages || []).map((item) => <React.Fragment key={item.id}>{item.showDate && <DateSeparator>{item.dateLabel}</DateSeparator>}{item.senderRole === 'SYSTEM' ? <SystemBubble><span className="role">Owner</span><div>{item.message}</div><span className="time">{formatTime(item.createdAt)}</span></SystemBubble> : <Bubble $mine={item.senderRole === 'ADMIN'}><span className="role">{item.senderRole === 'ADMIN' ? 'Owner' : conversation.customer_name}</span><div>{item.message}</div><span className="time">{formatTime(item.createdAt)}</span></Bubble>}</React.Fragment>)}</Messages><Composer onSubmit={this.submit}><input value={draft} maxLength="2000" onChange={(event) => this.setState({draft:event.target.value})} placeholder="Type a reply..." aria-label="Admin reply" /><button type="submit" disabled={sending || !draft.trim()}>{sending ? '...' : 'Send'}</button></Composer></> : <Messages><p>Select a customer to view the conversation.</p></Messages>}</Conversation></Layout></Shell>;
  }
}
export default AdminChatsPage;
