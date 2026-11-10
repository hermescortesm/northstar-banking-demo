export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em] max-[720px]:text-[22px]">{title}</h1>
      <p className="mt-1 text-text-3">{description}</p>
    </header>
  );
}
