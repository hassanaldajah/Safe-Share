import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/api";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const upgradeUser = async () => {
      try {
        const response = await authFetch("/api/payments/mock-success", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to upgrade user");
        }

        setStatus("success");
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "An unexpected error occurred.");
      }
    };

    upgradeUser();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-16 w-16 text-[#00E5FF] animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Processing Payment...</h2>
            <p className="text-slate-400">Please do not close this page.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="bg-emerald-500/10 p-4 rounded-full mb-6">
              <CheckCircle className="h-16 w-16 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-8">
              You are now a PRO_USER. Enjoy your premium features!
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 px-4 bg-[#00E5FF] text-slate-950 font-medium rounded-xl hover:bg-[#00E5FF]/90 transition-colors shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="bg-red-500/10 p-4 rounded-full mb-6">
              <span className="text-red-500 text-4xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upgrade Failed</h2>
            <p className="text-slate-400 mb-8">{errorMessage}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-3 px-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
