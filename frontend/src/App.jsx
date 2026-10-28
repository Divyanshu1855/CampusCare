import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, ArrowUpRight, CheckCircle2, ClipboardList, Plus, RefreshCw, Search, ShieldCheck, Trash2, Wrench } from 'lucide-react';

const CATEGORIES = ['Classroom', 'Computer Lab', 'Wi-Fi', 'Cleanliness', 'Library', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const emptyForm = { title: '', description: '', category: 'Computer Lab', studentName: '', studentId: '' };

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function prettyDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function App() {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/api/complaints');
      setComplaints(data);
      setNotice({ type: '', text: '' });
    } catch (error) {
      setNotice({ type: 'error', text: `${error.message}. Check that the backend and database are running.` });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const visible = useMemo(() => complaints.filter(item => {
    const matchesStatus = filter === 'All' || item.status === filter;
    const query = search.toLowerCase();
    const matchesSearch = [item.title, item.studentName, item.studentId, item.category]
      .some(value => String(value || '').toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [complaints, filter, search]);

  const stats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(item => item.status === 'Pending').length,
    progress: complaints.filter(item => item.status === 'In Progress').length,
    resolved: complaints.filter(item => item.status === 'Resolved').length
  }), [complaints]);

  function changeForm(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submitComplaint(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api('/api/complaints', { method: 'POST', body: JSON.stringify(form) });
      setForm(emptyForm);
      setNotice({ type: 'success', text: 'Complaint submitted successfully.' });
      await loadComplaints();
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally { setSaving(false); }
  }

  async function updateComplaint(id, changes) {
    try {
      await api(`/api/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
      setNotice({ type: 'success', text: 'Complaint updated.' });
      await loadComplaints();
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  async function deleteComplaint(id) {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await api(`/api/complaints/${id}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: 'Complaint deleted.' });
      await loadComplaints();
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><ShieldCheck size={23} /></div><div><strong>CampusCare</strong><span>COLLEGE HELPDESK</span></div></div>
        <div className="side-label">WORKSPACE</div>
        <div className="nav-item active"><ClipboardList size={18} /> Complaint overview</div>
        <div className="side-note"><div className="side-note-icon"><Wrench size={18}/></div><strong>Better campus, together.</strong><p>Report a problem. Help us make your campus better for everyone.</p></div>
        <div className="sidebar-footer"><span className="online-dot"/> API-powered dashboard</div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div><span className="eyebrow">STUDENT SERVICES / OVERVIEW</span><h1>Complaint dashboard</h1><p className="subheading">A better campus starts with listening.</p></div><button className="refresh-btn" onClick={loadComplaints} title="Refresh complaints"><RefreshCw size={16}/> Refresh</button></header>

        {notice.text && <div className={`notice ${notice.type}`} role="status"><AlertCircle size={17}/>{notice.text}<button onClick={() => setNotice({type:'',text:''})} aria-label="Dismiss">×</button></div>}

        <section className="stats-grid">
          <StatCard label="Total complaints" value={stats.total} icon={<ClipboardList/>} tone="blue" caption="All submissions"/>
          <StatCard label="Pending review" value={stats.pending} icon={<AlertCircle/>} tone="amber" caption="Awaiting action"/>
          <StatCard label="In progress" value={stats.progress} icon={<Activity/>} tone="violet" caption="Being addressed"/>
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2/>} tone="green" caption="Issues completed"/>
        </section>

        <div className="content-grid">
          <section className="panel form-panel">
            <div className="panel-heading"><div><span className="section-kicker">NEW REQUEST</span><h2>Submit a complaint</h2><p>Tell the campus team what needs attention.</p></div><div className="heading-icon"><Plus size={20}/></div></div>
            <form onSubmit={submitComplaint} className="complaint-form">
              <label>Complaint title<input name="title" value={form.title} onChange={changeForm} maxLength="120" placeholder="e.g. Wi-Fi not working in Block B" required /></label>
              <div className="form-row">
                <label>Student name<input name="studentName" value={form.studentName} onChange={changeForm} maxLength="100" placeholder="Your full name" required /></label>
                <label>Student ID<input name="studentId" value={form.studentId} onChange={changeForm} maxLength="50" placeholder="e.g. 25MCC0000" required /></label>
              </div>
              <label>Category<select name="category" value={form.category} onChange={changeForm}>{CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
              <label>Description<textarea name="description" value={form.description} onChange={changeForm} maxLength="2000" rows="4" placeholder="Describe the issue and where it happened..." required /></label>
              <button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit complaint'} <ArrowUpRight size={17}/></button>
            </form>
          </section>

          <section className="panel list-panel">
            <div className="panel-heading list-heading"><div><span className="section-kicker">CAMPUS SUPPORT</span><h2>Recent complaints</h2><p>Track issues and update their progress.</p></div><span className="count-pill">{visible.length} records</span></div>
            <div className="toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." aria-label="Search complaints"/></div><select value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            {loading ? <div className="empty-state"><RefreshCw className="spin" size={25}/><p>Loading complaints…</p></div> : visible.length === 0 ? <div className="empty-state"><ClipboardList size={30}/><strong>No complaints found</strong><p>Try another filter or submit a new complaint.</p></div> :
              <div className="complaint-list">{visible.map(item => <article className="complaint-card" key={item._id}>
                <div className="complaint-top"><span className={`category-tag ${item.category.toLowerCase().replaceAll(' ','-')}`}>{item.category}</span><span className="date">{prettyDate(item.createdAt)}</span></div>
                <h3>{item.title}</h3><p className="description">{item.description}</p>
                <div className="student-meta"><span className="avatar">{item.studentName.slice(0,1).toUpperCase()}</span><span><strong>{item.studentName}</strong><small>{item.studentId}</small></span><span className={`priority ${item.priority.toLowerCase()}`}>{item.priority} priority</span></div>
                <div className="card-actions"><label className="status-control"><span>Status</span><select value={item.status} onChange={e => updateComplaint(item._id,{status:e.target.value})} aria-label={`Status for ${item.title}`}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label><label className="status-control priority-control"><span>Priority</span><select value={item.priority} onChange={e => updateComplaint(item._id,{priority:e.target.value})} aria-label={`Priority for ${item.title}`}>{['Low','Medium','High'].map(s => <option key={s}>{s}</option>)}</select></label><button className="delete-btn" onClick={() => deleteComplaint(item._id)} aria-label={`Delete ${item.title}`} title="Delete complaint"><Trash2 size={16}/></button></div>
              </article>)}</div>
            }
          </section>
        </div>
        <footer className="footer"><span>© {new Date().getFullYear()} CampusCare</span><span><span className="online-dot"/> Built for a better campus</span></footer>
      </main>
    </div>
  );
}

function StatCard({label,value,icon,tone,caption}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-caption">{caption}</span></div>;
}

export default App;
