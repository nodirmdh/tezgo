"use client";

import { useLocale } from "./LocaleProvider";

export default function Toolbar({
  title,
  titleKey,
  actionLabel,
  actionLabelKey = "common.add",
  children
}) {
  const { t } = useLocale();
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedActionLabel = actionLabelKey ? t(actionLabelKey) : actionLabel;

  return (
    <div className="toolbar">
      <div className="toolbar-title">{resolvedTitle}</div>
      <div className="toolbar-actions">
        {children}
        {actionLabel === null ? null : (
          <button className="button" type="button">
            {actionLabel || resolvedActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
