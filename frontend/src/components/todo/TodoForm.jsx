import { useState, useEffect } from "react";

const PRIORITY_OPTIONS = [
  { value: 0, label: "LOW" },
  { value: 1, label: "MEDIUM" },
  { value: 2, label: "HIGH" },
];

const todayStr = () => new Date().toISOString().split("T")[0];

export default function TodoForm({ categories, onSubmit, onCancel, initialData, title: formTitle }) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId?.toString() ?? categories[0]?.id?.toString() ?? ""
  );
  const [priority, setPriority] = useState(initialData?.priority ?? 1);
  const [deadline, setDeadline] = useState(
    initialData?.deadline && initialData.deadline !== 0n
      ? new Date(Number(initialData.deadline) * 1000).toISOString().split("T")[0]
      : ""
  );
  const [errors, setErrors] = useState({});

  // 카테고리 목록이 늦게 로드될 때 초기값 설정
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id.toString());
    }
  }, [categories, categoryId]);

  const byteLen = (str) => new TextEncoder().encode(str).length;

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = "제목을 입력해주세요.";
    } else if (byteLen(title) > 100) {
      errs.title = "제목이 너무 깁니다 (최대 100바이트, 한글 약 33자).";
    }
    if (byteLen(description) > 500) {
      errs.description = "설명이 너무 깁니다 (최대 500바이트).";
    }
    if (!categoryId) {
      errs.category = "카테고리를 선택해주세요.";
    }
    if (deadline) {
      const ts = Math.floor(new Date(deadline + "T23:59:59").getTime() / 1000);
      if (ts <= Math.floor(Date.now() / 1000)) {
        errs.deadline = "마감일은 오늘 이후 날짜여야 합니다.";
      }
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const deadlineTs = deadline
      ? Math.floor(new Date(deadline + "T23:59:59").getTime() / 1000)
      : 0;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      priority: Number(priority),
      deadline: deadlineTs,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">
          {formTitle ?? "새 할 일 추가"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 제목을 입력하세요 (최대 100자)"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              errors.title ? "border-red-400" : "border-gray-300"
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.title ? (
              <p className="text-xs text-red-500">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">{byteLen(title)}/100B</span>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="상세 내용 (최대 500자)"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${
              errors.description ? "border-red-400" : "border-gray-300"
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">{byteLen(description)}/500B</span>
          </div>
        </div>

        {/* 카테고리 + 우선순위 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                errors.category ? "border-red-400" : "border-gray-300"
              }`}
            >
              {categories.map((c) => (
                <option key={c.id.toString()} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우선순위 <span className="text-red-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 마감일 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            마감일 (선택)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={todayStr()}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              errors.deadline ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.deadline && (
            <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
          )}
        </div>

        {/* 온체인 경고 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <p className="text-xs text-amber-700">
            ⚠ 입력 내용은 블록체인에 공개 저장됩니다.
          </p>
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
        >
          {formTitle === "할 일 편집" ? "저장하기 🔗" : "등록하기 🔗"}
        </button>
      </div>
    </form>
  );
}
