'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Loader2, Users, Building, Mail, Phone, MapPin } from 'lucide-react';
import Image from 'next/image';

type EmployeeData = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  location: string;
  photo_url?: string;
  department?: { name: string };
};

export default function MyTeamPage() {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employeeId;
  const [manager, setManager] = useState<EmployeeData | null>(null);
  const [peers, setPeers] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        if (!employeeId) return;
        const { data } = await api.get(`/employees/${employeeId}/team`);
        setManager(data.manager);
        setPeers(data.peers || []);
      } catch (err: any) {
        setError('Failed to load team data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const TeamCard = ({ emp, isManager = false }: { emp: EmployeeData; isManager?: boolean }) => (
    <div className={`p-6 rounded-2xl border bg-card shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all hover:shadow-md ${isManager ? 'border-indigo-200 bg-indigo-50/30' : 'border-border'}`}>
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full overflow-hidden border-4 border-white shadow-md bg-muted flex items-center justify-center">
        {emp.photo_url ? (
          <Image src={emp.photo_url} alt={emp.first_name} fill className="object-cover" />
        ) : (
          <span className="text-2xl font-bold text-indigo-400">
            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
          </span>
        )}
      </div>
      
      <div className="flex-1 text-center sm:text-left space-y-3">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-card-foreground font-headline">
              {emp.first_name} {emp.last_name}
            </h3>
            {isManager && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                Manager
              </span>
            )}
          </div>
          <p className="text-indigo-600 font-medium text-sm flex items-center justify-center sm:justify-start gap-1">
            <Building size={14} /> {emp.designation || 'Employee'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
          {emp.email && (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Mail size={14} className="text-slate-400" />
              <a href={`mailto:${emp.email}`} className="hover:text-indigo-600 truncate">{emp.email}</a>
            </div>
          )}
          {emp.phone && (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Phone size={14} className="text-slate-400" />
              <span>{emp.phone}</span>
            </div>
          )}
          {emp.location && (
            <div className="flex items-center justify-center sm:justify-start gap-2 col-span-1 sm:col-span-2">
              <MapPin size={14} className="text-slate-400" />
              <span>{emp.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-card-foreground">My Team</h1>
          <p className="text-muted-foreground text-sm md:text-base">Connect with your manager and peers.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      {manager && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-card-foreground font-headline border-b border-border pb-2">Reporting Manager</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TeamCard emp={manager} isManager={true} />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-card-foreground font-headline border-b border-border pb-2">Team Members</h2>
        {peers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {peers.map((peer) => (
              <TeamCard key={peer.id} emp={peer} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-muted border border-border rounded-2xl text-muted-foreground">
            You don't have any peers in your team currently.
          </div>
        )}
      </section>
    </div>
  );
}
