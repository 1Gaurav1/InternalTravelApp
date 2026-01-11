
import React from 'react';
import { ViewState, TravelRequest } from '../types';
import { Plus, CheckCircle, Clock, XCircle, MoreHorizontal, FileText, ArrowRight } from 'lucide-react';

interface EmployeeDashboardProps {
  onNavigate: (view: ViewState) => void;
  requests: TravelRequest[];
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate, requests }) => {
  // Filter Logic: In a real app, you'd filter by logged-in user ID
  // For this demo, we assume "Alex Morgan" is the logged in employee
  const myRequests = requests; 

  const stats = [
    { label: 'Total Requests', value: myRequests.length.toString(), trend: '+5% this month', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Approved', value: myRequests.filter(r => r.status.includes('Agent') || r.status === 'Booked').length.toString(), trend: '+12% this month', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pending', value: myRequests.filter(r => r.status.includes('Pending')).length.toString(), trend: 'Awaiting approval', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Rejected', value: myRequests.filter(r => r.status === 'Rejected').length.toString(), trend: 'Check comments', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Alex 👋</h1>
          <p className="text-gray-500 mt-1">You have {stats[2].value} pending travel requests requiring your attention.</p>
        </div>
        <button 
          onClick={() => onNavigate(ViewState.CREATE_REQUEST)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/30"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                {stat.trend.includes('+') ? <span className="text-green-500">↗</span> : ''} {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">Recent Travel Requests</h3>
          <button onClick={() => onNavigate(ViewState.MY_REQUESTS)} className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
            View All <ArrowRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Time Frame</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.id}</td>
                  <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{req.destination}</p>
                        <p className="text-xs">{req.startDate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{req.startTime || 'Any'} - {req.endTime || 'Any'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      ${req.status.includes('Agent') || req.status === 'Booked' ? 'bg-green-100 text-green-700' : 
                        req.status.includes('Pending') ? 'bg-yellow-100 text-yellow-700' : 
                        req.status.includes('Processing') ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
