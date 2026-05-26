import { useState } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useWallet() {
  const { connect, disconnect, isConnected, account, chainId, isWrongNetwork, switchToSepolia } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    setError(null);
    setLoading(true);
    try {
      await connect();
    } catch (err) {
      if (err.message === "NO_METAMASK") {
        setError("MetaMask가 설치되어 있지 않습니다.");
      } else if (err.code === 4001) {
        setError("지갑 연결을 취소했습니다.");
      } else {
        setError("지갑 연결에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const handleSwitchNetwork = async () => {
    setError(null);
    try {
      await switchToSepolia();
    } catch (err) {
      if (err.code === 4902) {
        setError("MetaMask에 Sepolia 네트워크가 없습니다. 직접 추가해주세요.");
      } else if (err.code !== 4001) {
        setError("네트워크 전환에 실패했습니다.");
      }
    }
  };

  return {
    isConnected,
    account,
    chainId,
    isWrongNetwork,
    loading,
    error,
    connectWallet,
    disconnectWallet,
    handleSwitchNetwork,
  };
}
