import React from 'react';
import { ThumbsUp, ThumbsDown, Globe, Tag } from 'lucide-react';
import { NewsItem, VoteType } from '../types';

interface NewsCardProps {
  item: NewsItem;
  currentVote: VoteType;
  onVote: (id: string, type: VoteType) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, currentVote, onVote }) => {
  return (
    <div className={`
      relative p-5 rounded-xl border transition-all duration-300 backdrop-blur-sm
      ${currentVote === 'like' 
        ? 'bg-brand-900/30 border-brand-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
        : currentVote === 'dislike'
          ? 'bg-red-900/10 border-red-500/30 opacity-75'
          : 'bg-dark-800/50 border-white/5 hover:border-white/10 hover:bg-dark-800'
      }
    `}>
      {/* Meta Header */}
      <div className="flex items-center justify-between mb-3 text-xs tracking-wider uppercase font-medium text-gray-400">
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3 text-brand-400" />
          <span className="text-brand-300">{item.source}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
          <Tag className="w-3 h-3" />
          <span>{item.category}</span>
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-100 mb-2 leading-tight">
        {item.title}
      </h3>
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        {item.summary}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onVote(item.id, 'dislike')}
          className={`
            flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${currentVote === 'dislike'
              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-red-400'
            }
          `}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>不感兴趣</span>
        </button>

        <button
          onClick={() => onVote(item.id, 'like')}
          className={`
            flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors
            ${currentVote === 'like'
              ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-brand-400'
            }
          `}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>感兴趣</span>
        </button>
      </div>
    </div>
  );
};

export default NewsCard;