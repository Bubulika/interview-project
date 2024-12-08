"use client";

import { LogAfterTabs } from "@/app/lib/actions";

export default function Tabs() {
  return (
    <div className="w-full flex justify-end gap-4">
      {["All", "Pending", "Overdue", "Cancelled", "Paid"].map((status, i) => {
        return (
          <form key={i} action={LogAfterTabs}>
            <input
              className="hidden"
              name="status"
              value={status.toLowerCase()}
              id={status}
              readOnly
            />
            <button className={`rounded-full px-3 py-2 `} type="submit">
              {status}
            </button>
          </form>
        );
      })}
    </div>
  );
}
