"use client";

import { updateInvoiceStatus } from "@/app/lib/actions";
import { CheckIcon, ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useState } from "react";

// Assuming you already have a function to update the status via API

export default function InvoiceStatus({
  status,
  invoiceId,
}: {
  status: string;
  invoiceId: string;
}) {
  const statusOptions = ["cancelled", "overdue", "paid", "pending"];
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open ? (
        <span
          onClick={() => setOpen((prev) => !prev)}
          className={clsx(
            "inline-flex items-center rounded-full px-2 py-1 text-xs",
            {
              "bg-gray-100 text-gray-500": status === "pending",
              "bg-green-500 text-white": status === "paid",
              "bg-red-500 text-white": status === "cancelled",
              "bg-red-800 text-white": status === "overdue",
            }
          )}
        >
          {status === "pending" && (
            <>
              Pending
              <ClockIcon className="ml-1 w-4 text-gray-500" />
            </>
          )}
          {status === "paid" && (
            <>
              Paid
              <CheckIcon className="ml-1 w-4 text-white" />
            </>
          )}
          {status === "cancelled" && (
            <>
              Cancelled
              <XMarkIcon className="ml-1 w-4 text-white" />
            </>
          )}
          {status === "overdue" && (
            <>
              Overdue
              <XMarkIcon className="ml-1 w-4 text-white" />
            </>
          )}
        </span>
      ) : (
        <form action={updateInvoiceStatus}>
          <input
            value={invoiceId}
            className="hidden"
            name="invoiceId"
            id="invoiceId"
            readOnly
          />
          <select
            className="px-3 py-2 pr-8 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            name="status"
            id="status"
            onChange={(e) => {
              setOpen((prev) => !prev);
              e.target.form?.requestSubmit();
            }}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </form>
      )}
    </>
  );
}
