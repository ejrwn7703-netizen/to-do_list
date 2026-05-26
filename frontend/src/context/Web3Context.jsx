import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";
import { SEPOLIA_CHAIN_ID, SEPOLIA_CHAIN_ID_HEX } from "../utils/constants";

const Web3Context = createContext(null);

const initialState = {
  provider: null,
  signer: null,
  contract: null,
  account: null,
  chainId: null,
  isConnected: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "CONNECTED":
      return {
        ...state,
        provider: action.provider,
        signer: action.signer,
        contract: action.contract,
        account: action.account,
        chainId: action.chainId,
        isConnected: true,
      };
    case "CHAIN_CHANGED":
      return { ...state, chainId: action.chainId };
    case "ACCOUNT_CHANGED":
      return {
        ...state,
        signer: action.signer,
        contract: action.contract,
        account: action.account,
      };
    case "DISCONNECTED":
      return initialState;
    default:
      return state;
  }
}

export function Web3Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("NO_METAMASK");

    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const contract = getContract(signer);

    dispatch({ type: "CONNECTED", provider, signer, contract, account, chainId });
    return chainId;
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: "DISCONNECTED" });
  }, []);

  const switchToSepolia = useCallback(async () => {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  }, []);

  // 페이지 로드 시 이미 연결된 계정이 있으면 자동 재연결
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
      if (accounts.length > 0) {
        try {
          await connect();
        } catch {
          // 자동 재연결 실패 시 무시
        }
      }
    });
  }, [connect]);

  // 계정 변경 이벤트
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        dispatch({ type: "DISCONNECTED" });
        return;
      }
      if (!state.provider) return;
      try {
        const signer = await state.provider.getSigner();
        const account = await signer.getAddress();
        const contract = getContract(signer);
        dispatch({ type: "ACCOUNT_CHANGED", signer, contract, account });
      } catch {
        dispatch({ type: "DISCONNECTED" });
      }
    };

    const handleChainChanged = (chainIdHex) => {
      dispatch({ type: "CHAIN_CHANGED", chainId: parseInt(chainIdHex, 16) });
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [state.provider]);

  const isWrongNetwork = state.isConnected && state.chainId !== SEPOLIA_CHAIN_ID;

  return (
    <Web3Context.Provider value={{ ...state, isWrongNetwork, connect, disconnect, switchToSepolia }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3는 Web3Provider 내부에서만 사용 가능합니다");
  return ctx;
}
