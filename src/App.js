import { useState } from "react";

export default function App() {
  const [customerNumber, setCustomerNumber] = useState("");
  const [deliveryAgentNumber, setDeliveryAgentNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCall = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("https://82aa-49-156-83-87.ngrok-free.app/api/v1/callProvider", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerNumber, deliveryAgentNumber }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Call initiated successfully! Call SID: ${data.callSid}`);
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Failed to make the call. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Initiate Call</h2>
      <form onSubmit={handleCall} className="space-y-4">
        <div>
          <label className="block text-gray-700">Customer Number:</label>
          <input
            type="text"
            value={customerNumber}
            onChange={(e) => setCustomerNumber(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <div>
          <label className="block text-gray-700">Delivery Agent Number:</label>
          <input
            type="text"
            value={deliveryAgentNumber}
            onChange={(e) => setDeliveryAgentNumber(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded mt-1"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Calling..." : "Make Call"}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-gray-700">{message}</p>}
    </div>
  );
}
