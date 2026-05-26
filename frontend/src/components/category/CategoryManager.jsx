import { useState } from "react";

export default function CategoryManager({ categories, todos, onAdd, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");

  // categoryId → 활성 Todo 개수
  const countByCategory = {};
  todos.forEach((todo) => {
    const id = todo.categoryId.toString();
    countByCategory[id] = (countByCategory[id] ?? 0) + 1;
  });

  const byteLen = (str) => new TextEncoder().encode(str).length;

  const handleAdd = async () => {
    if (!newName.trim()) {
      setNameError("카테고리 이름을 입력하세요.");
      return;
    }
    if (byteLen(newName.trim()) > 50) {
      setNameError("카테고리 이름이 너무 깁니다 (최대 50바이트).");
      return;
    }
    const name = newName.trim();
    setNewName("");
    setNameError("");
    // 모달을 닫지 않고 트랜잭션 시작 → TxPending(z-50)이 모달(z-40) 위에 오버레이됨
    // 트랜잭션 완료 후 TxPending 닫으면 카테고리 모달이 갱신된 목록으로 다시 보임
    await onAdd(name);
  };

  const handleDelete = async (cat) => {
    // 모달을 닫지 않고 트랜잭션 시작 (SCR-08 → SCR-07 플로우)
    await onDelete(cat.id);
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">카테고리 관리</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 space-y-5">
        {/* 새 카테고리 추가 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            새 카테고리 추가
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="카테고리 이름 입력"
              className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                nameError ? "border-red-400" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={handleAdd}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              추가 🔗
            </button>
          </div>
          {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
        </div>

        <hr className="border-gray-200" />

        {/* 카테고리 목록 */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">카테고리 목록</p>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">카테고리가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = countByCategory[cat.id.toString()] ?? 0;
                return (
                  <div
                    key={cat.id.toString()}
                    className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>📁</span>
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">({count}개)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0 ml-2"
                    >
                      삭제 🔗
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <p className="text-xs text-amber-700">
            * Todo가 있는 카테고리는 삭제 불가 (컨트랙트에서 검증)
          </p>
        </div>
      </div>

      {/* 닫기 버튼 */}
      <div className="flex justify-end px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="border border-gray-300 text-gray-600 font-medium px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
