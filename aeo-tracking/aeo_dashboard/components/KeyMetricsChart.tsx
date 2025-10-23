import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface KeyMetricsChartProps {
    data: { 
        time: string; 
        allTraffic: number;
        chatgptTraffic: number; 
    }[];
}

const KeyMetricsChart: React.FC<KeyMetricsChartProps> = ({ data }) => {
    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 20,
                        left: -10,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'white', 
                            borderColor: '#d1d5db',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        }}
                        labelStyle={{ color: '#374151' }}
                    />
                    <Legend wrapperStyle={{fontSize: "12px", color: "#374151"}}/>
                    <Line type="monotone" dataKey="allTraffic" name="All Traffic" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="chatgptTraffic" name="ChatGPT Traffic" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default KeyMetricsChart;