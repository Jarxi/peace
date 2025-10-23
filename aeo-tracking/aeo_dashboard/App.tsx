import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import KeyMetricsChart from './components/KeyMetricsChart';
import ActivityTable from './components/ActivityTable';
import GlobalStats from './components/GlobalStats';
import { EventLog } from './types';

// --- Data Generation ---
const PRODUCT_NAMES = ['Quantum Widget', 'Nova Gadget', 'Fusion Gizmo', 'Echo Sphere', 'Apex Drive'];
const SOURCES = ['Organic', 'Direct', 'Referral', 'Social', 'Paid', 'ChatGPT'];
const EVENT_TYPES = ['product_viewed', 'clicked', 'add_to_cart', 'checkout'];

const generateEvent = (timestamp: Date): EventLog => {
  // Make checkouts and add_to_carts less frequent to be more realistic
  let eventType: string;
  const rand = Math.random();
  if (rand < 0.05) { // 5% chance of checkout
      eventType = 'checkout';
  } else if (rand < 0.2) { // 15% chance of add to cart
      eventType = 'add_to_cart';
  } else if (rand < 0.55) { // 35% chance of click
      eventType = 'clicked';
  } else { // 45% chance of product view
      eventType = 'product_viewed';
  }

  return {
    clientId: crypto.randomUUID(),
    productName: PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)],
    productLink: '#',
    occurredAt: timestamp,
    eventType: eventType,
    addToCart: eventType === 'add_to_cart',
    checkout: eventType === 'checkout',
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
  };
};

const generateInitialEvents = (count: number, daysAgo: number): EventLog[] => {
  const events: EventLog[] = [];
  const now = Date.now();
  const start = now - daysAgo * 24 * 60 * 60 * 1000;
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(start + Math.random() * (now - start));
    events.push(generateEvent(timestamp));
  }
  return events.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
};

const MAX_LOG_SIZE = 2000;

const App: React.FC = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>(() => generateInitialEvents(1500, 7));
  const [interval, setInterval] = useState<'5m' | '1h' | '1d' | '1w'>('1h');

  // Live data simulation
  useEffect(() => {
    const liveInterval = window.setInterval(() => {
      setEventLogs(prevLogs => [generateEvent(new Date()), ...prevLogs].slice(0, MAX_LOG_SIZE));
    }, 2000); // Add a new event every 2 seconds

    return () => clearInterval(liveInterval);
  }, []);

  const globalStats = useMemo(() => {
    const totalVisits = eventLogs.length;

    const checkoutEvents = eventLogs.filter(e => e.eventType === 'checkout');
    const totalSold = checkoutEvents.length;
    
    const chatGptLogs = eventLogs.filter(e => e.source === 'ChatGPT');
    const totalVisitsChatGPT = chatGptLogs.length;
    const totalSoldChatGPT = chatGptLogs.filter(e => e.eventType === 'checkout').length;


    // Create a sorted copy to avoid mutation and for reuse
    const sortedCheckouts = [...checkoutEvents].sort((a,b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    const mostRecentPurchase = sortedCheckouts.length > 0
        ? sortedCheckouts[0].occurredAt
        : null;
        
    const mostRecentSoldProduct = sortedCheckouts.length > 0
        ? sortedCheckouts[0].productName
        : 'N/A';

    const countProducts = (logs: EventLog[]) => {
        if (logs.length === 0) return 'N/A';
        const counts = logs.reduce((acc, log) => {
            acc[log.productName] = (acc[log.productName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return topEntry ? topEntry[0] : 'N/A';
    };

    const topProductAll = countProducts(eventLogs);
    const topProductChatGPT = countProducts(chatGptLogs);

    return { totalVisits, totalSold, mostRecentPurchase, topProductAll, topProductChatGPT, mostRecentSoldProduct, totalVisitsChatGPT, totalSoldChatGPT };
  }, [eventLogs]);


  const aggregatedData = useMemo(() => {
    const now = new Date();
    let startTime: Date;
    let timeUnit: 'minute' | 'hour' | 'day';

    switch (interval) {
      case '5m':
        startTime = new Date(now.getTime() - 5 * 60 * 1000);
        timeUnit = 'minute';
        break;
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        timeUnit = 'minute';
        break;
      case '1d':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        timeUnit = 'hour';
        break;
      case '1w':
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        timeUnit = 'day';
        break;
    }

    const buckets = new Map<string, { all: number, chatgpt: number }>();
    const cursor = new Date(startTime);

    // 1. Pre-populate buckets with 0 to avoid gaps
    if (timeUnit === 'minute') {
      cursor.setSeconds(0, 0);
      while (cursor <= now) {
        buckets.set(cursor.toISOString(), { all: 0, chatgpt: 0 });
        cursor.setMinutes(cursor.getMinutes() + 1);
      }
    } else if (timeUnit === 'hour') {
      cursor.setMinutes(0, 0, 0);
       while (cursor <= now) {
        buckets.set(cursor.toISOString(), { all: 0, chatgpt: 0 });
        cursor.setHours(cursor.getHours() + 1);
      }
    } else { // day
      cursor.setHours(0, 0, 0, 0);
      while (cursor <= now) {
        buckets.set(cursor.toISOString().split('T')[0], { all: 0, chatgpt: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    
    // 2. Fill buckets with actual event data
    const relevantEvents = eventLogs.filter(e => e.occurredAt >= startTime);
    relevantEvents.forEach(event => {
      const d = new Date(event.occurredAt);
      let key: string;
      if (timeUnit === 'minute') {
        d.setSeconds(0, 0);
        key = d.toISOString();
      } else if (timeUnit === 'hour') {
        d.setMinutes(0, 0, 0);
        key = d.toISOString();
      } else { // day
        d.setHours(0, 0, 0, 0);
        key = d.toISOString().split('T')[0];
      }
      
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.all += 1;
        if (event.source === 'ChatGPT') {
            bucket.chatgpt += 1;
        }
      }
    });

    // 3. Format for the chart
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sortedKeys.map(key => {
        const d = new Date(key);
        let timeLabel: string;
        if (timeUnit === 'minute') {
            timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (timeUnit === 'hour') {
            timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else { // day
            timeLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        const bucketData = buckets.get(key)!;
        return { time: timeLabel, allTraffic: bucketData.all, chatgptTraffic: bucketData.chatgpt };
    });
  }, [eventLogs, interval]);
  
  const IntervalButton: React.FC<{ value: typeof interval; label: string }> = ({ value, label }) => (
    <button
      onClick={() => setInterval(value)}
      className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors border ${
        interval === value
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white hover:bg-gray-100 text-slate-600 border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-gray-50 text-slate-800 min-h-screen font-sans">
      <Header />
      <main className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:p-8">
        <GlobalStats {...globalStats} />

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-0">Live Traffic</h2>
            <div className="flex items-center gap-2">
              <IntervalButton value="5m" label="5m" />
              <IntervalButton value="1h" label="1H" />
              <IntervalButton value="1d" label="1D" />
              <IntervalButton value="1w" label="1W" />
            </div>
          </div>
          <KeyMetricsChart data={aggregatedData} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <ActivityTable events={eventLogs.slice(0, 10)} />
        </div>
      </main>
    </div>
  );
};

export default App;