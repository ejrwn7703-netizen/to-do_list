import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../context/Web3Context";

export function useCategories() {
  const { contract, account } = useWeb3();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return { categories, loading, refresh: fetchCategories };
}
