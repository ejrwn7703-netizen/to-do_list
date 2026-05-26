// SCR-03 필터 & 정렬 바
// 상태 / 카테고리 / 우선순위 필터 + 정렬 드롭다운 (클라이언트 사이드 처리)
export default function TodoFilter({
  statusFilter,
  categoryFilter,
  priorityFilter,
  sortBy,
  categories,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
  onSortChange,
}) {
  const selectClass =
    "border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer";

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 상태 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">상태</span>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">전체</option>
            <option value="active">미완료</option>
            <option value="completed">완료</option>
          </select>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">카테고리</span>
          <select
            value={categoryFilter ?? ""}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className={selectClass}
          >
            <option value="">전체</option>
            {categories.map((cat) => (
              <option key={cat.id.toString()} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 우선순위 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">우선순위</span>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">전체</option>
            <option value="2">HIGH</option>
            <option value="1">MEDIUM</option>
            <option value="0">LOW</option>
          </select>
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500">정렬</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={selectClass}
          >
            <option value="createdAt">생성일 순</option>
            <option value="deadline">마감일 순</option>
            <option value="priority">우선순위 순</option>
          </select>
        </div>
      </div>
    </div>
  );
}
