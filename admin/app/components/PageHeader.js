"use client";

import { useLocale } from "./LocaleProvider";

export default function PageHeader({ title, titleKey, description, descriptionKey }) {
  const { t } = useLocale();
  const resolvedTitle = titleKey ? t(titleKey) : title;
  const resolvedDescription = descriptionKey ? t(descriptionKey) : description;

  return (
    <header className="page-header">
      <h1>{resolvedTitle}</h1>
      {resolvedDescription ? <p>{resolvedDescription}</p> : null}
    </header>
  );
}
