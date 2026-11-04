import React, { useState } from 'react';
import useSWR from 'swr';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { ContractorModal } from '../../components/admin/ContractorModal.jsx';
import { HardHat, Plus, Edit2, Phone, Tractor, IndianRupee } from 'lucide-react';

export const ContractorsPage = () => {
  const { data, isLoading } = useSWR('/api/contractors');
  const contractors = data?.contractors || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Contractor Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage external machine owners, hourly rates, and machine associations
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedContractor(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Contractor
        </Button>
      </div>

      {/* Contractors Grid */}
      {isLoading ? (
        <LoadingSpinner label="Loading contractors..." />
      ) : contractors.length === 0 ? (
        <Card className="text-center py-12">
          <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Contractors Registered</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            If you lease or hire external harvester machines, register contractors and their agreed hourly rates here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {contractors.map((c) => (
            <Card key={c._id} className="hover:shadow-md transition">
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {c.mobile}
                  </p>
                </div>
                <Badge status={c.status} />
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Contractor Hourly Rate:</span>
                  <span className="font-black text-amber-700 text-sm">₹{c.paymentRate}/hr</span>
                </div>

                <div className="pt-2 border-t border-gray-50">
                  <span className="text-gray-400 block mb-1 font-semibold uppercase text-[10px]">
                    Assigned Harvesters ({c.assignedMachines?.length || 0})
                  </span>
                  {c.assignedMachines?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {c.assignedMachines.map((m) => (
                        <span
                          key={m._id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-medium"
                        >
                          <Tractor className="w-3 h-3 text-gray-500" /> {m.machineNumber}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">None</span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedContractor(c);
                    setModalOpen(true);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-gray-500" /> Edit Contractor
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <ContractorModal
        isOpen={modalOpen}
        contractor={selectedContractor}
        onClose={() => {
          setModalOpen(false);
          setSelectedContractor(null);
        }}
      />
    </div>
  );
};
