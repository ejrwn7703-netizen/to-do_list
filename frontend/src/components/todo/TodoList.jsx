import TodoItem from "./TodoItem";

export default function TodoList({ todos, categories, loading, onToggle, onEdit, onDelete }) {
  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id.toString(), c.name])
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <div className="text-3xl animate-spin">⏳</div>
        <p className="text-gray-400 text-sm">블록체인에서 불러오는 중...</p>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-gray-600 font-semibold">아직 할 일이 없습니다.</p>
        <p className="text-gray-400 text-sm mt-1">
          + 새 할 일 추가 버튼으로 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id.toString()}
          todo={todo}
          categoryName={categoryMap[todo.categoryId.toString()] ?? "알 수 없음"}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
