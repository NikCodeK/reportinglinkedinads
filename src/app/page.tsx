'use client';

import { useState } from 'react';
import Auth from '@/components/Auth';
import Navigation, { TabType } from '@/components/Navigation';
import DailyTab from '@/components/DailyTab';
import WeeklyTab from '@/components/WeeklyTab';
import DeepDiveTab from '@/components/DeepDiveTab';
import LogbuchTab from '@/components/LogbuchTab';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  if (!isAuthenticated) {
    return <Auth onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyTab />;
      case 'weekly':
        return <WeeklyTab />;
      case 'deep-dive':
        return <DeepDiveTab />;
      case 'logbuch':
        return <LogbuchTab />;
      default:
        return <DailyTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderTabContent()}
      </main>
    </div>
  );
}



