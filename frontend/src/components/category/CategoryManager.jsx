import { useState } from "react";

export default function CategoryManager({ categories, todos, onAdd, onRename, onDelete, onClose }) {
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [editingId, setEditingId] = useState(null);   // 현재 이름 수정 중인 카테고리 ID
  const [editingName, setEditingName] = useState(""); // 수정 중인 이름 값
  const [editError, setEditError] = useState("");

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
    await onAdd(name);
  };

  const startEdit = (cat) => {
    setEditingId(cat.id.toString());
    setEditingName(cat.name);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditError("");
  };

  const handleRename = async (cat) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditError("이름을 입력하세요.");
      return;
    }
    if (byteLen(trimmed) > 50) {
      setEditError("카테고리 이름이 너무 깁니다 (최대 50바이트).");
      return;
    }
    if (trimmed === cat.name) {
      cancelEdit();
      return;
    }
    cancelEdit();
    await onRename(cat.id, trimmed);
  };

  const handleDelete = async (cat) => {
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
                const isEditing = editingId === cat.id.toString();

                return (
                  <div key={cat.id.toString()} className="bg-gray-50 rounded-lg overflow-hidden">
                    {isEditing ? (
                      /* 이름 수정 모드 */
                      <div className="px-3 py-2.5 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            autoFocus
                            onChange={(e) => {
                              setEditingName(e.target.value);
                              setEditError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(cat);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className={`flex-1 border rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white ${
                              editError ? "border-red-400" : "border-indigo-300"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRename(cat)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap"
                          >
                            저장 🔗
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors"
                          >
                            취소
                          </button>
                        </div>
                        {editError && <p className="text-xs text-red-500">{editError}</p>}
                      </div>
                    ) : (
                      /* 기본 표시 모드 */
                      <div className="flex items-center justify-between py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>📁</span>
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {cat.name}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">({count}개)</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            삭제 🔗
                          </button>
                        </div>
                      </div>
                    )}
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
