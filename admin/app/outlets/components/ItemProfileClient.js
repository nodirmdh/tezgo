"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../../components/Toast";
import useConfirm from "../../components/useConfirm";
import { apiJson } from "../../../lib/api/client";
import { normalizeRole } from "../../../lib/rbac";
import { useLocale } from "../../components/LocaleProvider";

const deliveryOptions = [
  { value: "courier", labelKey: "outlets.menu.profile.delivery.courier" },
  { value: "pickup", labelKey: "outlets.menu.profile.delivery.pickup" }
];

const buildDraft = (item) => ({
  title: item?.title ?? "",
  shortTitle: item?.shortTitle ?? "",
  sku: item?.sku ?? "",
  category: item?.category ?? "",
  categoriesInput: Array.isArray(item?.categories) ? item.categories.join(", ") : "",
  description: item?.description ?? "",
  imageUrl: item?.imageUrl ?? "",
  imageEnabled: item?.imageEnabled ?? true,
  weightGrams: item?.weightGrams ?? "",
  priority: item?.priority ?? 0,
  isAdult: item?.isAdult ?? false,
  isVisible: item?.isVisible ?? true,
  basePrice: item?.basePrice ?? "",
  isAvailable: item?.isAvailable ?? true,
  stockQty: item?.stockQty ?? "",
  stoplistActive: item?.stoplistActive ?? false,
  stoplistReason: item?.stoplistReason ?? "",
  stoplistUntil: item?.stoplistUntil ?? "",
  unavailableReason: item?.unavailableReason ?? "",
  unavailableUntil: item?.unavailableUntil ?? "",
  deliveryMethods: Array.isArray(item?.deliveryMethods) ? item.deliveryMethods : [],
  kcal: item?.kcal ?? "",
  protein: item?.protein ?? "",
  fat: item?.fat ?? "",
  carbs: item?.carbs ?? "",
  coreId: item?.coreId ?? "",
  originId: item?.originId ?? ""
});

export default function ItemProfileClient({ outletId, itemId, initialItem }) {
  const router = useRouter();
  const { t } = useLocale();
  const [item, setItem] = useState(initialItem);
  const [draft, setDraft] = useState(buildDraft(initialItem));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [role, setRole] = useState("support");
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const stored = localStorage.getItem("adminAuth");
    if (!stored) {
      return;
    }
    const parsed = JSON.parse(stored);
    setRole(normalizeRole(parsed.role));
  }, []);

  useEffect(() => {
    setDraft(buildDraft(item));
  }, [item]);

  const canEditDetails = role === "admin";
  const canEditAvailability = role === "admin" || role === "operator";
  const canEditPrice = role === "admin";

  const deliverySet = useMemo(
    () => new Set(draft.deliveryMethods || []),
    [draft.deliveryMethods]
  );

  const loadItem = async () => {
    const result = await apiJson(`/api/outlets/${outletId}/items/${itemId}`);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setItem(result.data);
  };

  const handleSave = async () => {
    if (saving) return;

    const payload = {};
    if (canEditDetails) {
      payload.title = draft.title.trim();
      payload.shortTitle = draft.shortTitle.trim() || null;
      payload.sku = draft.sku.trim() || null;
      payload.category = draft.category.trim() || null;
      payload.categories = draft.categoriesInput
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      payload.description = draft.description.trim() || null;
      payload.imageUrl = draft.imageUrl.trim() || null;
      payload.imageEnabled = Boolean(draft.imageEnabled);
      payload.weightGrams = draft.weightGrams === "" ? null : Number(draft.weightGrams);
      payload.priority = draft.priority === "" ? null : Number(draft.priority);
      payload.isAdult = Boolean(draft.isAdult);
      payload.kcal = draft.kcal === "" ? null : Number(draft.kcal);
      payload.protein = draft.protein === "" ? null : Number(draft.protein);
      payload.fat = draft.fat === "" ? null : Number(draft.fat);
      payload.carbs = draft.carbs === "" ? null : Number(draft.carbs);
      payload.coreId = draft.coreId.trim() || null;
      payload.originId = draft.originId.trim() || null;
    }
    if (canEditPrice && draft.basePrice !== "") {
      payload.basePrice = Number(draft.basePrice);
    }
    if (canEditAvailability) {
      payload.isAvailable = Boolean(draft.isAvailable);
      payload.stockQty = draft.stockQty === "" ? null : Number(draft.stockQty);
      payload.isVisible = Boolean(draft.isVisible);
      payload.deliveryMethods = Array.from(deliverySet);
      payload.stoplistActive = Boolean(draft.stoplistActive);
      payload.stoplistReason = draft.stoplistReason.trim() || null;
      payload.stoplistUntil = draft.stoplistUntil || null;
      payload.unavailableReason = draft.unavailableReason.trim() || null;
      payload.unavailableUntil = draft.unavailableUntil || null;
    }

    setSaving(true);
    const result = await apiJson(
      `/api/outlets/${outletId}/items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      }
    );
    setSaving(false);
    if (!result.ok) {
      setToast({ type: "error", message: t(result.error) });
      return;
    }
    setItem(result.data);
    setToast({ type: "success", message: t("outlets.menu.profile.toasts.saved") });
  };

  const handleDuplicate = () => {
    confirm({
      title: t("outlets.menu.profile.actions.duplicateTitle"),
      description: t("outlets.menu.profile.actions.duplicateDescription"),
      onConfirm: async () => {
        const result = await apiJson(
          `/api/outlets/${outletId}/items/${itemId}/duplicate`,
          { method: "POST" }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.menu.profile.toasts.duplicated") });
        router.push(`/outlets/${outletId}/items/${result.data.itemId}`);
      }
    });
  };

  const handleCopyToOutlet = () => {
    confirm({
      title: t("outlets.menu.profile.actions.copyTitle"),
      description: t("outlets.menu.profile.actions.copyDescription"),
      onConfirm: async () => {
        const target = window.prompt(t("outlets.menu.profile.actions.copyPrompt"));
        if (!target) {
          return;
        }
        const targetId = Number(target);
        if (!targetId) {
          setToast({ type: "error", message: t("outlets.menu.profile.validation.targetOutlet") });
          return;
        }
        const result = await apiJson(
          `/api/outlets/${outletId}/items/${itemId}/copy-to-outlet`,
          {
            method: "POST",
            body: JSON.stringify({ target_outlet_id: targetId })
          }
        );
        if (!result.ok) {
          setToast({ type: "error", message: t(result.error) });
          return;
        }
        setToast({ type: "success", message: t("outlets.menu.profile.toasts.copied") });
      }
    });
  };

  return (
    <section className="card profile-card">
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
      {dialog}
      <div className="profile-header">
        <div>
          <div className="profile-eyebrow">{t("outlets.menu.profile.title")}</div>
          <div className="profile-title">{item.title}</div>
          <div className="helper-text">
            {t("outlets.menu.profile.fields.itemId")}: {item.itemId}
          </div>
        </div>
        <div className="profile-role">
          {item.activeCampaign ? (
            <span className="badge">{t("outlets.menu.sale")}</span>
          ) : null}
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.meta")}</div>
        <div className="profile-grid">
          <div>
            <div className="helper-text">{t("outlets.menu.profile.fields.outletId")}</div>
            <div>{item.outletId}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.menu.profile.fields.createdAt")}</div>
            <div>{item.createdAt || "-"}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.menu.profile.fields.updatedAt")}</div>
            <div>{item.updatedAt || "-"}</div>
          </div>
          <div>
            <div className="helper-text">{t("outlets.menu.profile.fields.outletUpdatedAt")}</div>
            <div>{item.outletUpdatedAt || "-"}</div>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.basic")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.title")}</label>
            <input
              className="input"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.shortTitle")}</label>
            <input
              className="input"
              value={draft.shortTitle}
              onChange={(event) => setDraft({ ...draft, shortTitle: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.category")}</label>
            <input
              className="input"
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.categories")}</label>
            <input
              className="input"
              value={draft.categoriesInput}
              onChange={(event) =>
                setDraft({ ...draft, categoriesInput: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.sku")}</label>
            <input
              className="input"
              value={draft.sku}
              onChange={(event) => setDraft({ ...draft, sku: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.priority")}</label>
            <input
              className="input"
              type="number"
              value={draft.priority}
              onChange={(event) =>
                setDraft({ ...draft, priority: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.description")}</label>
            <textarea
              className="textarea"
              value={draft.description}
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.media")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.imageUrl")}</label>
            <input
              className="input"
              value={draft.imageUrl}
              onChange={(event) =>
                setDraft({ ...draft, imageUrl: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.imageEnabled")}</label>
            <select
              className="select"
              value={draft.imageEnabled ? "1" : "0"}
              onChange={(event) =>
                setDraft({ ...draft, imageEnabled: event.target.value === "1" })
              }
              disabled={!canEditDetails}
            >
              <option value="1">{t("common.yes")}</option>
              <option value="0">{t("common.no")}</option>
            </select>
          </div>
        </div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.weight")}</label>
            <input
              className="input"
              type="number"
              value={draft.weightGrams}
              onChange={(event) =>
                setDraft({ ...draft, weightGrams: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.isAdult")}</label>
            <select
              className="select"
              value={draft.isAdult ? "1" : "0"}
              onChange={(event) =>
                setDraft({ ...draft, isAdult: event.target.value === "1" })
              }
              disabled={!canEditDetails}
            >
              <option value="0">{t("common.no")}</option>
              <option value="1">{t("common.yes")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.pricing")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.basePrice")}</label>
            <input
              className="input"
              type="number"
              value={draft.basePrice}
              onChange={(event) =>
                setDraft({ ...draft, basePrice: event.target.value })
              }
              disabled={!canEditPrice}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.currentPrice")}</label>
            <input className="input" value={item.currentPrice ?? ""} disabled />
          </div>
        </div>
        <div className="profile-grid">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.stockQty")}</label>
            <input
              className="input"
              type="number"
              value={draft.stockQty}
              onChange={(event) =>
                setDraft({ ...draft, stockQty: event.target.value })
              }
              disabled={!canEditAvailability}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.isAvailable")}</label>
            <select
              className="select"
              value={draft.isAvailable ? "1" : "0"}
              onChange={(event) =>
                setDraft({ ...draft, isAvailable: event.target.value === "1" })
              }
              disabled={!canEditAvailability}
            >
              <option value="1">{t("outlets.menu.filters.available")}</option>
              <option value="0">{t("outlets.menu.filters.unavailable")}</option>
            </select>
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.isVisible")}</label>
            <select
              className="select"
              value={draft.isVisible ? "1" : "0"}
              onChange={(event) =>
                setDraft({ ...draft, isVisible: event.target.value === "1" })
              }
              disabled={!canEditAvailability}
            >
              <option value="1">{t("common.yes")}</option>
              <option value="0">{t("common.no")}</option>
            </select>
          </div>
        </div>
        {!draft.stoplistActive ? (
          <div className="form-row two">
            <div className="auth-field">
              <label>{t("outlets.menu.profile.fields.unavailableReason")}</label>
              <input
                className="input"
                value={draft.unavailableReason}
                onChange={(event) =>
                  setDraft({ ...draft, unavailableReason: event.target.value })
                }
                disabled={!canEditAvailability}
              />
            </div>
            <div className="auth-field">
              <label>{t("outlets.menu.profile.fields.unavailableUntil")}</label>
              <input
                className="input"
                type="datetime-local"
                value={draft.unavailableUntil}
                onChange={(event) =>
                  setDraft({ ...draft, unavailableUntil: event.target.value })
                }
                disabled={!canEditAvailability}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.delivery")}</div>
        <div className="profile-grid">
          {deliveryOptions.map((option) => (
            <label key={option.value} className="checkbox">
              <input
                type="checkbox"
                checked={deliverySet.has(option.value)}
                onChange={(event) => {
                  const next = new Set(deliverySet);
                  if (event.target.checked) {
                    next.add(option.value);
                  } else {
                    next.delete(option.value);
                  }
                  setDraft({ ...draft, deliveryMethods: Array.from(next) });
                }}
                disabled={!canEditAvailability}
              />
              <span>{t(option.labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.stoplist")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.stoplistActive")}</label>
            <select
              className="select"
              value={draft.stoplistActive ? "1" : "0"}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  stoplistActive: event.target.value === "1",
                  isAvailable:
                    event.target.value === "1" ? false : draft.isAvailable
                })
              }
              disabled={!canEditAvailability}
            >
              <option value="0">{t("outlets.menu.profile.stoplist.off")}</option>
              <option value="1">{t("outlets.menu.profile.stoplist.on")}</option>
            </select>
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.stoplistUntil")}</label>
            <input
              className="input"
              type="datetime-local"
              value={draft.stoplistUntil}
              onChange={(event) =>
                setDraft({ ...draft, stoplistUntil: event.target.value })
              }
              disabled={!canEditAvailability || !draft.stoplistActive}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.stoplistReason")}</label>
            <textarea
              className="textarea"
              value={draft.stoplistReason}
              onChange={(event) =>
                setDraft({ ...draft, stoplistReason: event.target.value })
              }
              disabled={!canEditAvailability || !draft.stoplistActive}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.nutrition")}</div>
        <div className="profile-grid">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.kcal")}</label>
            <input
              className="input"
              type="number"
              value={draft.kcal}
              onChange={(event) => setDraft({ ...draft, kcal: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.protein")}</label>
            <input
              className="input"
              type="number"
              value={draft.protein}
              onChange={(event) =>
                setDraft({ ...draft, protein: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.fat")}</label>
            <input
              className="input"
              type="number"
              value={draft.fat}
              onChange={(event) => setDraft({ ...draft, fat: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.carbs")}</label>
            <input
              className="input"
              type="number"
              value={draft.carbs}
              onChange={(event) => setDraft({ ...draft, carbs: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.ids")}</div>
        <div className="form-row two">
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.coreId")}</label>
            <input
              className="input"
              value={draft.coreId}
              onChange={(event) => setDraft({ ...draft, coreId: event.target.value })}
              disabled={!canEditDetails}
            />
          </div>
          <div className="auth-field">
            <label>{t("outlets.menu.profile.fields.originId")}</label>
            <input
              className="input"
              value={draft.originId}
              onChange={(event) =>
                setDraft({ ...draft, originId: event.target.value })
              }
              disabled={!canEditDetails}
            />
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-title">{t("outlets.menu.profile.sections.actions")}</div>
        <div className="action-grid">
          <button className="button" type="button" onClick={handleSave} disabled={saving}>
            {t("common.save")}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={loadItem}
            disabled={saving}
          >
            {t("common.refresh")}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={handleDuplicate}
            disabled={!canEditDetails}
          >
            {t("outlets.menu.profile.actions.duplicate")}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={handleCopyToOutlet}
            disabled={!canEditDetails}
          >
            {t("outlets.menu.profile.actions.copyToOutlet")}
          </button>
          <button
            className="button ghost"
            type="button"
            onClick={() => router.back()}
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    </section>
  );
}
