import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, ChevronDown, ChevronUp } from 'lucide-react';
import { OrgNodeType } from '@/app/(dashboard)/org-chart/page';
import { useRouter } from 'next/navigation';

interface OrgNodeProps {
  node: OrgNodeType;
  onExpandToggle: (id: string) => void;
  expandedNodes: Set<string>;
  highlightedNodes: Set<string>;
  departmentColors: Record<string, string>;
}

export function OrgNode({ node, onExpandToggle, expandedNodes, highlightedNodes, departmentColors }: OrgNodeProps) {
  const router = useRouter();
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = highlightedNodes.has(node.id);
  const deptColorClass = departmentColors[node.department] || 'bg-muted text-card-foreground';

  return (
    <div className="flex flex-col items-center relative">
      <div 
        className={`w-48 bg-card rounded-xl shadow-sm border-2 transition-all cursor-pointer hover:shadow-md 
          ${isHighlighted ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-border'} z-10 relative`}
        onClick={() => router.push(`/admin/employees/${node.id}`)}
      >
        <div className="p-4 flex flex-col items-center text-center">
          <Avatar className="h-10 w-10 mb-2 border border-border">
            <AvatarImage src={node.photoUrl || undefined} />
            <AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback>
          </Avatar>
          <p className="font-bold text-sm truncate w-full">{node.name}</p>
          <p className="text-xs text-muted-foreground truncate w-full mb-2">{node.designation}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium truncate max-w-[130px] ${deptColorClass}`}>
            {node.department}
          </span>
        </div>
        
        {hasChildren && (
          <button 
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full p-0.5 shadow-sm hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onExpandToggle(node.id);
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
}
