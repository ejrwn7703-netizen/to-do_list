import { useState, useMemo } from "react";
import { useWallet } from "./hooks/useWallet";
import { useTodos } from "./hooks/useTodos";
import { useCategories } from "./hooks/useCategories";
import NetworkWarning from "./components/common/NetworkWarning";
import Modal from "./components/common/Modal";
import TxPending from "./components/common/TxPending";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import TodoList from "./components/todo/TodoList";
import TodoFilter from "./components/todo/TodoFilter";
import TodoForm from "./components/todo/TodoForm";
import CategoryManager from "./components/category/CategoryManager";

// SCR-01: 지갑 미연결 랜딩 화면
function LandingScreen() {
  const { connectWallet, loading, error } = useWallet();
  const hasMetaMask = typeof window.ethereum !== "undefined";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
      <header className="flex items-center px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
        <span className="text-xl font-bold text-indigo-600 tracking-tight">BlockTodo</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">BlockTodo</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            블록체인 기반 나만의 할 일 관리
            <br />
            MetaMask 지갑 하나로 시작하세요.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-xs text-amber-700 leading-relaxed">
              ⚠ 온체인에 기록된 데이터는 누구나 조회할 수 있습니다.
              <br />
              민감한 정보는 입력하지 마세요.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
          )}

          {hasMetaMask ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <span className="animate-spin">⏳</span> : <>🦊 MetaMask로 연결하기</>}
            </button>
          ) : (
            <div>
              <p className="text-sm text-red-500 mb-3">
                MetaMask 확장 프로그램이 설치되어 있지 않습니다.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                🦊 MetaMask 설치하기
              </a>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">* MetaMask 확장 프로그램이 필요합니다.</p>
        </div>
      </div>
    </div>
  );
}

// SCR-06: Todo 삭제 확인 다이얼로그
function DeleteConfirmDialog({ todo, onConfirm, onCancel }) {
  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">할 일 삭제 확인</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
      </div>
      <div className="px-6 py-6 text-center">
        <div className="text-4xl mb-4">⚠</div>
        <p className="font-semibold text-gray-800 mb-3">정말로 삭제하시겠습니까?</p>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-2 mb-4 font-medium">
          "{todo.title}"
        </p>
        <p className="text-xs text-gray-400 mb-6">
          삭제 후에도 블록체인 기록은 이력으로 영구 보존됩니다.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            삭제하기 🔗
          </button>
        </div>
      </div>
    </div>
  );
}

// SCR-03: 메인 — Todo 목록 화면
function MainScreen() {
  const {
    todos,
    loading: todosLoading,
    txState: todoTxState,
    clearTxState: clearTodoTxState,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete,
  } = useTodos();

  const {
    categories,
    loading: catsLoading,
    txState: catTxState,
    clearTxState: clearCatTxState,
    addCategory,
    deleteCategory,
  } = useCategories();

  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);   // null | Todo 객체
  const [deletingTodo, setDeletingTodo] = useState(null); // null | Todo 객체
  const [showCatModal, setShowCatModal] = useState(false);

  // ─── 필터 & 정렬 상태 (Phase 7) ────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // Sidebar + TodoFilter 공유
  const [statusFilter, setStatusFilter] = useState("all");   // "all" | "active" | "completed"
  const [priorityFilter, setPriorityFilter] = useState("all"); // "all" | "0" | "1" | "2"
  const [sortBy, setSortBy] = useState("createdAt");           // "createdAt" | "deadline" | "priority"

  // ─── 클라이언트 사이드 필터 + 정렬 ──────────────────────────────────────────
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // 상태 필터
    if (statusFilter === "active") result = result.filter((t) => !t.isCompleted);
    if (statusFilter === "completed") result = result.filter((t) => t.isCompleted);

    // 카테고리 필터 (Sidebar 클릭 또는 TodoFilter 드롭다운 — 동일 상태)
    if (selectedCategoryId) {
      result = result.filter((t) => t.categoryId.toString() === selectedCategoryId);
    }

    // 우선순위 필터
    if (priorityFilter !== "all") {
      result = result.filter((t) => Number(t.priority) === Number(priorityFilter));
    }

    // 정렬
    result.sort((a, b) => {
      if (sortBy === "createdAt") {
        return Number(b.createdAt) - Number(a.createdAt); // 최신 생성 순
      }
      if (sortBy === "deadline") {
        // 마감일 없는 항목은 맨 뒤로
        if (a.deadline === 0n && b.deadline === 0n) return 0;
        if (a.deadline === 0n) return 1;
        if (b.deadline === 0n) return -1;
        return Number(a.deadline) - Number(b.deadline); // 빠른 마감일 먼저
      }
      if (sortBy === "priority") {
        return Number(b.priority) - Number(a.priority); // HIGH(2) → MEDIUM(1) → LOW(0)
      }
      return 0;
    });

    return result;
  }, [todos, statusFilter, selectedCategoryId, priorityFilter, sortBy]);

  // 필터가 하나라도 적용되었는지 (빈 상태 메시지 구분용)
  const isFiltered =
    statusFilter !== "all" || selectedCategoryId !== null || priorityFilter !== "all";

  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id.toString() === selectedCategoryId)?.name
    : null;

  // SCR-04: Todo 추가 제출
  const handleAddTodo = async (formData) => {
    setShowAddModal(false);
    await addTodo(formData);
  };

  // SCR-05: Todo 편집 제출
  const handleEditTodo = async (formData) => {
    const todoId = editingTodo.id;
    setEditingTodo(null);
    await updateTodo(todoId, formData);
  };

  // SCR-06: Todo 삭제 확인
  const handleDeleteConfirm = async () => {
    const todoId = deletingTodo.id;
    setDeletingTodo(null);
    await deleteTodo(todoId);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* 사이드바 — 카테고리 필터 + 관리 버튼 */}
        <Sidebar
          categories={categories}
          todos={todos}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onManageCategories={() => setShowCatModal(true)}
        />

        {/* 메인 영역 */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* 헤더 행: 제목 + 추가 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedCategoryName ?? "전체 할 일"}
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={catsLoading || categories.length === 0}
              title={categories.length === 0 ? "먼저 카테고리를 추가하세요" : ""}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              + 새 할 일 추가
            </button>
          </div>

          {/* 필터 & 정렬 바 (SCR-03) */}
          <TodoFilter
            statusFilter={statusFilter}
            categoryFilter={selectedCategoryId}
            priorityFilter={priorityFilter}
            sortBy={sortBy}
            categories={categories}
            onStatusChange={setStatusFilter}
            onCategoryChange={setSelectedCategoryId}
            onPriorityChange={setPriorityFilter}
            onSortChange={setSortBy}
          />

          {/* Todo 목록 */}
          <TodoList
            todos={filteredTodos}
            categories={categories}
            loading={todosLoading}
            isFiltered={isFiltered}
            onToggle={(id) => toggleComplete(id)}
            onEdit={(todo) => setEditingTodo(todo)}
            onDelete={(todo) => setDeletingTodo(todo)}
          />

          <p className="text-xs text-amber-600 text-center mt-8">
            ⚠ 온체인 데이터는 공개됩니다. 민감정보 주의.
          </p>
        </main>
      </div>

      {/* SCR-04: Todo 추가 모달 */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          {categories.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📁</div>
              <p className="text-gray-600 font-semibold mb-2">카테고리가 없습니다.</p>
              <p className="text-sm text-gray-400 mb-6">
                할 일을 추가하려면 먼저 카테고리를 만들어야 합니다.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowCatModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  카테고리 만들기
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 text-sm px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <TodoForm
              categories={categories}
              onSubmit={handleAddTodo}
              onCancel={() => setShowAddModal(false)}
            />
          )}
        </Modal>
      )}

      {/* SCR-05: Todo 편집 모달 (기존 데이터 pre-fill) */}
      {editingTodo && (
        <Modal onClose={() => setEditingTodo(null)}>
          <TodoForm
            title="할 일 편집"
            categories={categories}
            initialData={editingTodo}
            onSubmit={handleEditTodo}
            onCancel={() => setEditingTodo(null)}
          />
        </Modal>
      )}

      {/* SCR-06: Todo 삭제 확인 모달 */}
      {deletingTodo && (
        <Modal onClose={() => setDeletingTodo(null)}>
          <DeleteConfirmDialog
            todo={deletingTodo}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingTodo(null)}
          />
        </Modal>
      )}

      {/* SCR-07: 카테고리 관리 모달 */}
      {showCatModal && (
        <Modal onClose={() => setShowCatModal(false)}>
          <CategoryManager
            categories={categories}
            todos={todos}
            onAdd={addCategory}
            onDelete={deleteCategory}
            onClose={() => setShowCatModal(false)}
          />
        </Modal>
      )}

      {/* SCR-08: 트랜잭션 진행 중 오버레이 — Todo 작업 */}
      <TxPending txState={todoTxState} onClose={clearTodoTxState} />

      {/* SCR-08: 트랜잭션 진행 중 오버레이 — 카테고리 작업 */}
      <TxPending txState={catTxState} onClose={clearCatTxState} />
    </div>
  );
}

export default function App() {
  const { isConnected, isWrongNetwork } = useWallet();

  if (!isConnected) return <LandingScreen />;
  if (isWrongNetwork) return <NetworkWarning />;
  return <MainScreen />;
}
