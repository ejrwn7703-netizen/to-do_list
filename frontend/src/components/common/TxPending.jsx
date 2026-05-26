import { ETHERSCAN_URL } from "../../utils/constants";

export default function TxPending({ txState, onClose }) {
  if (!txState) return null;

  const etherscanHref = txState.hash ? `${ETHERSCAN_URL}/tx/${txState.hash}` : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {txState.status === "pending" && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">트랜잭션 처리 중...</h3>
            {!txState.hash ? (
              <p className="text-sm text-gray-500">MetaMask에서 서명을 확인하세요.</p>
            ) : (
              <p className="text-sm text-gray-500">블록 포함을 기다리는 중입니다.</p>
            )}
            {etherscanHref && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-mono truncate mb-1">
                  Tx: {txState.hash.slice(0, 10)}...{txState.hash.slice(-6)}
                </p>
                <a
                  href={etherscanHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-500 hover:underline"
                >
                  Sepolia Etherscan에서 보기 ↗
                </a>
              </div>
            )}
          </>
        )}

        {txState.status === "success" && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">트랜잭션 완료!</h3>
            {etherscanHref && (
              <a
                href={etherscanHref}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-indigo-500 hover:underline block mb-5"
              >
                Etherscan에서 확인하기 ↗
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              닫기
            </button>
          </>
        )}

        {txState.status === "error" && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">트랜잭션 실패</h3>
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-5">
              {txState.message}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
