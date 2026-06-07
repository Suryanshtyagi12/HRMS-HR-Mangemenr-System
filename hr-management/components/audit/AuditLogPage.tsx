'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Download, Search, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

function getActionColor(action: string) {
  if (action.includes('CREATE') || action.includes('APPROVED')) return 'bg-green-100 text-green-800 border-green-200';
  if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (action.includes('DELETE') || action.includes('TERMINATED') || action.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
  if (action.includes('PAYROLL')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'bg-muted text-card-foreground border-border';
  return 'bg-gray-100 text-gray-800 border-gray-200';
}

function JsonDiff({ oldValues, newValues }: { oldValues: any, newValues: any }) {
  if (!oldValues && !newValues) return <span className="text-slate-400 italic">No details</span>;
  
  return (
    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
      <div>
        <p className="font-bold text-muted-foreground mb-1">Old Values:</p>
        <pre className="text-rose-600">{oldValues ? JSON.stringify(oldValues, null, 2) : 'null'}</pre>
      </div>
      <div>
        <p className="font-bold text-muted-foreground mb-1">New Values:</p>
        <pre className="text-emerald-600">{newValues ? JSON.stringify(newValues, null, 2) : 'null'}</pre>
      </div>
    </div>
  );
}

export function AuditLogView() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ actions: [], entities: [] });
  
  const [searchAction, setSearchAction] = useState('ALL');
  const [searchEntity, setSearchEntity] = useState('ALL');
  const [searchUserId, setSearchUserId] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [stats, setStats] = useState({ totalToday: 0, loginsToday: 0, dataChanges: 0 });

  const fetchLogs = async () => {
    const params = new URLSearchParams({ page: page.toString() });
    if (searchAction !== 'ALL') params.append('action', searchAction);
    if (searchEntity !== 'ALL') params.append('entity', searchEntity);
    if (searchUserId) params.append('userId', searchUserId);

    const res = await api.get(`/audit?${params.toString()}`);
    if (res.status === 200) {
      const data = res.data;
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.filters) setFilters(data.filters);
      
      // Calculate simple stats based on loaded page (for demo, ideally from backend)
      const today = new Date().toDateString();
      const todaysLogs = (data.logs || []).filter((l: any) => new Date(l.created_at).toDateString() === today);
      setStats({
        totalToday: todaysLogs.length,
        loginsToday: todaysLogs.filter((l: any) => l.action.includes('LOGIN')).length,
        dataChanges: todaysLogs.filter((l: any) => !l.action.includes('LOGIN') && !l.action.includes('LOGOUT')).length
      });
    }
  };

  useEffect(() => { fetchLogs(); }, [page, searchAction, searchEntity, searchUserId]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'IP Address'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const user = log.user?.employee ? `${log.user.employee.first_name} ${log.user.employee.last_name}` : log.user?.email || 'System';
      const row = [
        `"${new Date(log.created_at).toISOString()}"`,
        `"${user}"`,
        `"${log.user?.role || ''}"`,
        `"${log.action}"`,
        `"${log.entity}"`,
        `"${log.entity_id || ''}"`,
        `"${log.ip_address || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">Track and monitor all system activities.</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Export to CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Actions Today</p><p className="text-2xl font-bold">{stats.totalToday}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Logins Today</p><p className="text-2xl font-bold">{stats.loginsToday}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Data Changes Today</p><p className="text-2xl font-bold">{stats.dataChanges}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <CardTitle>Activity Feed</CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={searchAction} onValueChange={setSearchAction}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Action" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  {filters.actions.map((a: string) => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={searchEntity} onValueChange={setSearchEntity}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Entity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Entities</SelectItem>
                  {filters.entities.map((e: string) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="relative w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="User ID..." className="pl-9" value={searchUserId} onChange={e => setSearchUserId(e.target.value)} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted border-b text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Entity</th>
                  <th className="px-6 py-4 font-medium">IP Address</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                  {logs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No logs found</td></tr>
                ) : logs.map(log => {
                  const isExpanded = expandedRow === log.id;
                  const userName = log.user?.employee ? `${log.user.employee.first_name} ${log.user.employee.last_name}` : log.user?.email || 'System';
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : log.id)}>
                        <td className="px-6 py-4 whitespace-nowrap">{format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-card-foreground">{userName}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{log.user?.role?.replace('_', ' ')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getActionColor(log.action)}>{log.action.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{log.entity} <span className="text-xs text-slate-400">({log.entity_id ? log.entity_id.substring(0,8) : ''})</span></td>
                        <td className="px-6 py-4 text-muted-foreground">{log.ip_address || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-muted border-b">
                            <JsonDiff oldValues={log.old_values} newValues={log.new_values} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t flex justify-between items-center bg-muted">
            <span className="text-sm text-muted-foreground">Showing page {page} of {totalPages} ({total} total logs)</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
