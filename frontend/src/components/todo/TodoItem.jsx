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
        {/* 체크박스 — Phase 6에서 toggleComplete 연결 */}
        <button
          onClick={() => onToggle?.(todo.id)}
          className="mt-1 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center shrink-0 hover:border-indigo-400 transition-colors"
          aria-label="완료 토글"
        >
          {todo.isCompleted && (
            <span className="text-indigo-600 text-xs font-bold">✓</span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* 배지 row */}
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
                    ? "bg-red-100 text-red-600"
                    : dday === "D-day"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {dday}
              </span>
            )}
          </div>

          {/* 제목 */}
          <p
            className={`font-semibold text-gray-800 ${
              todo.isCompleted ? "line-through text-gray-400" : ""
            }`}
          >
            {todo.title}
          </p>

          {/* 메타 정보 */}
          <div className="flex gap-3 mt-1 text-xs text-gray-400">
            <span>📁 {categoryName}</span>
            {deadlineStr && <span>🗓 {deadlineStr}</span>}
          </div>

          {/* 설명 */}
          {todo.description && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{todo.description}</p>
          )}
        </div>

        {/* 액션 버튼 — Phase 6에서 연결 */}
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
