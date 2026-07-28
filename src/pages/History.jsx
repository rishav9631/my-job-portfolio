import React from 'react';

const History = () => {
  // Placeholder data for the tracker
  const historyData = [
    { id: 1, company: 'Google', role: 'Software Engineer', date: '2026-03-10', status: 'Applied' },
    { id: 2, company: 'Microsoft', role: 'Frontend Developer', date: '2026-03-08', status: 'Interviewing' },
    { id: 3, company: 'Amazon', role: 'Full Stack Engineer', date: '2026-03-05', status: 'Rejected' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
        case 'Applied': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'Interviewing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case 'Offered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  }

  return (
    <div className="min-h-screen flex font-inter relative overflow-hidden bg-[#000814]">
      
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#111827] to-[#064e3b] opacity-90 z-0"></div>
      
      {/* Content Container */}
      <div className="w-full max-w-7xl mx-auto flex flex-col relative z-10 p-4 sm:p-6 lg:p-8 pt-24 min-h-screen">
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                Application <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-teal-400">History</span>
            </h1>
            <p className="text-gray-400 text-sm">
                Track all your sent outreach emails and cover letters in one place.
            </p>
        </div>

        {/* Table Container */}
        <div className="bg-[#111827]/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#1f2937]/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#1f2937]/50 border-b border-[#374151]">
                            <th className="p-4 text-sm font-semibold text-gray-300">Company</th>
                            <th className="p-4 text-sm font-semibold text-gray-300">Target Role</th>
                            <th className="p-4 text-sm font-semibold text-gray-300">Date Sent</th>
                            <th className="p-4 text-sm font-semibold text-gray-300">Status</th>
                            <th className="p-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.map((item) => (
                            <tr key={item.id} className="border-b border-[#1f2937] hover:bg-[#1f2937]/30 transition-colors">
                                <td className="p-4 text-sm font-medium text-white">{item.company}</td>
                                <td className="p-4 text-sm text-gray-400">{item.role}</td>
                                <td className="p-4 text-sm text-gray-400">{item.date}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-[#10b981] hover:text-teal-400 text-sm font-medium transition-colors">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {historyData.length === 0 && (
                     <div className="p-8 text-center text-gray-500">
                        No applications tracked yet. Start sending emails!
                     </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default History;
