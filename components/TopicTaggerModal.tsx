import React, { useState, useMemo, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Tag, Layers, Check, Zap } from 'lucide-react';
import { Question } from '../types';

interface TopicTaggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (updatedQuestions: Question[]) => void;
  allQuestions: Question[];
  existingTopics: string[];
  existingKeywords: string[];
}

const TopicTaggerModal: React.FC<TopicTaggerModalProps> = ({
  isOpen,
  onClose,
  onApply,
  allQuestions,
  existingTopics,
  existingKeywords
}) => {
  const [targetTopic, setTargetTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTargetTopic('');
      setKeywords([]);
      setKeywordInput('');
    }
  }, [isOpen]);

  // MOVED UP: Hooks must be called before any early return
  const affectedQuestions = useMemo(() => {
    if (!targetTopic || keywords.length === 0) return [];
    
    return allQuestions.filter(q => {
      const hasKeyword = q.keywords.some(k => keywords.includes(k));
      const missingTopic = !(q.topics || []).includes(targetTopic);
      return hasKeyword && missingTopic;
    });
  }, [allQuestions, targetTopic, keywords]);

  if (!isOpen) return null;

  const handleApply = () => {
    const updated = affectedQuestions.map(q => ({
      ...q,
      topics: [...(q.topics || []), targetTopic]
    }));
    onApply(updated);
  };

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

  const removeKeyword = (k: string) => setKeywords(keywords.filter(kw => kw !== k));

  const filteredKeywords = existingKeywords.filter(k => 
    k.toLowerCase().includes(keywordInput.toLowerCase()) && !keywords.includes(k)
  ).slice(0, 5);

  const filteredTopics = existingTopics.filter(t =>
    t.toLowerCase().includes(targetTopic.toLowerCase()) && t !== targetTopic
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-2xl shadow-2xl shadow-cyan-500/10 w-full max-w-2xl flex flex-col border border-slate-800 overflow-hidden relative">
         {/* Background Grid Effect */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Zap className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-none">Topic Auto-Tagger</h2>
              <p className="text-xs text-slate-500 font-medium">Apply syllabus topics based on keywords</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-slate-950/30">
          
          {/* Topic Selection */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers size={14} /> Target Syllabus Topic
             </label>
             <div className="relative">
               <input 
                type="text" 
                value={targetTopic}
                onChange={(e) => setTargetTopic(e.target.value)}
                placeholder="e.g. D.1 Gravity"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none text-white"
               />
               {targetTopic && filteredTopics.length > 0 && (
                 <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 shadow-xl rounded-b-xl mt-1 z-30 overflow-hidden">
                    {filteredTopics.map(t => (
                      <div key={t} className="px-4 py-2 hover:bg-purple-900/30 cursor-pointer text-sm text-slate-300 border-b border-slate-700/50 last:border-0" onClick={() => setTargetTopic(t)}>{t}</div>
                    ))}
                 </div>
               )}
             </div>
             <p className="text-[10px] text-slate-500 mt-1 ml-1">This topic will be added to matched questions.</p>
          </div>

          {/* Trigger Keywords */}
          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Tag size={14} /> If Question has ANY of these Keywords
             </label>
             <div className="relative">
                <div className="flex flex-wrap gap-2 p-3 border border-slate-700 rounded-xl bg-slate-900 min-h-[52px] focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                  {keywords.map(k => (
                    <span key={k} className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg animate-in zoom-in-95">
                      {k}
                      <button onClick={() => removeKeyword(k)} className="hover:text-white"><X size={12}/></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    className="flex-1 outline-none bg-transparent min-w-[120px] text-sm text-white placeholder-slate-600"
                    placeholder="Type keyword & hit Enter..."
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

          {/* Preview Box */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${affectedQuestions.length > 0 ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-slate-700 text-slate-500 border-slate-600'}`}>
                   <Sparkles size={18} />
                </div>
                <div>
                   <h4 className="font-bold text-white">
                     {affectedQuestions.length} Questions Found
                   </h4>
                   <p className="text-xs text-slate-400">
                     {affectedQuestions.length > 0 
                       ? 'Ready to be updated with the new topic.' 
                       : 'Add keywords and a topic to find matches.'}
                   </p>
                </div>
             </div>
             
             {affectedQuestions.length > 0 && (
               <ArrowRight className="text-slate-600 animate-pulse" />
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-medium text-sm transition-colors">
             Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={affectedQuestions.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all"
          >
             <Check size={16} /> Apply to {affectedQuestions.length} Questions
          </button>
        </div>

      </div>
    </div>
  );
};

export default TopicTaggerModal;