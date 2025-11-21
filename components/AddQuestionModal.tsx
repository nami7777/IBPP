
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Check, Sparkles, Layers, AlertCircle, Calendar } from 'lucide-react';
import { Question, PaperType, ExamMonth, QuestionPart, Difficulty } from '../types';
import ImagePasteUploader from './ImagePasteUploader';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: Question) => void;
  existingKeywords: string[];
  existingTopics: string[];
  initialQuestion?: Question | null;
  stickyMetadata?: Partial<Question> | null;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  existingKeywords,
  existingTopics,
  initialQuestion,
  stickyMetadata
}) => {
  const [step, setStep] = useState(1);
  const [animDir, setAnimDir] = useState<'left' | 'right'>('right');
  
  // Form State
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  
  const [year, setYear] = useState<number | 'Unknown'>(new Date().getFullYear());
  const [month, setMonth] = useState<ExamMonth>('May');
  const [questionNumber, setQuestionNumber] = useState('');
  const [paperType, setPaperType] = useState<PaperType>('Paper 1');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  // P1 State
  const [p1QuestionImage, setP1QuestionImage] = useState<string | null>(null);
  const [p1AnswerType, setP1AnswerType] = useState<'Selection' | 'Image'>('Selection');
  const [p1AnswerSelection, setP1AnswerSelection] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [p1AnswerImage, setP1AnswerImage] = useState<string | null>(null);

  // P2 State
  const [parts, setParts] = useState<QuestionPart[]>([
    { id: Date.now().toString(), label: 'a', questionImage: null, answerImage: null }
  ]);
  const [activePartIndex, setActivePartIndex] = useState(0);

  // Initialize or Reset
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setActivePartIndex(0);
      if (initialQuestion) {
        // Edit Mode - Load everything from the question
        setKeywords(initialQuestion.keywords);
        setTopics(initialQuestion.topics || []);
        setYear(initialQuestion.year);
        setMonth(initialQuestion.month);
        setQuestionNumber(initialQuestion.questionNumber);
        setPaperType(initialQuestion.paperType);
        setDifficulty(initialQuestion.difficulty || 'Medium');
        setP1QuestionImage(initialQuestion.p1QuestionImage || null);
        setP1AnswerType(initialQuestion.p1AnswerType || 'Selection');
        setP1AnswerSelection(initialQuestion.p1AnswerSelection || null);
        setP1AnswerImage(initialQuestion.p1AnswerImage || null);
        setParts(initialQuestion.parts || [{ id: Date.now().toString(), label: 'a', questionImage: null, answerImage: null }]);
      } else {
        // Create Mode
        if (stickyMetadata) {
          // Use sticky metadata if available
          setKeywords(stickyMetadata.keywords || []);
          setTopics(stickyMetadata.topics || []);
          setYear(stickyMetadata.year !== undefined ? stickyMetadata.year : new Date().getFullYear());
          setMonth(stickyMetadata.month || 'May');
          setPaperType(stickyMetadata.paperType || 'Paper 1');
          setDifficulty(stickyMetadata.difficulty || 'Medium');
        } else {
          // Default Reset
          setKeywords([]);
          setTopics([]);
          setYear(new Date().getFullYear());
          setMonth('May');
          setPaperType('Paper 1');
          setDifficulty('Medium');
        }
        
        // Reset specific fields always
        setKeywordInput('');
        setTopicInput('');
        setQuestionNumber('');
        setP1QuestionImage(null);
        setP1AnswerSelection(null);
        setP1AnswerImage(null);
        setParts([{ id: Date.now().toString(), label: 'a', questionImage: null, answerImage: null }]);
      }
    }
  }, [isOpen, initialQuestion, stickyMetadata]);

  if (!isOpen) return null;

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = keywordInput.trim();
      if (trimmed && !keywords.includes(trimmed)) {
        setKeywords([...keywords, trimmed]);
        setKeywordInput('');
      }
    }
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = topicInput.trim();
      if (trimmed && !topics.includes(trimmed)) {
        setTopics([...topics, trimmed]);
        setTopicInput('');
      }
    }
  };

  const removeKeyword = (k: string) => setKeywords(keywords.filter(kw => kw !== k));
  const removeTopic = (t: string) => setTopics(topics.filter(top => top !== t));

  const handleAddP2Part = () => {
    const nextLabelMap: Record<string, string> = { 'a': 'b', 'b': 'c', 'c': 'd', 'd': 'e', 'e': 'f' };
    const lastLabel = parts.length > 0 ? parts[parts.length - 1].label : '';
    const newLabel = nextLabelMap[lastLabel] || String.fromCharCode(lastLabel.charCodeAt(0) + 1);
    
    const newPart = { id: Date.now().toString(), label: newLabel, questionImage: null, answerImage: null };
    setParts([...parts, newPart]);
    setActivePartIndex(parts.length); // Switch to new part
  };

  const updatePart = (id: string, field: keyof QuestionPart, value: any) => {
    setParts(parts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (parts.length > 1) {
      const idxToRemove = parts.findIndex(p => p.id === id);
      const newParts = parts.filter(p => p.id !== id);
      setParts(newParts);
      if (activePartIndex >= newParts.length) {
        setActivePartIndex(newParts.length - 1);
      } else if (activePartIndex === idxToRemove) {
        // Keep index roughly same
      }
    }
  };

  const handleSubmit = () => {
    const newQuestion: Question = {
      id: initialQuestion?.id || Date.now().toString(),
      createdAt: initialQuestion?.createdAt || Date.now(),
      keywords,
      topics,
      difficulty,
      year,
      month,
      questionNumber,
      paperType,
      ...(paperType === 'Paper 1' ? {
        p1QuestionImage,
        p1AnswerType,
        p1AnswerSelection,
        p1AnswerImage
      } : {
        parts
      })
    };
    onSave(newQuestion);
    onClose();
  };

  const filteredKeywords = existingKeywords.filter(k => 
    k.toLowerCase().includes(keywordInput.toLowerCase()) && !keywords.includes(k)
  ).slice(0, 5);

  const filteredTopics = existingTopics.filter(t => 
    t.toLowerCase().includes(topicInput.toLowerCase()) && !topics.includes(t)
  ).slice(0, 5);

  const nextStep = () => { setAnimDir('right'); setStep(2); };
  const prevStep = () => { setAnimDir('left'); setStep(1); };

  const toggleYearUnknown = () => {
    if (year === 'Unknown') {
      setYear(new Date().getFullYear());
    } else {
      setYear('Unknown');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl shadow-cyan-500/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-800 relative">
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Sparkles className="text-cyan-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-none">{initialQuestion ? 'Edit Question' : 'Add to Library'}</h2>
              <p className="text-xs text-slate-500 font-medium">Step {step} of 2 • {paperType}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-slate-950/50">
          
          {/* STEP 1: METADATA */}
          {step === 1 && (
            <div className="p-6 md:p-8 space-y-8 animate-in slide-in-from-left-8 duration-300 fade-in">
              
              {/* Top Row: Year, Month, Type, Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Col */}
                <div className="space-y-6">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Paper Type</label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        {(['Paper 1', 'Paper 2/1-b'] as PaperType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => setPaperType(type)}
                            className={`py-2.5 text-sm font-bold rounded-lg transition-all ${
                              paperType === type 
                              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/50' 
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year</label>
                           <button 
                            onClick={toggleYearUnknown}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${year === 'Unknown' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                           >
                             {year === 'Unknown' ? 'Set Year' : 'Mark Unknown'}
                           </button>
                        </div>
                        {year === 'Unknown' ? (
                          <div className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-500 italic flex items-center gap-2">
                             <AlertCircle size={16} /> Unknown Year
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-white font-mono"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Month</label>
                        <select 
                          value={month}
                          onChange={(e) => setMonth(e.target.value as ExamMonth)}
                          className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-white appearance-none"
                        >
                          <option value="May">May</option>
                          <option value="November">November</option>
                          <option value="Unknown">Unknown</option>
                        </select>
                      </div>
                   </div>
                </div>

                {/* Right Col */}
                <div className="space-y-6">
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Difficulty</label>
                      <div className="flex gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                           <button
                            key={d}
                            onClick={() => setDifficulty(d)}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                              difficulty === d 
                              ? d === 'Easy' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
                              : d === 'Medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                              : 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                            }`}
                           >
                             {d}
                           </button>
                        ))}
                      </div>
                   </div>
                   
                   <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question Number (Optional)</label>
                     <input
                      type="text"
                      value={questionNumber}
                      onChange={(e) => setQuestionNumber(e.target.value)}
                      placeholder="e.g. 5, 2a, 3iv"
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none text-white font-mono"
                    />
                   </div>
                </div>
              </div>

              <hr className="border-slate-800/50" />

              {/* Topics */}
              <div className="relative z-20">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layers size={14} /> Syllabus Topics
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-700 rounded-xl bg-slate-900/50 min-h-[52px] focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all">
                  {topics.map(t => (
                    <span key={t} className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg animate-in zoom-in-95">
                      {t}
                      <button onClick={() => removeTopic(t)} className="hover:text-white"><X size={12}/></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 outline-none bg-transparent min-w-[120px] text-sm text-white placeholder-slate-600"
                    placeholder="e.g. D.1 (Press Tab)"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={handleTopicKeyDown}
                  />
                </div>
                {topicInput && filteredTopics.length > 0 && (
                   <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 shadow-xl rounded-b-xl mt-1 z-30 overflow-hidden">
                      {filteredTopics.map(t => (
                        <div key={t} className="px-4 py-2 hover:bg-purple-900/30 cursor-pointer text-sm text-slate-300 border-b border-slate-700/50 last:border-0" onClick={() => { setTopics([...topics, t]); setTopicInput(''); }}>{t}</div>
                      ))}
                   </div>
                )}
              </div>

              {/* Keywords */}
              <div className="relative z-10">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Keywords</label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-700 rounded-xl bg-slate-900/50 min-h-[52px] focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                  {keywords.map(k => (
                    <span key={k} className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg animate-in zoom-in-95">
                      {k}
                      <button onClick={() => removeKeyword(k)} className="hover:text-white"><X size={12}/></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 outline-none bg-transparent min-w-[120px] text-sm text-white placeholder-slate-600"
                    placeholder="e.g. Calculus (Press Tab)"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                  />
                </div>
                {keywordInput && filteredKeywords.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 shadow-xl rounded-b-xl mt-1 z-30 overflow-hidden">
                      {filteredKeywords.map(s => (
                        <div key={s} className="px-4 py-2 hover:bg-cyan-900/30 cursor-pointer text-sm text-slate-300 border-b border-slate-700/50 last:border-0" onClick={() => { setKeywords([...keywords, s]); setKeywordInput(''); }}>{s}</div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* STEP 2: CONTENT UPLOAD */}
          {step === 2 && (
             <div className={`p-6 md:p-8 h-full flex flex-col animate-in slide-in-from-${animDir === 'right' ? 'right' : 'left'}-8 duration-300 fade-in`}>
                
                {/* PAPER 1 VIEW */}
                {paperType === 'Paper 1' && (
                  <div className="space-y-8 max-w-3xl mx-auto w-full">
                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">1</span>
                        Question Image
                      </h3>
                      <ImagePasteUploader 
                        value={p1QuestionImage} 
                        onChange={setP1QuestionImage} 
                        label=""
                        autoFocus={true}
                      />
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
                      <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs">2</span>
                        Answer
                      </h3>
                      <div className="flex gap-4 mb-6 p-1 bg-slate-950 rounded-xl border border-slate-800 w-fit">
                        <button 
                          onClick={() => setP1AnswerType('Selection')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${p1AnswerType === 'Selection' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Multiple Choice
                        </button>
                        <button 
                          onClick={() => setP1AnswerType('Image')}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${p1AnswerType === 'Image' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Image Upload
                        </button>
                      </div>

                      {p1AnswerType === 'Selection' ? (
                        <div className="grid grid-cols-4 gap-4">
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <button
                              key={opt}
                              onClick={() => setP1AnswerSelection(opt)}
                              className={`h-24 rounded-xl border-2 flex items-center justify-center text-3xl font-black transition-all ${
                                p1AnswerSelection === opt 
                                ? 'border-green-500 bg-green-500/20 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.3)] scale-105' 
                                : 'border-slate-700 bg-slate-800/50 text-slate-600 hover:border-slate-500 hover:bg-slate-800 hover:text-slate-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <ImagePasteUploader 
                          value={p1AnswerImage} 
                          onChange={setP1AnswerImage} 
                          label="Markscheme"
                          height="h-40"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* PAPER 2 VIEW (TABBED) */}
                {paperType === 'Paper 2/1-b' && (
                  <div className="flex flex-col h-full">
                    {/* Tabs Navigation */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                       {parts.map((part, idx) => (
                         <div key={part.id} className="relative group flex-shrink-0">
                           <button
                            onClick={() => setActivePartIndex(idx)}
                            className={`
                              flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-xl font-bold text-sm transition-all border
                              ${activePartIndex === idx 
                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-[0_0_15px_rgba(8,145,178,0.4)]' 
                                : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                              }
                            `}
                           >
                             Part {part.label.toUpperCase()}
                             {parts.length > 1 && activePartIndex === idx && (
                               <span 
                                onClick={(e) => removePart(e, part.id)}
                                className="ml-1 p-1 hover:bg-red-500/20 hover:text-red-200 rounded text-cyan-200/70 transition-colors"
                               >
                                 <X size={12} />
                               </span>
                             )}
                           </button>
                           {activePartIndex === idx && (
                             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-600 rotate-45"></div>
                           )}
                         </div>
                       ))}
                       <button 
                        onClick={handleAddP2Part}
                        className="ml-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/50 hover:bg-slate-700 transition-all"
                        title="Add Part"
                       >
                         <Plus size={20} />
                       </button>
                    </div>

                    {/* Active Part Content */}
                    <div className="flex-1 relative bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                       {/* Part Header */}
                       <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <span className="text-2xl font-black text-cyan-500/20 select-none">Part {parts[activePartIndex].label.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-slate-500 uppercase font-bold">Label:</label>
                            <input 
                              value={parts[activePartIndex].label} 
                              onChange={(e) => updatePart(parts[activePartIndex].id, 'label', e.target.value)}
                              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white focus:border-cyan-500 outline-none"
                            />
                          </div>
                       </div>

                       {/* Part Inputs */}
                       <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
                          {/* We use a key on the wrapper to force React to remount components and trigger animations when switching tabs */}
                          <div key={parts[activePartIndex].id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Question</label>
                                <span className="text-[10px] text-slate-600 uppercase bg-slate-950 px-2 py-0.5 rounded">Click box then Ctrl+V</span>
                              </div>
                              <ImagePasteUploader 
                                value={parts[activePartIndex].questionImage} 
                                onChange={(val) => updatePart(parts[activePartIndex].id, 'questionImage', val)}
                                height="h-56"
                                autoFocus={true} // Focus the question box when switching tabs
                              />
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-green-400 uppercase tracking-wider">Answer</label>
                              </div>
                              <ImagePasteUploader 
                                value={parts[activePartIndex].answerImage} 
                                onChange={(val) => updatePart(parts[activePartIndex].id, 'answerImage', val)}
                                height="h-40"
                              />
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/95 backdrop-blur flex justify-between items-center z-20">
           {step === 2 ? (
             <button 
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-3 text-slate-400 hover:text-white font-bold transition-colors rounded-xl hover:bg-slate-800"
            >
              <ChevronLeft size={20} /> Back
            </button>
           ) : (
             <div></div> // Spacer
           )}

           {step === 1 ? (
             <button 
              onClick={nextStep}
              className="group flex items-center gap-3 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-900/30 transition-all transform hover:translate-x-1"
            >
              Next Step <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
           ) : (
            <button 
              onClick={handleSubmit}
              className="group flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105"
            >
              <Check size={20} /> {initialQuestion ? 'Update Question' : 'Save to Library'}
            </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default AddQuestionModal;
