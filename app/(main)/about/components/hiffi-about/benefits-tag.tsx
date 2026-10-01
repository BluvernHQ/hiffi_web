function WaveformIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none">
      <path d="M2 10V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8V15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 5V18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function BenefitsTag({
  label,
  variant,
  iconFirst = false,
}: {
  label: string;
  variant: "blue" | "orange";
  iconFirst?: boolean;
}) {
  return (
    <div className={`benefits-tag ${variant}`}>
      {iconFirst ? (
        <>
          <div className="benefits-tag-svg w-embed">
            <WaveformIcon />
          </div>
          <p className="body-medium-m overflow-s">{label}</p>
        </>
      ) : (
        <>
          <p className="body-medium-m overflow-s">{label}</p>
          <div className="benefits-tag-svg w-embed">
            <WaveformIcon />
          </div>
        </>
      )}
    </div>
  );
}
