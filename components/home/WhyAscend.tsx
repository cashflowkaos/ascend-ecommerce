import {
  FlaskConical,
  ShieldCheck,
  Microscope,
  FileText,
} from "lucide-react";

const items = [
  {
    icon: FlaskConical,
    title: "Research Grade",
    description:
      "Professional-grade chemical compounds presented with consistency and clarity.",
  },
  {
    icon: Microscope,
    title: "Quality Focused",
    description:
      "Each product is organized with detailed specifications and supporting information.",
  },
  {
    icon: ShieldCheck,
    title: "Professional Standards",
    description:
      "Built around quality, presentation, and dependable customer experience.",
  },
  {
    icon: FileText,
    title: "Documentation",
    description:
      "Supporting documentation is available where applicable.",
  },
];

export default function WhyAscend() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50 py-28">
      <div className="mx-auto max-w-[1400px] px-10">

        <div className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#D4A11E]">
            Why Ascend
          </p>

          <h2 className="mt-4 text-5xl font-light">
            Built Around Quality
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-neutral-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <Icon
                  size={34}
                  className="mb-6 text-[#D4A11E]"
                />

                <h3 className="mb-3 text-xl font-medium">
                  {item.title}
                </h3>

                <p className="leading-7 text-neutral-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}