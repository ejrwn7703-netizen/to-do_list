export default function Sidebar({ categories, todos, selectedCategoryId, onSelectCategory }) {
  const countByCategory = {};
  todos.forEach((todo) => {
    const id = todo.categoryId.toString();
    countByCategory[id] = (countByCategory[id] ?? 0) + 1;
  });

  return (
    <aside className="w-56 bg-white border-r border-gray-200 p-4 flex flex-col gap-1 shrink-0">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        카테고리
      </h3>

      <button
        onClick={() => onSelectCategory(null)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          selectedCategoryId === null
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <span>전체</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {todos.length}
        </span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id.toString()}
          onClick={() => onSelectCategory(cat.id.toString())}
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategoryId === cat.id.toString()
              ? "bg-indigo-50 text-indigo-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span className="truncate">{cat.name}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-2 shrink-0">
            {countByCategory[cat.id.toString()] ?? 0}
          </span>
        </button>
      ))}

      {categories.length === 0 && (
        <p className="text-xs text-gray-400 px-3 py-2">카테고리 없음</p>
      )}
    </aside>
  );
}
