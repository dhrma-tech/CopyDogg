/** Shared mark for every generated app icon: ink square, cream serif "C". */
export function appIconElement(size: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1B1C14",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize: Math.round(size * 0.58),
          color: "#FFFDF5",
          lineHeight: 1,
          transform: `translateY(${Math.round(size * 0.03)}px)`,
        }}
      >
        C
      </span>
    </div>
  );
}
