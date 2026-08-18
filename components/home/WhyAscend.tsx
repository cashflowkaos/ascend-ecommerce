import {
  FlaskConical,
  ShieldCheck,
  Microscope,
  FileText,
} from "lucide-react";

const items = [
  {
    icon: FlaskConical,
    title: "Research Focused",
    description:
      "Research compounds presented with a consistent focus on quality and precision.",
  },
  {
    icon: Microscope,
    title: "Quality Standards",
    description:
      "A focused catalog built around consistency, clear specifications, and professional standards.",
  },
  {
    icon: ShieldCheck,
    title: "Consistency",
    description:
      "A consistent standard across product presentation, information, and the Ascend experience.",
  },
  {
    icon: FileText,
    title: "Documentation",
    description:
      "Supporting product information and documentation available where applicable.",
  },
];

export default function WhyAscend() {
  return (
    <section className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">

        <div className="mb-10 text-center sm:mb-14 lg:mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D4A11E] sm:tracking-[0.4em]">
            Why Ascend
          </p>

          <h2 className="mt-4 text-4xl font-light leading-tight tracking-tight text-neutral-950 sm:text-5xl">
            Built Around Quality
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">
            A focused approach to research compounds built around the standards
            that matter most.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[24px] border border-neutral-200 bg-white p-6 sm:p-7 lg:rounded-3xl lg:p-8"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50">
                  <Icon
                    size={25}
                    strokeWidth={1.7}
                    className="text-[#D4A11E]"
                  />
                </div>

                <h3 className="text-lg font-semibold text-neutral-950 sm:text-xl">
                  {item.title}
                </h3>

                <p className="mt-3 text-[15px] leading-7 text-neutral-600">
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
