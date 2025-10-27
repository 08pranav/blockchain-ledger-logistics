import React from 'react';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const SmartContracts = () => {
  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Smart Contracts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage digital contracts with automated execution.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/contracts/create"
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Contract
          </Link>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-6 py-8 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contracts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first smart contract.
          </p>
          <div className="mt-6">
            <Link to="/contracts/create" className="btn-primary">
              Create Contract
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartContracts;