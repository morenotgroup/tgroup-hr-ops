import * as React from "react";

type ElementTag = keyof JSX.IntrinsicElements;

type GlassProps<T extends ElementTag = "div"> = {
  as?: T;
  className?: string;
  pressable?: boolean;
  soft?: boolean;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

export default function Glass<T extends ElementTag = "div">(props: GlassProps<T>) {
  const { as, className = "", pressable, soft, children, ...rest } = props;
  const Comp = (as || "div") as any;
  const cls = ["glass", pressable ? "glass-pressable" : "", soft ? "glass-soft" : "", className]
    .filter(Boolean).join(" ");
  return <Comp className={cls} {...rest}>{children}</Comp>;
}
