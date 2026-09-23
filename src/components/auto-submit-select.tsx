"use client";

import { useRef } from "react";
import { Select } from "@/components/ui/input";

export function AutoSubmitSelect({
  name,
  defaultValue,
  children,
}: {
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => {
        formRef.current = e.currentTarget.form;
        formRef.current?.requestSubmit();
      }}
    >
      {children}
    </Select>
  );
}
