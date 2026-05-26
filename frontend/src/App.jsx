import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { useTodos } from "./hooks/useTodos";
import { useCategories } from "./hooks/useCategories";
import NetworkWarning from "./components/common/NetworkWarning";
import Modal from "./components/common/Modal";
import TxPending from "./components/common/TxPending";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import TodoList from "./components/todo/TodoList";
import TodoForm from "./components/todo/TodoForm";

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

// SCR-03: 메인 — Todo 목록 화면 + SCR-04 추가 모달
function MainScreen() {
  const { todos, loading: todosLoading, txState, clearTxState, addTodo } = useTodos();
  const { categories, loading: catsLoading } = useCategories();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const filteredTodos = selectedCategoryId
    ? todos.filter((t) => t.categoryId.toString() === selectedCategoryId)
    : todos;

  const handleAddTodo = async (formData) => {
    setShowAddModal(false);
    await addTodo(formData);
  };

  const selectedCategoryName = selectedCategoryId
    ? categories.find((c) => c.id.toString() === selectedCategoryId)?.name
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 65px)" }}>
        {/* 사이드바 */}
        <Sidebar
          categories={categories}
          todos={todos}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {/* 메인 영역 */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedCategoryName ?? "전체 할 일"}
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={catsLoading || categories.length === 0}
              title={categories.length === 0 ? "먼저 카테고리를 추가하세요" : ""}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              + 새 할 일 추가
            </button>
          </div>

          <TodoList
            todos={filteredTodos}
            categories={categories}
            loading={todosLoading}
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
              <p className="text-gray-500 mb-4">카테고리가 없습니다.</p>
              <p className="text-sm text-gray-400 mb-4">
                Phase 6에서 카테고리 추가 기능이 구현됩니다.
              </p>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-indigo-600 font-medium"
              >
                닫기
              </button>
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

      {/* SCR-08: 트랜잭션 진행 중 오버레이 */}
      <TxPending txState={txState} onClose={clearTxState} />
    </div>
  );
}

export default function App() {
  const { isConnected, isWrongNetwork } = useWallet();

  if (!isConnected) return <LandingScreen />;
  if (isWrongNetwork) return <NetworkWarning />;
  return <MainScreen />;
}
