import { conditionCode } from "@/application/group-cards";

// Decorative print-edge wear, not a photograph of the physical listing.
// Fixed coordinates keep the texture stable across renders and card sizes.
export function CardWear({ condition }: { condition: string }) {
  const severity = ({ LP: 1, MP: 2, HP: 3, DMG: 4 } as Record<string, number>)[conditionCode(condition)] ?? 0;
  if (!severity) return null;
  const chips = Array.from({ length: 16 + severity * 18 }, (_, index) => {
    const edge = index % 4;
    const fraction = ((index * 137 + 41) % 977) / 1000;
    const length = 5 + ((index * 19) % 24) + severity * 3;
    const depth = 1.5 + ((index * 7) % 6) + severity * 2;
    const x = edge < 2 ? (edge === 0 ? 5 : 995) : 15 + fraction * 970;
    const y = edge < 2 ? 15 + fraction * 1370 : (edge === 2 ? 5 : 1395);
    const points = edge < 2
      ? `${x},${y} ${x + (edge === 0 ? depth : -depth)},${y + length * .3} ${x + (edge === 0 ? depth * .4 : -depth * .4)},${y + length * .65} ${x},${y + length}`
      : `${x},${y} ${x + length * .3},${y + (edge === 2 ? depth : -depth)} ${x + length * .7},${y + (edge === 2 ? depth * .5 : -depth * .5)} ${x + length},${y}`;
    return <polygon key={index} points={points} opacity={.35 + (index % 4) * .18} />;
  });
  return <svg className="card-wear" data-severity={severity} viewBox="0 0 1000 1400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <g fill="#e9e2ce" opacity={.45 + severity * .12}>{chips}</g>
    <g fill="none" stroke="#e9e2ce" strokeWidth={severity * 1.6} opacity={severity * .17}>
      <path d="M8 66 Q5 8 64 8 M936 8 Q992 8 992 66 M992 1334 Q992 1392 936 1392 M64 1392 Q8 1392 8 1334" />
      {severity >= 2 && <path d="M12 165 l5 56 -4 30 M989 843 l-4 82 3 38 M130 1387 l70 -3 45 2 M684 12 l49 4 32 -3" />}
      {severity >= 3 && <path d="M12 20 l42 48 M988 1380 l-54 -61 M979 39 l-28 31 M25 1337 l18 -23" />}
    </g>
    {severity === 4 && <g fill="none" stroke="#ece5d5" strokeWidth="3" opacity=".35"><path d="M8 1035 l32 -25 12 -31 43 -24 M990 275 l-41 24 -18 36 -36 19" /></g>}
  </svg>;
}
