import React from 'react';
import { Settings, Shield, Bell, Lock, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-muted text-card-foreground rounded-xl">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-headline text-card-foreground">System Settings</h1>
          <p className="text-muted-foreground">Manage your enterprise HRMS configurations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Shield size={20} className="text-indigo-600" /> Security Policies
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <p className="font-semibold text-card-foreground">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                <div>
                  <p className="font-semibold text-card-foreground">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users</p>
                </div>
                <select className="bg-muted border border-border text-card-foreground text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option selected>1 hour</option>
                  <option>4 hours</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Globe size={20} className="text-indigo-600" /> Company Profile
            </h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Company Name</label>
                  <input type="text" defaultValue="HRMS Pro Inc." className="w-full bg-muted border border-border rounded-lg p-2.5 text-card-foreground focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-card-foreground mb-1">Support Email</label>
                  <input type="email" defaultValue="support@hrmspro.com" className="w-full bg-muted border border-border rounded-lg p-2.5 text-card-foreground focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 space-y-6">
           <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Bell size={20} className="text-indigo-600" /> Notifications
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" defaultChecked />
                <span className="text-sm text-card-foreground">Email Alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" defaultChecked />
                <span className="text-sm text-card-foreground">Push Notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                <span className="text-sm text-card-foreground">Weekly Digest</span>
              </label>
            </div>
          </div>


        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
          Save Changes
        </button>
      </div>
    </div>
  );
}
