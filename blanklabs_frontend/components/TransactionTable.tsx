import { useState } from 'react';

interface Transaction {
  date: string;
  action: string;
  amount: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto mt-6 p-4">
      <table className="w-full text-sm text-left text-gray-400 border border-gray-700">
        <thead className="text-xs uppercase bg-gray-800 text-gray-300">
          <tr>
            <th scope="col" className="px-6 py-3">Date</th>
            <th scope="col" className="px-6 py-3">Action</th>
            <th scope="col" className="px-6 py-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <tr
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-gray-900" : "bg-gray-800"
                } border-b border-gray-700`}
              >
                <td className="px-6 py-4">{transaction.date}</td>
                <td className="px-6 py-4">{transaction.action}</td>
                <td className="px-6 py-4">{transaction.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                No transactions available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}