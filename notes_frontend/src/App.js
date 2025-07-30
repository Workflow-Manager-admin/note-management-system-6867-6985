import React, { useState, useMemo } from 'react';
import './App.css';

// THEME COLORS - also in App.css variables
const COLOR_PRIMARY = '#1976d2';
const COLOR_SECONDARY = '#424242';
const COLOR_ACCENT = '#ffeb3b';

// Dummy function for unique IDs (simple, for demo only)
const generateId = () => 'id-' + Date.now() + '-' + Math.floor(Math.random()*9999);

// PUBLIC_INTERFACE
function App() {
  // Notes store: { id, title, content, created, updated }
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derived
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  // Note actions
  // PUBLIC_INTERFACE
  function handleCreateNote() {
    const now = new Date();
    const note = {
      id: generateId(),
      title: 'Untitled Note',
      content: '',
      created: now.toISOString(),
      updated: now.toISOString(),
    };
    setNotes([note, ...notes]);
    setSelectedNoteId(note.id);
  }
  // PUBLIC_INTERFACE
  function handleUpdateNote(id, newFields) {
    setNotes(notes =>
      notes.map(n =>
        n.id === id ? { ...n, ...newFields, updated: new Date().toISOString() } : n
      )
    );
  }
  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    setNotes(notes => notes.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);
  }
  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedNoteId(id);
  }
  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearchQuery(e.target.value);
  }

  function handleSidebarToggle() {
    setSidebarOpen(v => !v);
  }

  return (
    <div className="notes-app-theme">
      <AppBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateNote={handleCreateNote}
        onSidebarToggle={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
      />
      <div className="main-layout">
        <Sidebar
          notes={filteredNotes}
          onSelect={handleSelectNote}
          onDelete={handleDeleteNote}
          selectedNoteId={selectedNoteId}
          open={sidebarOpen}
        />
        <main className="main-content">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onUpdate={(fields) => handleUpdateNote(selectedNote.id, fields)}
            />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function AppBar({ searchQuery, onSearchChange, onCreateNote, onSidebarToggle, sidebarOpen }) {
  return (
    <header className="app-bar">
      <button
        className="sidebar-toggle-btn"
        aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        onClick={onSidebarToggle}
        title={sidebarOpen ? "Hide navigation" : "Show navigation"}
      >
        <span className="menu-icon"></span>
      </button>
      <h1 className="app-title">Notes</h1>
      <input
        aria-label="Search notes"
        className="search-box"
        placeholder="Search notes…"
        type="search"
        value={searchQuery}
        onChange={onSearchChange}
      />
      <button className="create-btn" onClick={onCreateNote} aria-label="New Note">
        + New
      </button>
    </header>
  );
}

// PUBLIC_INTERFACE
function Sidebar({ notes, onSelect, onDelete, selectedNoteId, open }) {
  return (
    <nav className={`sidebar${open ? '' : ' closed'}`}>
      <div className="sidebar-header">My Notes</div>
      <ul className="note-list">
        {notes.length === 0 &&
          <li className="note-list-empty">No notes found.</li>
        }
        {notes.map(note => (
          <li
            className={note.id === selectedNoteId ? 'note-list-item selected' : 'note-list-item'}
            key={note.id}
            onClick={() => onSelect(note.id)}
          >
            <div className="note-title">{note.title || <em>Untitled</em>}</div>
            <button
              className="delete-btn"
              onClick={e => {
                e.stopPropagation();
                if (window.confirm("Delete this note?")) onDelete(note.id);
              }}
              aria-label="Delete note"
            >✕</button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onUpdate }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  // If user selects a different note, synchronize fields
  React.useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  // Save on blur or by explicit action (could auto-save, left for simplicity)
  function handleSave() {
    if (title !== note.title || content !== note.content) {
      onUpdate({ title, content });
    }
  }

  // Handle keyboard (Ctrl/Cmd+S to save)
  React.useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", handleKey, false);
    return () => window.removeEventListener("keydown", handleKey, false);
  });

  return (
    <section className="editor-container">
      <input
        className="note-title-input"
        aria-label="Note title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={handleSave}
        placeholder="Note title"
        maxLength={64}
      />
      <textarea
        className="note-content-input"
        aria-label="Note content"
        value={content}
        onChange={e => setContent(e.target.value)}
        onBlur={handleSave}
        placeholder="Write your note here…"
        rows={16}
      />
      <div className="editor-meta">
        <span>Created: {formatDate(note.created)}</span>
        {note.updated !== note.created && <span>&middot; Updated: {formatDate(note.updated)}</span>}
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">🗒️</div>
      <div>Select or create a note to get started.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  );
}

export default App;
