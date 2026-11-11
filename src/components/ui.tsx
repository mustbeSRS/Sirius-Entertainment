"use client";
import {
  useEffect,
  useRef,
  useId,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="studio-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  let attached = false;
  function attach(node: React.ReactNode): React.ReactNode {
    if (!isValidElement<Record<string, unknown>>(node)) return node;
    if (
      !attached &&
      typeof node.type === "string" &&
      ["input", "textarea", "select"].includes(node.type)
    ) {
      attached = true;
      return cloneElement(node, { id });
    }
    if (node.props.children)
      return cloneElement(
        node,
        {},
        Children.map(node.props.children as React.ReactNode, attach),
      );
    return node;
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {Children.map(children, attach)}
    </div>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-content">
      <span className="empty-symbol">✧</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
export const tags = (text: string) =>
  text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 30);
