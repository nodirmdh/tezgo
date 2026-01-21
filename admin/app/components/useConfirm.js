"use client";

import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    description: "",
    onConfirm: null
  });

  const confirm = ({ title, description, onConfirm }) => {
    setState({
      open: true,
      title,
      description,
      onConfirm
    });
  };

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      onConfirm={() => {
        state.onConfirm?.();
        setState({ open: false, title: "", description: "", onConfirm: null });
      }}
      onCancel={() =>
        setState({ open: false, title: "", description: "", onConfirm: null })
      }
    />
  );

  return { confirm, dialog };
}
