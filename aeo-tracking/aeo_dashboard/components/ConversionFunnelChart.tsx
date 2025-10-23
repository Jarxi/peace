import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FunnelChartProps {
    data: { name: string; value: number; fill: string }[];
}

const ConversionFunnelChart: React.FC<FunnelChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{
                        top: 5,
                        right: 20,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#475569" />
                    <YAxis dataKey="name" type="category" width={100} stroke="#475569" />
                    <Tooltip 
                        cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                        contentStyle={{ 
                            backgroundColor: '#020617', 
                            borderColor: '#10b981'
                        }}
                        labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Bar dataKey="value" name="Events" barSize={30} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ConversionFunnelChart;