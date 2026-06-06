'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrgTree } from '@/components/org-chart/OrgTree';
import { api } from '@/lib/api';

export type OrgNodeType = {
  id: string;
  name: string;
  designation: string;
  department: string;
  photoUrl?: string;
  children: OrgNodeType[];
};
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ZoomIn, ZoomOut, Search, Maximize } from 'lucide-react';

const DEPT_COLORS: Record<string, string> = {
  'Engineering': 'bg-blue-100 text-blue-800',
  'Marketing': 'bg-pink-100 text-pink-800',
  'Finance': 'bg-green-100 text-green-800',
  'Operations': 'bg-orange-100 text-orange-800',
  'HR': 'bg-purple-100 text-purple-800',
  'Sales': 'bg-yellow-100 text-yellow-800',
  'Unknown': 'bg-muted text-card-foreground'
};

export default function OrgChartPage() {
  const [data, setData] = useState<OrgNodeType[]>([]);
  const [scale, setScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get('/employees?limit=1000')
      .then(res => {
        const emps = res.data?.items || [];
        const map = new Map<string, OrgNodeType>();
        
        emps.forEach((e: any) => {
          map.set(e.id, {
            id: e.id,
            name: `${e.first_name || e.firstName || ''} ${e.last_name || e.lastName || ''}`.trim(),
            designation: e.designation || 'Employee',
            department: e.department?.name || e.department || 'Unknown',
            photoUrl: e.photo_url || e.photoUrl,
            children: []
          });
        });
        
        const tree: OrgNodeType[] = [];
        emps.forEach((e: any) => {
          const node = map.get(e.id)!;
          const managerId = e.reporting_manager_id || e.reportingManagerId;
          if (managerId && map.has(managerId)) {
            map.get(managerId)!.children.push(node);
          } else {
            tree.push(node);
          }
        });

        if (tree.length > 0) {
          setData(tree);
          // Expand all by default initially
          const allIds = new Set<string>();
          const traverse = (node: OrgNodeType) => {
            allIds.add(node.id);
            node.children.forEach(traverse);
          };
          tree.forEach(traverse);
          setExpandedNodes(allIds);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!searchQuery && departmentFilter === 'ALL') {
      setHighlightedNodes(new Set());
      return;
    }

    const highlights = new Set<string>();
    const toExpand = new Set<string>();
    
    const query = searchQuery.toLowerCase();

    const searchTree = (node: OrgNodeType): boolean => {
      let isMatch = false;
      
      if (
        (query && (node.name.toLowerCase().includes(query) || node.designation.toLowerCase().includes(query))) ||
        (departmentFilter !== 'ALL' && node.department === departmentFilter)
      ) {
        if (query && departmentFilter !== 'ALL') {
           if ((node.name.toLowerCase().includes(query) || node.designation.toLowerCase().includes(query)) && node.department === departmentFilter) {
             isMatch = true;
           }
        } else {
           isMatch = true;
        }
      }

      let childMatch = false;
      node.children.forEach(child => {
        if (searchTree(child)) childMatch = true;
      });

      if (isMatch) {
        highlights.add(node.id);
      }

      if (isMatch || childMatch) {
        toExpand.add(node.id);
        return true;
      }

      return false;
    };

    data.forEach(root => searchTree(root));
    
    setHighlightedNodes(highlights);
    setExpandedNodes(prev => new Set([...prev, ...toExpand]));

  }, [searchQuery, departmentFilter, data]);

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organization Chart</h1>
          <p className="text-muted-foreground">View reporting structures and teams.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search employee..." 
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {Object.keys(DEPT_COLORS).filter(d => d !== 'Unknown').map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 bg-muted rounded-xl border overflow-hidden relative shadow-inner">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-card p-1 rounded-lg border shadow-sm">
          <Button variant="ghost" size="icon" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom}><Maximize className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
        </div>

        {/* Pan/Zoom Area */}
        <div className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-10 flex justify-center items-start">
          <div 
            className="transition-transform duration-200 origin-top"
            style={{ transform: `scale(${scale})` }}
          >
            {data.length > 0 ? (
              <OrgTree 
                data={data} 
                expandedNodes={expandedNodes} 
                highlightedNodes={highlightedNodes} 
                departmentColors={DEPT_COLORS}
                onExpandToggle={toggleExpand}
              />
            ) : (
              <div className="text-center text-muted-foreground py-20">Loading chart...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
