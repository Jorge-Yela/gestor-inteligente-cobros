"use client";

import { useMemo, useState } from "react";

type CustomerSearchProps = {
  defaultValue: string;
  customers: string[];
};

export function CustomerSearch({ defaultValue, customers }: CustomerSearchProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = value.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return customers
      .filter((customer) => customer.toLowerCase().includes(query))
      .slice(0, 8);
  }, [customers, value]);

  return (
    <div className="relative">
      <label htmlFor="customer" className="text-xs font-medium text-slate-500">
        Cliente
      </label>
      <input
        id="customer"
        name="customer"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar cliente"
        autoComplete="off"
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      {isOpen && filteredCustomers.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filteredCustomers.map((customer) => (
            <button
              key={customer}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                setValue(customer);
                setIsOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              {customer}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
