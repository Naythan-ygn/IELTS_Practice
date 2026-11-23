"use client";
import type { Visual } from "@/lib/strategy-types";
export function StrategyVisual({ visual: v }: { visual: Visual }) {
  if (v.kind === "plan")
    return (
      <figure className="strategy-visual">
        <figcaption>{v.title}</figcaption>
        <svg
          viewBox="0 0 360 240"
          role="img"
          aria-label={(v.labels || []).join(", ")}
          style={{ width: "100%", background: "var(--bg)", borderRadius: 8 }}
        >
          <text x="175" y="24" fill="currentColor" fontSize="14">
            North ↑
          </text>
          <path d="M180 215V85" stroke="#7f9cc6" strokeWidth="5" />
          <rect x="125" y="110" width="110" height="40" fill="#d7e5ff" />
          <text x="136" y="135" fill="#243c61" fontSize="14">
            {v.labels?.[1]}
          </text>
          <rect x="246" y="45" width="100" height="48" fill="#b5d3fa" />
          <text x="255" y="75" fill="#243c61" fontSize="14">
            {v.labels?.[2]}
          </text>
          <text x="136" y="232" fill="currentColor" fontSize="14">
            {v.labels?.[0]}
          </text>
          {v.labels?.[3] && (
            <>
              <rect x="15" y="110" width="95" height="40" fill="#b5d3fa" />
              <text x="23" y="135" fill="#243c61" fontSize="14">
                {v.labels[3]}
              </text>
            </>
          )}
        </svg>
      </figure>
    );
  if (v.kind === "diagram")
    return (
      <figure className="strategy-visual">
        <figcaption>{v.title}</figcaption>
        <ol className="process-diagram">
          {v.labels?.map((label, i) => (
            <li key={i}>
              {label}
              {i < (v.labels?.length || 0) - 1 && <b aria-hidden="true">↓</b>}
            </li>
          ))}
        </ol>
      </figure>
    );
  if (v.kind === "process")
    return (
      <figure className="strategy-visual">
        <figcaption>{v.title}</figcaption>
        <ol className="process-diagram">
          {(v.labels || []).map((label, i) => (
            <li key={label}>
              <span>{i + 1}</span>
              {label}
              {i < (v.labels?.length || 0) - 1 && <b aria-hidden="true">↓</b>}
            </li>
          ))}
        </ol>
      </figure>
    );
  if (v.kind === "map")
    return (
      <figure className="strategy-visual">
        <figcaption>{v.title}</figcaption>
        <div className="map-comparison">
          {["Before", "After"].map((period, i) => (
            <div key={period}>
              <strong>{period} · North ↑</strong>
              <div className="map-plan">
                <span>Entrance</span>
                <span>{i ? "Expanded reading room" : "Reading room"}</span>
                <span>{i ? "Study room" : "Storage"}</span>
              </div>
            </div>
          ))}
        </div>
        <p>
          Entrance unchanged. Reading area expanded. Storage converted to study
          space.
        </p>
      </figure>
    );
  if (v.kind === "pie") {
    const total = v.rows.reduce((n, r) => n + r.after, 0);
    let sum = 0;
    const colours = ["#1659fc", "#9271de", "#40b6a4"];
    return (
      <figure className="strategy-visual">
        <figcaption>{v.title}</figcaption>
        <div className="pie-layout">
          <div
            className="pie-diagram"
            role="img"
            aria-label={v.rows.map((r) => `${r.label} ${r.after}%`).join(", ")}
            style={{
              background: `conic-gradient(${v.rows
                .map((r, i) => {
                  const start = sum;
                  sum += (r.after / total) * 100;
                  return `${colours[i % 3]} ${start}% ${sum}%`;
                })
                .join(",")})`,
            }}
          />
          <div>
            {v.rows.map((r, i) => (
              <p key={r.label}>
                <i style={{ background: colours[i % 3] }} />
                {r.label}: {r.before}% → {r.after}%
              </p>
            ))}
          </div>
        </div>
      </figure>
    );
  }
  return (
    <figure className="strategy-visual">
      <figcaption>{v.title}</figcaption>
      {v.kind === "line" && (
        <svg
          viewBox="0 0 390 245"
          role="img"
          aria-label="Line graph comparing the first and second periods. Exact figures are in the table below."
          style={{ width: "100%", color: "var(--muted)" }}
        >
          <path d="M65 25V195H335" fill="none" stroke="#9caecc" />
          <text x="65" y="220" fill="currentColor" fontSize="12">
            First period
          </text>
          <text x="265" y="220" fill="currentColor" fontSize="12">
            Second period
          </text>
          {v.rows.map((r, i) => {
            const max = Math.max(
                ...v.rows.flatMap((r) => [r.before, r.after]),
                1,
              ),
              y1 = 185 - (r.before / max) * 145,
              y2 = 185 - (r.after / max) * 145,
              c = ["#1659fc", "#9271de", "#269b8e"][i % 3];
            return (
              <g key={r.label}>
                <path
                  d={`M85 ${y1}L300 ${y2}`}
                  fill="none"
                  stroke={c}
                  strokeWidth="3"
                />
                <circle cx="85" cy={y1} r="4" fill={c} />
                <circle cx="300" cy={y2} r="4" fill={c} />
                <text x="95" y={y1 - 7} fill={c} fontSize="11">
                  {r.label}: {r.before}
                </text>
                <text x="310" y={y2 + 4} fill={c} fontSize="12">
                  {r.after}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {v.kind !== "table" && v.kind !== "line" && (
        <div
          className="mini-bars"
          role="img"
          aria-label="Compare the first and second periods; exact values are in the table."
        >
          {v.rows.map((r) => {
            const max = Math.max(
              ...v.rows.flatMap((x) => [x.before, x.after]),
              1,
            );
            return (
              <div key={r.label}>
                <span>{r.label}</span>
                <div>
                  <i style={{ width: `${(r.before / max) * 100}%` }} />
                  <b style={{ width: `${(r.after / max) * 100}%` }} />
                </div>
                <small>
                  {r.before} → {r.after}
                </small>
              </div>
            );
          })}
          <p>Light blue: first period · Blue: second period</p>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>First period</th>
              <th>Second period</th>
            </tr>
          </thead>
          <tbody>
            {v.rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.before}</td>
                <td>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
