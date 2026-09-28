import type { ButtonHTMLAttributes } from "react";
import Button from "@/components/ui/Button";

/** Legacy name kept while pages migrate; use `components/ui/Button` directly. */
export default function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="primary" {...props} type={props.type ?? "button"} />;
}
