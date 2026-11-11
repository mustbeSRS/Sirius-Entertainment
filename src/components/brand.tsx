import Image from "next/image";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="SIRIUS Writers Studio home">
      <Image
        src="/brand/sirius-entertainment.png"
        alt="SIRIUS Entertainment"
        width={580}
        height={360}
        className="brand-logo"
        loading="eager"
      />
      <span className="brand-product">Writers Studio</span>
    </a>
  );
}
