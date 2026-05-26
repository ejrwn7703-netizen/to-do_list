import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useTodos() {
  const { contract, account } = useWeb3();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txState, setTxState] = useState(null);

  const fetchTodos = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const raw = await contract.getTodos();
      const sorted = [...raw].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      setTodos(sorted);
    } catch (e) {
      console.error("getTodos:", e);
    } finally {
      setLoading(false);
    }
  }, [contract, account]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = useCallback(
    async ({ title, description, categoryId, priority, deadline }) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "할 일 추가" });
      try {
        const tx = await contract.addTodo(
          title,
          description,
          BigInt(categoryId),
          priority,
          BigInt(deadline)
        );
        setTxState((prev) => ({ ...prev, hash: tx.hash }));
        await tx.wait();
        await fetchTodos();
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
    [contract, fetchTodos]
  );

  const clearTxState = useCallback(() => setTxState(null), []);

  return { todos, loading, txState, clearTxState, addTodo, refresh: fetchTodos };
}
