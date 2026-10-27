import React from 'react';
import { HelpCircle, Pin, Check, PinOff, Tag, Users } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuestionQueue() {
  const { questions, pinQuestion, unpinQuestion, markQuestionAnswered, pinnedQuestion } = useSocket();

  const activeQuestions = questions.filter(q => !q.isAnswered);
  const normalizeQuestion = (value) => value.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(word => word && !['what', 'is', 'are', 'the', 'a', 'an', 'do', 'you', 'your', 'can', 'could', 'please', 'hey'].includes(word))
    .sort()
    .join(' ');
  const groupedQuestions = [...activeQuestions.reduce((groups, question) => {
    const key = normalizeQuestion(question.question);
    const group = groups.get(key) || [];
    group.push(question);
    groups.set(key, group);
    return groups;
  }, new Map()).values()].map(items => ({
    ...items[0],
    groupItems: items,
    repeatCount: items.reduce((total, item) => total + (Number(item.repeatCount) || 1), 0),
    askers: [...new Set(items.flatMap(item => item.askers?.length ? item.askers : [item.user]).filter(Boolean))]
  }));

  return (
    <div className="flex flex-col h-full bg-twitch-card border border-twitch-border rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-twitch-border">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-twitch-accent" />
          <h2 className="font-semibold text-white">Viewer Questions</h2>
        </div>
        <span className="text-xs bg-twitch-bg text-twitch-accent font-semibold px-2 py-0.5 rounded border border-twitch-border">
          {groupedQuestions.length} topics / {activeQuestions.length} questions
        </span>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2.5">
        {activeQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-twitch-muted">
            <HelpCircle className="h-8 w-8 mb-2 opacity-30 text-twitch-accent" />
            <p className="text-sm">No unanswered questions right now</p>
            <p className="text-xs text-twitch-muted/70 mt-1">Questions detected in chat will automatically be queued here.</p>
          </div>
        ) : (
          <AnimatePresence>
            {groupedQuestions.map((q) => {
              const isPinned = pinnedQuestion?.id === q.id;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-lg p-3 border transition-all ${
                    isPinned
                      ? 'bg-twitch-purple/10 border-twitch-purple shadow-md shadow-twitch-purple/10'
                      : 'bg-twitch-bg border-twitch-border hover:border-twitch-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-xs text-white">@{q.user}</span>
                        {q.category && (
                          <span className="text-[10px] bg-twitch-hover px-1.5 py-0.2 text-twitch-muted rounded border border-twitch-border flex items-center gap-0.5">
                            <Tag className="h-2.5 w-2.5" />
                            {q.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-twitch-text font-medium leading-snug">{q.question}</p>
                      {q.repeatCount > 1 && <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex items-center gap-1 rounded-full bg-twitch-purple/15 px-2 py-1 text-[10px] font-semibold text-twitch-purple"><Users className="h-3 w-3" /> Asked {q.repeatCount} times</span><span className="text-[10px] text-twitch-muted">{q.askers.slice(0, 3).map(user => `@${user}`).join(', ')}{q.askers.length > 3 ? ` +${q.askers.length - 3}` : ''}</span></div>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Pin to OBS */}
                      <button
                        onClick={() => isPinned ? unpinQuestion() : pinQuestion(q)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isPinned
                            ? 'bg-twitch-purple text-white border-twitch-purple'
                            : 'border-twitch-border bg-twitch-hover text-twitch-muted hover:text-white hover:border-twitch-purple'
                        }`}
                        title={isPinned ? 'Unpin from OBS Overlay' : 'Pin to OBS Overlay'}
                      >
                        {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>

                      {/* Mark Answered */}
                      <button
                        onClick={() => q.groupItems.forEach(item => markQuestionAnswered(item.id))}
                        className="p-1.5 rounded-lg border border-twitch-border bg-twitch-hover text-twitch-muted hover:text-twitch-accent hover:border-twitch-accent transition-colors"
                        title="Mark as Answered"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

