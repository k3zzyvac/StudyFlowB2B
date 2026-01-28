import React from 'react';

export const PrincipalCharts: React.FC<{ data: any }> = ({ data }) => {
    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Özet Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#18181B] border border-white/5 p-4 rounded-2xl shadow-xl">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Toplam Öğrenci</div>
                    <div className="text-2xl font-black text-white">{data.totals?.students || 0}</div>
                    <div className="w-full h-1 bg-purple-500/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-purple-500 w-[70%]" />
                    </div>
                </div>
                <div className="bg-[#18181B] border border-white/5 p-4 rounded-2xl shadow-xl">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Eğitmen Sayısı</div>
                    <div className="text-2xl font-black text-white">{data.totals?.teachers || 0}</div>
                    <div className="w-full h-1 bg-blue-500/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500 w-[40%]" />
                    </div>
                </div>
                <div className="bg-[#18181B] border border-white/5 p-4 rounded-2xl shadow-xl">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Aktif Sınıflar</div>
                    <div className="text-2xl font-black text-white">{data.totals?.classes || 0}</div>
                    <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[60%]" />
                    </div>
                </div>
                <div className="bg-[#18181B] border border-white/5 p-4 rounded-2xl shadow-xl">
                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Toplam Rapor</div>
                    <div className="text-2xl font-black text-white">{data.totals?.reports || 0}</div>
                    <div className="w-full h-1 bg-amber-500/20 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-amber-500 w-[85%]" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 group/charts pr-4">
                {/* Sınıf Yoğunluğu - SVG Pie */}
                <div className="bg-[#18181B]/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl transition-all hover:border-purple-500/30">
                    <h3 className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-[0.2em]">Sınıf Yoğunluğu</h3>
                    <div className="flex items-center gap-6">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                            {data.classDensity && data.classDensity.length > 0 ? (() => {
                                let cumulativePercent = 0;
                                const total = data.classDensity.reduce((acc: number, d: any) => acc + d.value, 0);
                                return data.classDensity.map((d: any, i: number) => {
                                    const percent = (d.value / total) * 100;
                                    const startPos = (cumulativePercent / 100) * 314;
                                    const dash = (percent / 100) * 314;
                                    cumulativePercent += percent;
                                    return (
                                        <circle key={i} r="25" cx="50" cy="50" fill="transparent" stroke={d.color} strokeWidth="50" strokeDasharray={`${dash} 314`} strokeDashoffset={-startPos} className="transition-all duration-1000" />
                                    );
                                });
                            })() : <circle r="25" cx="50" cy="50" fill="transparent" stroke="#27272A" strokeWidth="50" />}
                        </svg>
                        <div className="flex-1 space-y-2">
                            {data.classDensity && data.classDensity.slice(0, 4).map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                    <span className="flex items-center gap-2 text-gray-400 font-medium">
                                        <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: d.color, color: d.color }}></div>
                                        {d.name}
                                    </span>
                                    <span className="text-white font-black">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ödev Trendi - Bar Chart */}
                <div className="bg-[#18181B]/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl transition-all hover:border-blue-500/30">
                    <h3 className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-[0.2em]">Haftalık Atamalar</h3>
                    <div className="h-24 flex items-end justify-between gap-2">
                        {data.assignmentTrend && data.assignmentTrend.map((d: any, i: number) => {
                            const max = Math.max(...data.assignmentTrend.map((t: any) => t.count), 1);
                            const height = (d.count / max) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-blue-500/10 rounded-t-lg relative group/bar" style={{ height: `${Math.max(height, 5)}%` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-600 to-indigo-400 rounded-t-lg opacity-40 group-hover/bar:opacity-100 transition-all duration-500"></div>
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-white opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">{d.count}</div>
                                    </div>
                                    <span className="text-[8px] text-gray-500 font-black uppercase">{d.day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Aktiflik Oranı */}
                <div className="bg-[#18181B]/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl transition-all hover:border-emerald-500/30">
                    <h3 className="text-gray-400 text-[10px] font-black uppercase mb-4 tracking-[0.2em]">Kurum Aktifliği</h3>
                    <div className="flex flex-col justify-center h-24">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-white leading-none">{data.activeRatio?.total > 0 ? Math.round((data.activeRatio.active / data.activeRatio.total) * 100) : 0}%</span>
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-1">Katılım Oranı</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-black bg-white/5 px-2 py-1 rounded-md">{data.activeRatio?.active || 0} / {data.activeRatio?.total || 0} Öğrenci</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div className="h-full bg-gradient-to-r from-emerald-600 via-green-400 to-teal-300 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.4)]" style={{ width: `${(data.activeRatio?.total > 0) ? (data.activeRatio.active / data.activeRatio.total) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
