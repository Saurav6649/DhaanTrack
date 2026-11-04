import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../api/client.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Alert } from '../../components/common/Alert.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { Settings, Save, CheckCircle, HelpCircle, Layers, Landmark, Sparkles } from 'lucide-react';

export const MasterDataPage = () => {
  const { data, isLoading } = useSWR('/api/master-data');
  const [kathaPerAcre, setKathaPerAcre] = useState(32);
  const [machineCapacityPerHour, setMachineCapacityPerHour] = useState(1.0);
  const [savingKey, setSavingKey] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (data) {
      if (data.kathaPerAcre) setKathaPerAcre(data.kathaPerAcre);
      if (data.machineCapacityPerHour) setMachineCapacityPerHour(data.machineCapacityPerHour);
    }
  }, [data]);

  const handleSaveConfig = async (key, value, description) => {
    try {
      setSavingKey(key);
      setFeedback({ type: '', message: '' });

      await api.patch('/api/master-data', {
        key,
        value: Number(value),
        description,
      });

      await mutate('/api/master-data');
      setFeedback({ type: 'success', message: `Saved configuration for "${key}" successfully.` });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update configuration.' });
    } finally {
      setSavingKey('');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Data Configurations</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Configure regional agricultural land units, default harvester capacities, and system metadata
        </p>
      </div>

      {feedback.message && <Alert type={feedback.type} message={feedback.message} />}

      {isLoading ? (
        <LoadingSpinner label="Loading master configurations..." />
      ) : (
        <div className="space-y-6">
          {/* Card 1: Katha to Acre Conversion */}
          <Card>
            <CardHeader
              title="Regional Katha to Acre Conversion Factor"
              subtitle="Different regions (Bihar, UP, Bengal, Assam) use different Katha definitions"
            />
            <div className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Katha per 1 Acre *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={kathaPerAcre}
                    onChange={(e) => setKathaPerAcre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    isLoading={savingKey === 'kathaPerAcre'}
                    onClick={() =>
                      handleSaveConfig(
                        'kathaPerAcre',
                        kathaPerAcre,
                        'Local Katha to Acre conversion factor (e.g. 32 Katha = 1 Acre)'
                      )
                    }
                  >
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                </div>
              </div>

              <div className="bg-brand-50/50 p-3.5 rounded-xl border border-brand-100 text-xs text-brand-900 space-y-1">
                <p className="font-semibold">💡 Regional Examples:</p>
                <p>• Standard Bihar / Eastern UP: ~32 Katha = 1 Acre (Default)</p>
                <p>• Patna / Nalanda standard: ~20 Katha = 1 Bigha (~32 Katha = 1 Acre)</p>
                <p>• Bengal Standard: ~60 Katha = 1 Acre</p>
              </div>
            </div>
          </Card>

          {/* Card 2: Default Harvester Capacity */}
          <Card>
            <CardHeader
              title="Default Machine Working Capacity"
              subtitle="Standard harvesting throughput used when specific machine capacity is unset"
            />
            <div className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Default Capacity (Acres Per Hour) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={machineCapacityPerHour}
                    onChange={(e) => setMachineCapacityPerHour(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Button
                    variant="primary"
                    isLoading={savingKey === 'machineCapacityPerHour'}
                    onClick={() =>
                      handleSaveConfig(
                        'machineCapacityPerHour',
                        machineCapacityPerHour,
                        'Default machine harvesting capacity in Acres per Hour'
                      )
                    }
                  >
                    <Save className="w-4 h-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Default: 1.0 Acre Per Hour. You can also specify unique capacities per machine on the Users & Machines page.
              </p>
            </div>
          </Card>

          {/* Card 3: Standard Expense Categories & Payment Modes */}
          <Card>
            <CardHeader
              title="System Expense Categories & Payment Modes"
              subtitle="Registered taxonomy for operational auditing"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold text-gray-800 block mb-2 uppercase text-[11px] tracking-wider">
                  Expense Categories ({data?.expenseCategories?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {data?.expenseCategories?.map((c) => (
                    <div key={c} className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-600"></span>
                      <span className="font-semibold text-gray-800">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-gray-800 block mb-2 uppercase text-[11px] tracking-wider">
                  Accepted Payment Modes ({data?.paymentModes?.length || 0})
                </span>
                <div className="space-y-1.5">
                  {data?.paymentModes?.map((m) => (
                    <div key={m} className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="font-semibold text-gray-800">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
