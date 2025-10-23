import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SourceChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#34d399', '#a855f7', '#f59e0b', '#ef4444'];

const SourceDistributionChart: React.FC<SourceChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#020617', 
                            borderColor: '#10b981'
                        }}
                        labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SourceDistributionChart;