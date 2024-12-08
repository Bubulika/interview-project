import { fetchLogs } from "../lib/data";
import formatTimestamp from "../lib/utils";

export default async function Logs() {
  const logs = await fetchLogs();
  console.log(logs);
  return (
    <div className="w-full p-4">
      {/* Table Wrapper with Scrollable Content */}
      <div className="overflow-y-auto max-h-[300px] border border-gray-300 rounded-lg">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                invoiceID
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Old Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                New Status
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Changed By
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Timestamp
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Table Rows */}
            {Array.isArray(logs) &&
              logs.map((log: any) => (
                <tr key={log.created_at} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {log.invoice_id}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {log.old_status}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {log.new_status}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {log.username}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {formatTimestamp(log.created_at)}
                  </td>
                  <td className="px-4 py-2 text-sm text-blue-500 cursor-pointer">
                    Restore
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
