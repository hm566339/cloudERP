import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';

export default function ElectronicCreditLedgerPage() {
  const [ledgers, setLedgers] = useState([]);

  useEffect(() => {
    // In a real scenario, this would fetch from /api/gst/ecl
    setLedgers([]);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Electronic Credit Ledger</h1>
          <p className="text-sm text-zinc-500">Track ITC balances and monthly offsets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-zinc-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-bold">Month/Year</th>
                  <th className="px-4 py-3 font-bold">Opening Balance</th>
                  <th className="px-4 py-3 font-bold text-green-600">Credit (2B)</th>
                  <th className="px-4 py-3 font-bold text-red-600">Utilized (3B)</th>
                  <th className="px-4 py-3 font-bold">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ledgers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-zinc-500">
                      No ledger records found.
                    </td>
                  </tr>
                ) : (
                  ledgers.map(l => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">{l.month}/{l.year}</td>
                      <td className="px-4 py-3">₹ {l.openingIgst + l.openingCgst + l.openingSgst + l.openingCess}</td>
                      <td className="px-4 py-3">₹ {l.creditIgst + l.creditCgst + l.creditSgst + l.creditCess}</td>
                      <td className="px-4 py-3">₹ {l.utilizedIgst + l.utilizedCgst + l.utilizedSgst + l.utilizedCess}</td>
                      <td className="px-4 py-3 font-bold">₹ {l.closingIgst + l.closingCgst + l.closingSgst + l.closingCess}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
