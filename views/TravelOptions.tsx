import React from "react";
import { TravelRequest } from "../types";

interface Props {
  requests: TravelRequest[];
  employeeName: string;
}

const TravelOptions: React.FC<Props> = ({ requests, employeeName }) => {
  const myRequests = requests.filter(
    r => r.employeeName === employeeName && r.agentOptions && r.agentOptions.length > 0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Travel Options</h1>

      {myRequests.length === 0 ? (
        <p className="text-gray-500">No travel options available yet.</p>
      ) : (
        myRequests.map(req => (
          <div key={req.id} className="bg-white p-5 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-primary-600">
              {req.destination}
            </h2>
            <p className="text-gray-500 text-sm mb-3">Request ID: {req.id}</p>

            <ul className="space-y-3">
              {req.agentOptions!.map((opt, i) => (
                <li key={i} className="border p-3 rounded-lg bg-gray-50">
                  {opt}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default TravelOptions;
