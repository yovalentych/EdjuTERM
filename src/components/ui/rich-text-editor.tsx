"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type Quill from "quill";

type RichTextEditorProps = {
  name?: string;
  defaultValue?: string | null;
  placeholder?: string;
  minHeight?: number;
  ariaLabel?: string;
  onChange?: (value: string) => void;
};

const toolbarOptions = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  ["link"],
  ["clean"],
];

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder,
  minHeight = 220,
  ariaLabel,
  onChange,
}: RichTextEditorProps) {
  const editorEl = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValue = useRef(defaultValue ?? "");
  const [plainText, setPlainText] = useState(defaultValue ?? "");

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let mounted = true;

    async function setupEditor() {
      if (!editorEl.current || quillRef.current) return;

      const QuillModule = await import("quill");
      if (!mounted || !editorEl.current) return;

      const editor = new QuillModule.default(editorEl.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: toolbarOptions,
          history: {
            delay: 700,
            maxStack: 120,
            userOnly: true,
          },
        },
      });

      if (initialValue.current) {
        editor.setText(initialValue.current);
      }

      const syncPlainText = () => {
        const text = editor.getText().replace(/\n$/, "");
        setPlainText(text);
        onChangeRef.current?.(text);
      };

      editor.on("text-change", syncPlainText);
      syncPlainText();
      quillRef.current = editor;
    }

    void setupEditor();

    return () => {
      mounted = false;
      quillRef.current = null;
    };
  }, [placeholder]);

  return (
    <div className="rich-text-editor" style={{ "--rich-text-min-height": `${minHeight}px` } as CSSProperties}>
      <div ref={editorEl} aria-label={ariaLabel ?? name} />
      {name ? <textarea name={name} value={plainText} readOnly hidden /> : null}
    </div>
  );
}
