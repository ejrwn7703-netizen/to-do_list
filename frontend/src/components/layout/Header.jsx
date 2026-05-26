import { useWallet } from "../../hooks/useWallet";
import { shortAddress } from "../../utils/format";
import { SEPOLIA_CHAIN_ID, ADMIN_ADDRESS } from "../../utils/constants";

export default function Header({ onAdminClick }) {
  const { isConnected, account, chainId, disconnectWallet } = useWallet();
  const isAdmin = isConnected && account?.toLowerCase() === ADMIN_ADDRESS;

  const networkLabel =
    chainId === SEPOLIA_CHAIN_ID ? (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
        Sepolia ✓
      </span>
    ) : chainId ? (
      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
        Wrong Network
      </span>
    ) : null;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      <span className="text-xl font-bold text-indigo-600 tracking-tight">BlockTodo</span>

      {isConnected && (
        <div className="flex items-center gap-3">
          {networkLabel}
          {isAdmin && (
            <button
              onClick={onAdminClick}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-full font-semibold transition-colors"
            >
              ADMIN
            </button>
          )}
          <span className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-full">
            {shortAddress(account)}
          </span>
          <button
            onClick={disconnectWallet}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            연결 해제
          </button>
        </div>
      )}
    </header>
  );
}
