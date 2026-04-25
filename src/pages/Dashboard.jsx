import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Send, MailOpen, MousePointer2, Target, Globe, Activity, 
    ChevronRight, Rocket, MousePointerClick, SquareMousePointer, 
    Goal, Info, Zap, BarChart3, TrendingUp, Plus
} from 'lucide-react';
import config from '../config';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartRefs = useRef({});

  useEffect(() => {
    const loadApex = () => {
        if (!window.ApexCharts) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/apexcharts@3.41.0/dist/apexcharts.min.js";
            script.async = true;
            script.onload = () => {
                console.log("ApexCharts Loaded");
                setIsChartReady(true);
            };
            document.body.appendChild(script);
        } else {
            setIsChartReady(true);
        }
    };
    loadApex();
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/dashboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const result = await response.json();
      if (response.ok && result.data) {
          setData(result.data);
      } else {
          setData({ campaigns: {}, emails: {}, smtp: {} });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData({ campaigns: {}, emails: {}, smtp: {} });
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
  if (!isLoading && isChartReady && data) {
    const timer = setTimeout(() => {
      renderAllCharts();
    }, 500);

    // --- YE CLEANUP FUNCTION ADD KARNA HAI ---
    return () => {
      clearTimeout(timer);
      if (chartRefs.current) {
        Object.values(chartRefs.current).forEach(chart => {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });
        chartRefs.current = {}; // Refs ko empty kar do
      }
    };
  }
}, [isLoading, isChartReady, data]);

  const stats = data?.emails || {};
  
  const generateMockTrend = (base = 10, variance = 20) => {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * variance + base));
  };

  const renderAllCharts = () => {
    const Apex = window.ApexCharts;
    if (!Apex) return;

    Object.values(chartRefs.current).forEach(c => c?.destroy?.());

    const sparkConfigs = [
        { id: 'spark1', color: '#2b7fff', data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 90, 80, 85] },
        { id: 'spark2', color: '#10b981', data: [50, 40, 45, 30, 32, 28, 40, 50, 45, 35, 40, 38] },
        { id: 'spark3', color: '#ff6900', data: [20, 25, 30, 28, 32, 25, 20, 22, 24, 28, 30, 32] },
        { id: 'spark4', color: '#8b5cf6', data: [15, 20, 25, 30, 22, 18, 24, 28, 30, 32, 35, 38] },
        { id: 'spark5', color: '#10b981', data: [80, 85, 82, 88, 92, 95, 96, 94, 98, 99, 100, 100] }
    ];

    sparkConfigs.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            chartRefs.current[item.id] = new Apex(el, {
                chart: { type: 'bar', height: 60, sparkline: { enabled: true }, animations: { enabled: true } },
                plotOptions: { bar: { columnWidth: '60%', borderRadius: 3 } },
                colors: [item.color],
                series: [{ data: item.data }],
                tooltip: { enabled: false }
            });
            chartRefs.current[item.id].render();
        }
    });

    // Removed bar charts code because Delivered Rate is now a sparkline.
    const mainEl = document.getElementById('main-area-chart');
    if (mainEl) {
        chartRefs.current['main'] = new Apex(mainEl, {
            chart: { type: 'area', height: 300, toolbar: { show: false }, zoom: { enabled: false } },
            colors: ['#2b7fff', '#8b5cf6'],
            stroke: { curve: 'smooth', width: 3 },
            fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
            dataLabels: { enabled: false },
            xaxis: { 
                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 600 } }
            },
            yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 600 } } },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
            legend: { position: 'top', horizontalAlign: 'right', fontWeight: 800 },
            series: [
                { name: 'Open Rate', data: [31, 40, 28, 51, 42, 35, 38, 33, 35, 40, 38, 35] },
                { name: 'Click Rate', data: [28, 38, 40, 38, 42, 55, 70, 52, 55, 62, 55, 30] }
            ]
        });
        chartRefs.current['main'].render();
    }

    const radialEl = document.getElementById('radial-chart');
    if (radialEl) {
        chartRefs.current['radial'] = new Apex(radialEl, {
            chart: { type: 'radialBar', height: 260 },
            plotOptions: {
                radialBar: {
                  hollow: { size: '55%' },
                  track: { background: '#f8fafc' },
                  dataLabels: {
                    name: { show: false },
                    value: { fontSize: '22px', fontWeight: 900, color: '#282B42', offsetY: 10 },
                    total: { show: true, label: 'Total', formatter: () => data?.emails?.totalSent || 0 }
                  }
                }
            },
            colors: ['#2b7fff', '#10b981', '#ff6900'],
            series: [70, 55, 40],
            stroke: { lineCap: 'round' }
        });
        chartRefs.current['radial'].render();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-[#2b7fff] rounded-full animate-spin"></div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white font-sans overflow-y-auto custom-scrollbar p-8 space-y-8 pb-32">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="space-y-1">
              <h1 className="text-[20px] font-black text-[#282B42] tracking-tight font-heading">Email Analytics</h1>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                   <ChevronRight size={10} /> Dashboards <ChevronRight size={10} /> <span className="text-slate-400">Email Analytics</span>
              </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[13px] font-black text-[#282B42]">Analytics Live</p>
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
              { id: 'spark1', label: 'SENT', value: stats.totalSent ?? 0, color: '#2b7fff', icon: <Rocket size={16}/>, sub: (stats.totalSent || 0) + ' Emails (Monthly)' },
              { id: 'spark5', label: 'DELIVERED', value: (stats.deliveryRate ?? 0) + '%', color: '#10b981', icon: <Target size={16}/>, sub: 'Success Rate' },
              { id: 'spark2', label: 'OPEN RATE', value: (stats.openRate ?? 0) + '%', color: '#10b981', icon: <MousePointerClick size={16}/>, sub: (stats.totalOpened || 0) + ' Opened (Monthly)' },
              { id: 'spark3', label: 'CLICK RATE', value: (stats.clickRate ?? 0) + '%', color: '#ff6900', icon: <SquareMousePointer size={16}/>, sub: (stats.totalClicked || 0) + ' Clicks (Monthly)' },
              { id: 'spark4', label: 'SMTP ACCOUNTS', value: data?.smtp?.totalConfigured ?? 0, color: '#8b5cf6', icon: <Globe size={16}/>, sub: 'Configured Nodes' }
          ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          {item.icon}
                          <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <h3 className="text-[22px] font-black text-slate-900">{item.value.toLocaleString()}</h3>
                    </div>
                    <div id={item.id} className="w-24 h-16 pt-2"></div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400">{item.sub}</p>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <BarChart3 className="text-[#2b7fff]" size={20} />
                      <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Email Data Tracking</h3>
                  </div>
                  <select className="bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500 px-4 py-2 rounded-xl outline-none">
                      <option>This Yearly</option>
                  </select>
              </div>
              <div id="main-area-chart" className="h-[300px] w-full"></div>
          </div>

          <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="flex items-center gap-2 self-start">
                    <TrendingUp className="text-emerald-500" size={16} />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Marketing</h4>
                  </div>
                  <div id="radial-chart" className="relative w-full h-[220px]"></div>
                  <div className="text-center">
                      <p className="text-[22px] font-black text-slate-800 tracking-tighter">Total {data?.campaigns?.total || 0}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Campaigns Managed</p>
                  </div>
              </div>

              <div className="bg-[#2b7fff] rounded-3xl p-8 text-white relative flex flex-col items-start min-h-[190px] shadow-xl shadow-blue-100">
                  <h4 className="text-[15px] font-black leading-snug mb-3 pr-8">Experience Our Fresh Email Composition Interface</h4>
                  <p className="text-[10px] text-blue-100 font-medium mb-5 opacity-80">A local-part, the symbol @, and a domain name or an IP address enclosed in brackets.</p>
                  <button onClick={() => navigate('/campaigns')} className="bg-white text-[#2b7fff] px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mt-auto shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                      Compose Email
                  </button>
                  <div className="absolute bottom-0 right-0 p-4 opacity-20">
                     <Rocket size={60} />
                  </div>
              </div>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
