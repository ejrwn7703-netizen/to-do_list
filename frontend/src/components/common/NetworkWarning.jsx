import { useWallet } from "../../hooks/useWallet";
import { shortAddress } from "../../utils/format";
import Header from "../layout/Header";

export default function NetworkWarning() {
  const { account, handleSwitchNetwork, error } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">잘못된 네트워크</h2>
          <p className="text-sm text-gray-500 mb-1">
            연결된 지갑: <span className="font-mono">{shortAddress(account)}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            BlockTodo는 <strong>Sepolia Testnet</strong>에서만 동작합니다.
          </p>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
          )}

          <button
            onClick={handleSwitchNetwork}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Sepolia 네트워크로 전환하기
          </button>
        </div>
      </div>
    </div>
  );
}
