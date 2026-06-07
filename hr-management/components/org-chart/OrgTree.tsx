import React from 'react';
import { OrgNodeType } from '@/app/(dashboard)/org-chart/page';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface OrgTreeProps {
  data: OrgNodeType[];
  expandedNodes: Set<string>;
  highlightedNodes: Set<string>;
  departmentColors: Record<string, string>;
  onExpandToggle: (id: string) => void;
}

export function OrgTree({ data, expandedNodes, highlightedNodes, departmentColors, onExpandToggle }: OrgTreeProps) {
  return (
    <TransformWrapper initialScale={1} minScale={0.2} maxScale={3} centerOnInit>
      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ minWidth: "100%", minHeight: "100%", padding: "4rem", display: "flex", justifyContent: "center" }}>
        {data.map(root => (
           <OrgTreeNode 
             key={root.id} 
             node={root} 
             expandedNodes={expandedNodes}
             highlightedNodes={highlightedNodes}
             departmentColors={departmentColors}
             onExpandToggle={onExpandToggle}
           />
        ))}
      </TransformComponent>
    </TransformWrapper>
  );
}

function OrgTreeNode({ node, expandedNodes, highlightedNodes, departmentColors, onExpandToggle }: any) {
  const isExpanded = expandedNodes.has(node.id);
  const isHighlighted = highlightedNodes.has(node.id);
  
  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '?';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Parent node */}
      <div 
        onClick={() => onExpandToggle(node.id)}
        className={`bg-card border-2 rounded-xl p-3 shadow-sm hover:shadow-md transition cursor-pointer min-w-[160px] text-center relative z-10
          ${isHighlighted ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold overflow-hidden">
          {node.photoUrl ? <img src={node.photoUrl} alt={node.name} className="w-full h-full object-cover"/> : getInitials(node.name)}
        </div>
        <p className="font-semibold text-foreground text-sm">{node.name}</p>
        <p className="text-muted-foreground text-xs mt-0.5">{node.designation}</p>
        <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${departmentColors[node.department] || departmentColors['Unknown']}`}>
          {node.department}
        </span>
        
        {node.children && node.children.length > 0 && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-muted border border-border rounded-full flex items-center justify-center text-xs text-muted-foreground shadow-sm">
            {isExpanded ? '-' : '+'}
          </div>
        )}
      </div>
      
      {/* Connector line down */}
      {isExpanded && node.children?.length > 0 && (
        <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 z-0"/>
      )}
      
      {/* Children row */}
      {isExpanded && node.children?.length > 0 && (
        <div className="flex gap-8 relative pt-4">
          {/* Horizontal line connecting siblings */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-[50%] right-[50%] h-px bg-slate-300 dark:bg-slate-600 z-0" 
                 style={{ width: `calc(100% - ${100 / node.children.length}%)`, transform: 'translateX(-50%)' }} />
          )}
          
          {node.children.map((child: any) => (
            <div className="flex flex-col items-center relative z-10" key={child.id}>
              {/* Small vertical line from horizontal line to the child node */}
              <div className="absolute -top-4 w-px h-4 bg-slate-300 dark:bg-slate-600 z-0" />
              <OrgTreeNode 
                node={child}
                expandedNodes={expandedNodes}
                highlightedNodes={highlightedNodes}
                departmentColors={departmentColors}
                onExpandToggle={onExpandToggle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
