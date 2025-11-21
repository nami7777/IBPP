import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, Download, Tag, Calendar, Hash, Layers, AlertCircle, Edit, Trash2, Check, X, Trash, Settings, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { Question, FilterState, PaperType, Difficulty } from './types';
import AddQuestionModal from './components/AddQuestionModal';
import StudyMode from './components/StudyMode';
import TopicTaggerModal from './components/TopicTaggerModal';
import { getAllQuestions, addQuestionToDB, deleteQuestionFromDB, clearAllQuestions, bulkUpdateQuestions } from './utils/db';

function App() {
  // -- State --
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTopicTaggerOpen, setIsTopicTaggerOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // Settings State
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [lastUsedMetadata, setLastUsedMetadata] = useState<Partial<Question> | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [includedKeywords, setIncludedKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [includedTopics, setIncludedTopics] = useState<string[]>([]);
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  
  const [selectedPaperType, setSelectedPaperType] = useState<PaperType | 'All'>('All');
  const [selectedYear, setSelectedYear] = useState<number | 'All' | 'Unknown'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');

  // Load from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllQuestions();
        // Sort by newest first
        setQuestions(data.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
        console.error("Failed to load questions from DB", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // -- Derived Data --
  const allKeywords = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => q.keywords.forEach(k => set.add(k)));
    return Array.from(set).sort();
  }, [questions]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => (q.topics || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [questions]);

  const availableYears = useMemo(() => {
    const set = new Set<number | 'Unknown'>();
    questions.forEach(q => set.add(q.year));
    // Sort: numbers desc, then 'Unknown'
    return Array.from(set).sort((a, b) => {
        if (a === 'Unknown') return 1;
        if (b === 'Unknown') return -1;
        return (b as number) - (a as number);
    });
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      // Search Text
      const matchesSearch = searchQuery === '' || 
                            q.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (q.topics || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            q.questionNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Dropdowns
      const matchesType = selectedPaperType === 'All' || q.paperType === selectedPaperType;
      const matchesYear = selectedYear === 'All' || q.year === selectedYear;
      const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;

      // Advanced inclusion/exclusion logic
      // AND logic for includes: Must contain ALL included tags
      const matchesIncludedKeywords = includedKeywords.length === 0 || includedKeywords.every(k => q.keywords.includes(k));
      const matchesIncludedTopics = includedTopics.length === 0 || includedTopics.every(t => (q.topics || []).includes(t));
      
      // NOT logic for excludes: Must contain NONE of excluded tags
      const matchesExcludedKeywords = excludedKeywords.length === 0 || !q.keywords.some(k => excludedKeywords.includes(k));
      const matchesExcludedTopics = excludedTopics.length === 0 || !(q.topics || []).some(t => excludedTopics.includes(t));

      return matchesSearch && matchesType && matchesYear && matchesDifficulty && 
             matchesIncludedKeywords && matchesIncludedTopics && 
             matchesExcludedKeywords && matchesExcludedTopics;
    });
  }, [questions, searchQuery, selectedPaperType, selectedYear, selectedDifficulty, includedKeywords, excludedKeywords, includedTopics, excludedTopics]);

  // -- Handlers --

  const handleSaveQuestion = async (question: Question) => {
    try {
      await addQuestionToDB(question);
      
      // Update sticky metadata if enabled
      if (keepMetadata) {
        setLastUsedMetadata({
          year: question.year,
          month: question.month,
          keywords: question.keywords,
          topics: question.topics,
          paperType: question.paperType,
          difficulty: question.difficulty
        });
      }

      // Reload local state for simplicity or optimistic update
      // Let's do optimistic update + sort
      setQuestions(prev => {
        const others = prev.filter(q => q.id !== question.id);
        return [question, ...others].sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (e) {
      console.error("Failed to save", e);
      alert("Failed to save question to database.");
    }
  };

  const handleAutoTag = async (updatedQuestions: Question[]) => {
    try {
      setIsLoading(true);
      await bulkUpdateQuestions(updatedQuestions);
      
      // Update state
      setQuestions(prev => {
        const updatedIds = new Set(updatedQuestions.map(q => q.id));
        return prev.map(q => updatedIds.has(q.id) ? updatedQuestions.find(uq => uq.id === q.id)! : q);
      });
      
      setIsTopicTaggerOpen(false);
    } catch (e) {
      console.error("Bulk update failed", e);
      alert("Failed to update questions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this question? This cannot be undone.")) {
      try {
        await deleteQuestionFromDB(id);
        setQuestions(prev => prev.filter(q => q.id !== id));
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };
  
  const handleClearLibrary = async () => {
    if (questions.length === 0) return;
    
    if (confirm("CRITICAL WARNING: Are you sure you want to delete your ENTIRE library?\n\nThis action is irreversible and will delete all questions, images, and metadata.")) {
      if (confirm("Please confirm one last time: Delete ALL data?")) {
        try {
          setIsLoading(true);
          await clearAllQuestions();
          setQuestions([]);
        } catch (e) {
          console.error("Failed to clear DB", e);
          alert("An error occurred while clearing the database.");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleEditQuestion = (q: Question, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingQuestion(q);
    setIsAddModalOpen(true);
  }

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredQuestions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ib_qbank_export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // -- Tri-state Filter Handlers --
  const toggleKeywordFilter = (k: string) => {
    if (includedKeywords.includes(k)) {
      // Move to Exclude
      setIncludedKeywords(prev => prev.filter(i => i !== k));
      setExcludedKeywords(prev => [...prev, k]);
    } else if (excludedKeywords.includes(k)) {
      // Move to Neutral
      setExcludedKeywords(prev => prev.filter(i => i !== k));
    } else {
      // Move to Include
      setIncludedKeywords(prev => [...prev, k]);
    }
  };

  const toggleTopicFilter = (t: string) => {
    if (includedTopics.includes(t)) {
      setIncludedTopics(prev => prev.filter(i => i !== t));
      setExcludedTopics(prev => [...prev, t]);
    } else if (excludedTopics.includes(t)) {
      setExcludedTopics(prev => prev.filter(i => i !== t));
    } else {
      setIncludedTopics(prev => [...prev, t]);
    }
  };

  const getTagState = (item: string, type: 'keyword' | 'topic') => {
    if (type === 'keyword') {
      if (includedKeywords.includes(item)) return 'include';
      if (excludedKeywords.includes(item)) return 'exclude';
    } else {
      if (includedTopics.includes(item)) return 'include';
      if (excludedTopics.includes(item)) return 'exclude';
    }
    return 'neutral';
  };

  // -- Render --

  if (isStudyMode) {
    return <StudyMode questions={filteredQuestions} onExit={() => setIsStudyMode(false)} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* Sidebar / Filters */}
      <aside className="w-full md:w-72 bg-slate-900/50 border-r border-slate-800 flex-shrink-0 flex flex-col h-full backdrop-blur-md">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20 text-lg">IB</div>
            <h1 className="font-bold text-xl text-white tracking-tight">Past Paper Extractor</h1>
          </div>
          <p className="text-slate-500 text-xs">engineered by Nami Manshaei</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-3 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Deep Search..." 
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 rounded-xl text-sm outline-none transition-all text-slate-100 placeholder-slate-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Main Filters */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Filter size={12} /> Core Filters
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <select 
                value={selectedPaperType} 
                onChange={(e) => setSelectedPaperType(e.target.value as any)}
                className="w-full p-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:border-cyan-500 outline-none"
              >
                <option value="All">All Papers</option>
                <option value="Paper 1">Paper 1</option>
                <option value="Paper 2/1-b">Paper 2 / 1-b</option>
              </select>

              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : e.target.value === 'Unknown' ? 'Unknown' : parseInt(e.target.value))}
                className="w-full p-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:border-cyan-500 outline-none"
              >
                <option value="All">All Years</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value as any)}
                className="w-full p-2.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:border-cyan-500 outline-none"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Topics Filter */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers size={12} /> Syllabus Topics
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsTopicTaggerOpen(true)} 
                  className="text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-slate-800" 
                  title="Auto-tag Topics based on Keywords"
                >
                   <Zap size={14} />
                </button>
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTopics.length === 0 && <p className="text-xs text-slate-600">No topics yet.</p>}
              {allTopics.map(t => {
                const state = getTagState(t, 'topic');
                return (
                  <button 
                    key={t}
                    onClick={() => toggleTopicFilter(t)}
                    className={`text-xs px-3 py-1 rounded-md transition-all border font-medium ${
                      state === 'include' ? 'bg-green-500/20 border-green-500 text-green-400' :
                      state === 'exclude' ? 'bg-red-500/20 border-red-500 text-red-400' :
                      'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keywords Filter */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Tag size={12} /> Keyword Tags
            </h3>
            <div className="flex flex-wrap gap-2">
               {allKeywords.length === 0 && <p className="text-xs text-slate-600">No keywords yet.</p>}
               {allKeywords.map(k => {
                 const state = getTagState(k, 'keyword');
                 return (
                  <button 
                    key={k}
                    onClick={() => toggleKeywordFilter(k)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-all border ${
                      state === 'include' ? 'bg-green-500/20 border-green-500 text-green-400' :
                      state === 'exclude' ? 'bg-red-500/20 border-red-500 text-red-400' :
                      'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {k}
                  </button>
                 );
               })}
            </div>
          </div>
        </div>

        <div className="p-6 mt-auto border-t border-slate-800 bg-slate-900 space-y-3">
           {/* Settings Toggle */}
           <div 
             onClick={() => setKeepMetadata(!keepMetadata)}
             className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors mb-4"
           >
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-slate-400" />
                <span className="text-sm font-bold text-slate-300">Keep Metadata</span>
              </div>
              {keepMetadata ? (
                <ToggleRight className="text-cyan-400" size={24} />
              ) : (
                <ToggleLeft className="text-slate-600" size={24} />
              )}
           </div>

           <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600"
           >
             <Download size={16} /> Export Database
           </button>
           
           <button 
            onClick={handleClearLibrary}
            disabled={questions.length === 0}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-red-400 bg-red-950/30 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-900/50 hover:border-red-500 shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-400 disabled:hover:border-red-900/50"
            title="Delete Entire Library"
           >
             <Trash size={16} /> Clear Library
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-slate-950 relative">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800 px-8 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Main Library</h2>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
              <span className="text-cyan-400">{filteredQuestions.length}</span> questions matching filters
              {(includedKeywords.length > 0 || excludedKeywords.length > 0) && <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">Complex Filter Active</span>}
            </p>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => setIsStudyMode(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-950 hover:border-cyan-400 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(8,145,178,0.1)] hover:shadow-[0_0_20px_rgba(8,145,178,0.3)]"
              disabled={filteredQuestions.length === 0}
            >
              <BookOpen size={18} /> Study Mode
            </button>
            <button 
              onClick={() => { setEditingQuestion(null); setIsAddModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-500 transition-all font-semibold shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)]"
            >
              <Plus size={18} /> Add Question
            </button>
          </div>
        </header>

        <div className="p-8 min-h-[calc(100vh-88px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
          ) : questions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-800">
                <BookOpen className="text-slate-600" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Library Empty</h3>
              <p className="text-slate-500 mb-8 max-w-md">Start building your advanced question bank by adding your first IB past paper question.</p>
              <button 
                onClick={() => { setEditingQuestion(null); setIsAddModalOpen(true); }}
                className="text-cyan-400 font-bold hover:text-cyan-300 hover:underline text-lg"
              >
                Create a Question
              </button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <AlertCircle className="text-slate-600 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white mb-2">No Matches</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredQuestions.map((q) => (
                <div 
                  key={q.id} 
                  className="group bg-slate-900 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col overflow-hidden cursor-pointer"
                  onClick={(e) => handleEditQuestion(q, e)}
                >
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                            q.paperType === 'Paper 1' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {q.paperType === 'Paper 1' ? 'P1' : 'P2'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                             q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                             q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                             'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {q.difficulty}
                          </span>
                       </div>
                       <div className="text-xs font-bold text-slate-500">
                         {q.year === 'Unknown' ? 'UNK' : q.year} {q.month.substring(0,3).toUpperCase()}
                       </div>
                    </div>

                    {/* Preview Image Area */}
                    <div className="relative w-full aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                       {q.paperType === 'Paper 1' && q.p1QuestionImage ? (
                         <img src={q.p1QuestionImage} alt="Question" className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                       ) : q.paperType === 'Paper 2/1-b' && q.parts?.[0]?.questionImage ? (
                         <img src={q.parts[0].questionImage} alt="Question" className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                       ) : (
                         <div className="flex flex-col items-center gap-2 text-slate-700">
                           <BookOpen size={24} />
                           <span className="text-[10px] font-bold uppercase">No Preview</span>
                         </div>
                       )}
                       
                       {/* Overlay Actions */}
                       <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                          <button 
                            onClick={(e) => handleEditQuestion(q, e)}
                            className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-cyan-600 transition-colors shadow-lg"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteQuestion(q.id, e)}
                            className="p-1.5 bg-slate-800 text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-lg"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>

                    {/* Metadata Tags */}
                    <div className="space-y-2">
                       {/* Topics */}
                       {q.topics && q.topics.length > 0 && (
                         <div className="flex flex-wrap gap-1">
                           {q.topics.slice(0, 2).map(t => (
                             <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                               {t}
                             </span>
                           ))}
                           {q.topics.length > 2 && <span className="text-[9px] text-slate-600 px-1">+ {q.topics.length - 2}</span>}
                         </div>
                       )}
                       
                       {/* Keywords */}
                       <div className="flex flex-wrap gap-1">
                          {q.keywords.slice(0, 3).map(k => (
                             <span key={k} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-900/20 text-cyan-600 border border-cyan-900/30">
                               #{k}
                             </span>
                          ))}
                          {q.keywords.length > 3 && <span className="text-[9px] text-slate-600 px-1">+ {q.keywords.length - 3}</span>}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AddQuestionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSave={handleSaveQuestion}
        existingKeywords={allKeywords}
        existingTopics={allTopics}
        initialQuestion={editingQuestion}
        stickyMetadata={keepMetadata ? lastUsedMetadata : null}
      />

      <TopicTaggerModal
        isOpen={isTopicTaggerOpen}
        onClose={() => setIsTopicTaggerOpen(false)}
        onApply={handleAutoTag}
        allQuestions={questions}
        existingTopics={allTopics}
        existingKeywords={allKeywords}
      />
    </div>
  );
}

export default App;