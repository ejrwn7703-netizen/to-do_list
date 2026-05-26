import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";
import { parseContractError } from "../utils/errors";

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
      setTodos([...raw]); // 정렬은 App.jsx에서 필터와 함께 처리
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
          setTxState((prev) => ({ ...prev, status: "error", message: parseContractError(e) }));
        }
      }
    },
    [contract, fetchTodos]
  );

  const updateTodo = useCallback(
    async (todoId, { title, description, categoryId, priority, deadline }) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "할 일 수정" });
      try {
        const tx = await contract.updateTodo(
          BigInt(todoId),
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
          setTxState((prev) => ({ ...prev, status: "error", message: parseContractError(e) }));
        }
      }
    },
    [contract, fetchTodos]
  );

  const deleteTodo = useCallback(
    async (todoId) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "할 일 삭제" });
      try {
        const tx = await contract.deleteTodo(BigInt(todoId));
        setTxState((prev) => ({ ...prev, hash: tx.hash }));
        await tx.wait();
        await fetchTodos();
        setTxState((prev) => ({ ...prev, status: "success" }));
      } catch (e) {
        if (e.code === 4001 || e.code === "ACTION_REJECTED") {
          setTxState(null);
        } else {
          setTxState((prev) => ({ ...prev, status: "error", message: parseContractError(e) }));
        }
      }
    },
    [contract, fetchTodos]
  );

  const toggleComplete = useCallback(
    async (todoId) => {
      if (!contract) return;
      setTxState({ hash: null, status: "pending", action: "완료 상태 변경" });
      try {
        const tx = await contract.toggleComplete(BigInt(todoId));
        setTxState((prev) => ({ ...prev, hash: tx.hash }));
        await tx.wait();
        await fetchTodos();
        setTxState((prev) => ({ ...prev, status: "success" }));
      } catch (e) {
        if (e.code === 4001 || e.code === "ACTION_REJECTED") {
          setTxState(null);
        } else {
          setTxState((prev) => ({ ...prev, status: "error", message: parseContractError(e) }));
        }
      }
    },
    [contract, fetchTodos]
  );

  const clearTxState = useCallback(() => setTxState(null), []);

  return {
    todos,
    loading,
    txState,
    clearTxState,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
    refresh: fetchTodos,
  };
}
