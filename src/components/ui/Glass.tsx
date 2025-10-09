import React from "react";

type Props = React.PropsWithChildren<{
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  pressable?: boolean;
  soft?: boolean;
}>;

export default function Glass({ children, className = "", as = "div", pressable, soft }: Props) {
  const Comp: any = as;
  const cls = [
    "glass",
    pressable ? "glass-pressable" : "",
    soft ? "glass-soft" : "",
    className
  ].join(" ");
  return <Comp className={cls}>{children}</Comp>;
}
