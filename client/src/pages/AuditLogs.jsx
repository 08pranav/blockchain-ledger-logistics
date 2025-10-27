import React from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const AuditLogs = () => {
  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-gray-700">
            Immutable record of all system activities and transactions.
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-8 text-center">
          <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Audit Logs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Audit log functionality will be implemented here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;