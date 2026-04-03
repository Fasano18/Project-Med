export function GlassPanel({ children, className = '', delay = 0, as: Comp = 'section', ...rest }) {
  const { style: restStyle, ...domRest } = rest;
  return (
    <Comp
      className={`glass-panel ${className}`.trim()}
      style={{ animationDelay: `${delay}ms`, ...restStyle }}
      {...domRest}
    >
      {children}
    </Comp>
  );
}
