"use client";

import { useEffect, useState } from "react";

/**
 * Vista de projetor. Só código e contador. Os controles ficam no celular do
 * organizador, nunca no telão.
 */
export default function Telao({
  slug,
  code,
  count,
}: {
  slug: string;
  code: string | null;
  count: number;
}) {
  const [host, setHost] = useState("");
  useEffect(() => setHost(location.host), []);

  return (
    <div className="aurora flex min-h-dvh flex-col items-center justify-center px-8 py-12 text-center">
      <div className="relative z-10">
        <p className="text-[clamp(1rem,2.4vw,1.5rem)] text-muted">
          {code ? "Entre no lobby e concorra ao sorteio" : "Entre no lobby do evento"}
        </p>
        <p className="ink-grad mt-2 text-[clamp(1.5rem,4vw,2.6rem)] font-semibold tracking-tight">
          {host}/e/{slug}
        </p>

        <div className="mx-auto mt-10 grid h-[clamp(11rem,25vw,19rem)] w-[clamp(11rem,25vw,19rem)] place-items-center rounded-3xl bg-raised text-[13px] text-muted ring-1 ring-line">
          [ QR code ]
        </div>

        {code && (
          <div className="mt-12">
            <p className="text-[clamp(0.8rem,1.5vw,1.1rem)] uppercase tracking-[0.25em] text-muted">
              código de presença
            </p>
            <p className="ink-grad mt-3 font-mono text-[clamp(4rem,15vw,11rem)] font-bold leading-none tracking-[0.12em]">
              {code}
            </p>
          </div>
        )}

        <p className="mt-14 flex items-center justify-center gap-3 text-[clamp(1.2rem,2.8vw,2rem)] font-semibold tabular-nums">
          <span className="breathe inline-block h-2.5 w-2.5 rounded-full bg-good" />
          <span className="text-good">{count}</span>
          <span className="font-normal text-muted">
            {count === 1 ? "pessoa já entrou" : "pessoas já entraram"}
          </span>
        </p>
      </div>
    </div>
  );
}
