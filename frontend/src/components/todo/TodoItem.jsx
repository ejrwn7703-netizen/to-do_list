import { PRIORITY_LABEL, PRIORITY_COLOR, formatDeadline, deadlineDday } from "../../utils/format";

export default function TodoItem({ todo, categoryName, onToggle, onEdit, onDelete }) {
  const priority = Number(todo.priority);
  const deadlineStr = formatDeadline(todo.deadline);
  const dday = deadlineDday(todo.deadline);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-4 transition-opacity ${
        todo.isCompleted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 완료 토글 체크박스 */}
        <button
          onClick={() => onToggle?.(todo.id)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
            todo.isCompleted
              ? "bg-indigo-600 border-indigo-600"
              : "border-gray-300 hover:border-indigo-400"
          }`}
          aria-label={todo.isCompleted ? "완료 취소" : "완료로 표시"}
        >
          {todo.isCompleted && (
            <span className="text-white text-xs font-bold leading-none">✓</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* 우선순위 배지 + D-day 배지 */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[priority]}`}
            >
              {PRIORITY_LABEL[priority]}
            </span>
            {dday && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  dday.startsWith("D+")
                    ? "bg-red-100 text-red-600"   // 마감 지남
                    : dday === "D-day"
                    ? "bg-orange-100 text-orange-600"  // 오늘
                    : "bg-blue-100 text-blue-600"      // 미래
                }`}
              >
                {dday}
              </span>
            )}
          </div>

          {/* 제목 — 완료 시 취소선 */}
          <p
            className={`font-semibold text-gray-800 ${
              todo.isCompleted ? "line-through text-gray-400" : ""
            }`}
          >
            {todo.title}
          </p>

          {/* 카테고리 + 마감일 */}
          <div className="flex gap-3 mt-1 text-xs text-gray-400">
            <span>📁 {categoryName}</span>
            {deadlineStr && <span>🗓 {deadlineStr}</span>}
          </div>

          {/* 설명 */}
          {todo.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{todo.description}</p>
          )}
        </div>

        {/* 편집 / 삭제 버튼 */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit?.(todo)}
            className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
          >
            편집
          </button>
          <button
            onClick={() => onDelete?.(todo)}
            className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
