import React from 'react';
import { OrgNodeType } from '@/app/(dashboard)/org-chart/page';
import { OrgNode } from './OrgNode';

interface OrgTreeProps {
  data: OrgNodeType[];
  expandedNodes: Set<string>;
  highlightedNodes: Set<string>;
  departmentColors: Record<string, string>;
  onExpandToggle: (id: string) => void;
  isRoot?: boolean;
}

export function OrgTree({ data, expandedNodes, highlightedNodes, departmentColors, onExpandToggle, isRoot = true }: OrgTreeProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className={`flex justify-center ${isRoot ? '' : 'pt-8 relative'}`}>
      {data.map((node, index) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const isFirst = index === 0;
        const isLast = index === data.length - 1;
        const isOnlyChild = data.length === 1;

        return (
          <div key={node.id} className="flex flex-col items-center relative px-4">
            {!isRoot && !isOnlyChild && (
              <>
                <div className={`absolute top-0 h-8 border-l-2 border-slate-300 left-1/2 -translate-x-1/2`}></div>
                <div className={`absolute top-0 border-t-2 border-slate-300 
                  ${isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'left-0 right-0'}`} 
                ></div>
              </>
            )}
            
            {/* The line connecting to the parent */}
            {!isRoot && isOnlyChild && (
              <div className={`absolute top-0 h-8 border-l-2 border-slate-300 left-1/2 -translate-x-1/2`}></div>
            )}

            <OrgNode 
              node={node} 
              onExpandToggle={onExpandToggle} 
              expandedNodes={expandedNodes} 
              highlightedNodes={highlightedNodes} 
              departmentColors={departmentColors} 
            />

            {hasChildren && isExpanded && (
              <div className="relative">
                <div className="absolute top-0 h-8 border-l-2 border-slate-300 left-1/2 -translate-x-1/2"></div>
                <OrgTree 
                  data={node.children} 
                  expandedNodes={expandedNodes} 
                  highlightedNodes={highlightedNodes} 
                  departmentColors={departmentColors} 
                  onExpandToggle={onExpandToggle} 
                  isRoot={false} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
