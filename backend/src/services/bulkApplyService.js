export const applyPreviewChanges = ({ db, preview, reason, actorId, nowIso, logAudit }) => {
  const errors = [];
  let successCount = 0;

  const updateMenuStmt = db.prepare(
    `UPDATE outlet_items
     SET base_price = @base_price,
         is_available = @is_available,
         stock = @stock,
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id AND item_id = @item_id`
  );
  const updateStockStmt = db.prepare(
    `UPDATE outlet_items
     SET stock = @stock,
         updated_at = @updated_at
     WHERE outlet_id = @outlet_id AND item_id = @item_id`
  );
  const insertPriceHistoryStmt = db.prepare(
    `INSERT INTO outlet_item_price_history
     (outlet_id, item_id, old_price, new_price, changed_by_user_id, reason)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const upsertCampaignItemStmt = db.prepare(
    `INSERT INTO outlet_campaign_items (campaign_id, item_id, discount_type, discount_value)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(campaign_id, item_id)
     DO UPDATE SET discount_type = excluded.discount_type, discount_value = excluded.discount_value`
  );

  const perform = db.transaction(() => {
    preview.rows.forEach((row) => {
      if (row.status === "ERROR") {
        errors.push({ rowNumber: row.rowNumber, message: row.message || "Invalid row" });
        return;
      }

      if (preview.type === "menuPricesAvailability") {
        const current = db
          .prepare(
            "SELECT base_price, is_available, stock FROM outlet_items WHERE outlet_id = ? AND item_id = ?"
          )
          .get(row.outletId, row.itemId);
        if (!current) {
          errors.push({ rowNumber: row.rowNumber, message: "Item not found" });
          return;
        }
        updateMenuStmt.run({
          outlet_id: row.outletId,
          item_id: row.itemId,
          base_price: row.new.base_price,
          is_available: row.new.is_available ? 1 : 0,
          stock: row.new.stock,
          updated_at: nowIso()
        });

        if (Number(current.base_price) !== Number(row.new.base_price)) {
          insertPriceHistoryStmt.run(
            row.outletId,
            row.itemId,
            current.base_price,
            row.new.base_price,
            actorId,
            reason
          );
        }

        logAudit({
          entity_type: "outlet_item",
          entity_id: `${row.outletId}:${row.itemId}`,
          action: "csv_menu_update",
          actor_id: actorId,
          before: {
            base_price: current.base_price,
            is_available: current.is_available,
            stock: current.stock
          },
          after: {
            base_price: row.new.base_price,
            is_available: row.new.is_available,
            stock: row.new.stock,
            reason
          }
        });
        successCount += 1;
        return;
      }

      if (preview.type === "menuStock") {
        const current = db
          .prepare(
            "SELECT stock FROM outlet_items WHERE outlet_id = ? AND item_id = ?"
          )
          .get(row.outletId, row.itemId);
        if (!current) {
          errors.push({ rowNumber: row.rowNumber, message: "Item not found" });
          return;
        }
        updateStockStmt.run({
          outlet_id: row.outletId,
          item_id: row.itemId,
          stock: row.new.stock,
          updated_at: nowIso()
        });
        logAudit({
          entity_type: "outlet_item",
          entity_id: `${row.outletId}:${row.itemId}`,
          action: "csv_menu_stock_update",
          actor_id: actorId,
          before: { stock: current.stock },
          after: { stock: row.new.stock, reason }
        });
        successCount += 1;
        return;
      }

      if (preview.type === "campaignDiscounts") {
        upsertCampaignItemStmt.run(
          row.campaignId,
          row.itemId,
          row.new.discount_type,
          row.new.discount_value
        );
        logAudit({
          entity_type: "campaign_item",
          entity_id: `${row.campaignId}:${row.itemId}`,
          action: "csv_campaign_discount_update",
          actor_id: actorId,
          before: row.old,
          after: { ...row.new, reason }
        });
        successCount += 1;
      }
    });
  });

  perform();

  return {
    successCount,
    errorCount: errors.length,
    errors: errors.length ? errors : undefined
  };
};
