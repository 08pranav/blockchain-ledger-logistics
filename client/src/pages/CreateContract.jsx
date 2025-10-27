import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractAPI } from '../utils/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { generateContractId } from '../utils/helpers';

const CreateContract = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    contractId: generateContractId(),
    partyA: '',
    partyB: '',
    amount: '',
    currency: 'USD',
    dueDate: '',
    description: '',
    terms: ''
  });
  const [loading, setLoading] = useState(false);

  const currencies = ['USD', 'EUR', 'INR', 'GBP', 'JPY'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await contractAPI.create({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      toast.success('Smart contract created successfully!');
      navigate('/contracts');
    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create Smart Contract</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="form-label">Contract ID</label>
            <input
              type="text"
              name="contractId"
              value={formData.contractId}
              onChange={handleChange}
              className="form-input"
              required
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Party A</label>
              <input
                type="text"
                name="partyA"
                value={formData.partyA}
                onChange={handleChange}
                className="form-input"
                placeholder="First party name"
                required
              />
            </div>
            <div>
              <label className="form-label">Party B</label>
              <input
                type="text"
                name="partyB"
                value={formData.partyB}
                onChange={handleChange}
                className="form-input"
                placeholder="Second party name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="form-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="form-input"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Contract description"
              required
            />
          </div>

          <div>
            <label className="form-label">Terms and Conditions</label>
            <textarea
              name="terms"
              value={formData.terms}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Contract terms and conditions"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Contract'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContract;