import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useCategories() {
  const { contract, account } = useWeb3();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState(null);

  const fetchCategories = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const raw = await contract.getCategories();
      setCategories(raw.filter((c) => c.isActive));
    } catch (e) {
      console.error("getCategories:", e);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = useCallback(
    async (name) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "카테고리 추가" });
      try {
        const tx = await contract.addCategory(name);
        setTxState((prev) => ({ ...prev, hash: tx.hash }));
        await tx.wait();
        await fetchCategories();
        setTxState((prev) => ({ ...prev, status: "success" }));
      } catch (e) {
        if (e.code === 4001 || e.code === "ACTION_REJECTED") {
          setTxState(null);
        } else {
          const msg = e.reason ?? e.shortMessage ?? e.message;
          setTxState((prev) => ({ ...prev, status: "error", message: msg }));
        }
      }
    },
    [contract, fetchCategories]
  );

  const deleteCategory = useCallback(
    async (categoryId) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "카테고리 삭제" });
      try {
        const tx = await contract.deleteCategory(BigInt(categoryId));
        setTxState((prev) => ({ ...prev, hash: tx.hash }));
        await tx.wait();
        await fetchCategories();
        setTxState((prev) => ({ ...prev, status: "success" }));
      } catch (e) {
        if (e.code === 4001 || e.code === "ACTION_REJECTED") {
          setTxState(null);
        } else {
          const msg = e.reason ?? e.shortMessage ?? e.message;
          setTxState((prev) => ({ ...prev, status: "error", message: msg }));
        }
      }
    },
    [contract, fetchCategories]
  );

  const clearTxState = useCallback(() => setTxState(null), []);

  return {
    categories,
    loading,
    txState,
    clearTxState,
    addCategory,
    deleteCategory,
    refresh: fetchCategories,
  };
}
