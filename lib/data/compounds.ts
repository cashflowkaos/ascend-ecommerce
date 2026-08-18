export type LiteratureReference = {
  title: string;
  journal: string;
  year: number;
  type: string;
  url: string;
};

export type Compound = {
  id: string;
  slug: string;
  name: string;
  strength: string;
  category: string;
  image: string;
  featured: boolean;
  overview: string;
  composition?: string[];
  presentation: string;
  storage: string;
  literature?: LiteratureReference[];
};

export const compounds: Compound[] = [
  {
    id: "bpc157",
    slug: "bpc157",
    name: "BPC-157",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/bpc157.png",
    featured: false,
    overview:
      "BPC-157 is a synthetic 15-amino-acid peptide investigated primarily in preclinical experimental models. Published literature has examined its biological activity across multiple laboratory systems, while rigorous human clinical evidence remains limited.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "BPC-157 as an Investigational Peptide Therapeutic: Biopharmaceutical Challenges, Formulation Strategies, and Translational Development Barriers",
        journal: "Pharmaceutics",
        year: 2026,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/42198317/",
      },
    ],
  },
  {
    id: "cjc-ipa",
    slug: "cjc-ipa",
    name: "CJC + Ipamorelin",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/cjc.png",
    featured: false,
    overview:
      "CJC + Ipamorelin is a two-component research formulation containing CJC without DAC and Ipamorelin. The components are peptides studied in experimental research involving growth-hormone secretagogue and growth-hormone-releasing signaling pathways.",
    composition: [
      "CJC (No DAC) - 5 mg",
      "Ipamorelin - 5 mg",
    ],
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "The emerging landscape of performance-enhancing peptides modulating GH-IGF1 axis: bridging the gap between clinical evidence and patient self-administration",
        journal: "Frontiers in Endocrinology",
        year: 2026,
        type: "Scientific Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/42395176/",
      },
    ],
  },
  {
    id: "dsip",
    slug: "dsip",
    name: "DSIP",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/dsip.png",
    featured: false,
    overview:
      "Delta sleep-inducing peptide (DSIP) is a small peptide originally investigated in experimental sleep and neuroendocrine research. Its biological role remains incompletely characterized, and findings across the historical literature have not established a single definitive physiological function.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Delta sleep-inducing peptide (DSIP): a still unresolved riddle",
        journal: "Journal of Neurochemistry",
        year: 2006,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/16539679/",
      },
      {
        title: "Delta-sleep-inducing peptide (DSIP): a review",
        journal: "Neuroscience & Biobehavioral Reviews",
        year: 1984,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/6145137/",
      },
    ],
  },
  {
    id: "ghkcu",
    slug: "ghkcu",
    name: "GHK-Cu",
    strength: "50 mg",
    category: "Research Peptide",
    image: "/bottles/ghkcu.png",
    featured: false,
    overview:
      "GHK-Cu is the copper complex of the naturally occurring tripeptide glycyl-L-histidyl-L-lysine (GHK). It has been investigated in biochemical, cellular, and experimental models involving copper transport, gene expression, and tissue biology.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "The potential of GHK as an anti-aging peptide",
        journal: "Aging Pathobiology and Therapeutics",
        year: 2020,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/35083444/",
      },
    ],
  },
  {
    id: "glow",
    slug: "glow",
    name: "Glow Stack",
    strength: "70 mg",
    category: "Research Blend",
    image: "/bottles/Glow.png",
    featured: true,
    overview:
      "Glow Stack is a three-component research formulation containing GHK-Cu, BPC-157, and TB-500.",
    composition: [
      "GHK-Cu - 50 mg",
      "BPC-157 - 10 mg",
      "TB-500 - 10 mg",
    ],
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
  },
  {
    id: "glutathione",
    slug: "glutathione",
    name: "Glutathione",
    strength: "1500 mg",
    category: "Research Compound",
    image: "/bottles/gluta.png",
    featured: false,
    overview:
      "Glutathione is a naturally occurring tripeptide composed of glutamate, cysteine, and glycine. It is widely studied as a major intracellular thiol involved in cellular redox chemistry and biochemical antioxidant systems.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Mitochondrial Glutathione in Cellular Redox Homeostasis and Disease Manifestation",
        journal: "International Journal of Molecular Sciences",
        year: 2024,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/38279310/",
      },
      {
        title: "Glutathione metabolism and its implications for health",
        journal: "The Journal of Nutrition",
        year: 2004,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/14988435/",
      },
    ],
  },
  {
    id: "kisspeptin",
    slug: "kisspeptin",
    name: "Kisspeptin",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/kisspeptin.png",
    featured: false,
    overview:
      "Kisspeptins are peptide products of the KISS1 gene that signal through the KISS1 receptor, also known as GPR54. Kisspeptin signaling is extensively studied in neuroendocrine and reproductive-axis research, including both experimental and human investigations.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Kisspeptin across the human lifespan: evidence from animal studies and beyond",
        journal: "Journal of Endocrinology",
        year: 2016,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/27340201/",
      },
    ],
  },
  {
    id: "klow",
    slug: "klow",
    name: "KLOW Stack",
    strength: "80 mg",
    category: "Research Blend",
    image: "/bottles/klow.png",
    featured: true,
    overview:
      "KLOW Stack is a four-component research formulation containing GHK-Cu, KPV, BPC-157, and TB-500.",
    composition: [
      "GHK-Cu - 50 mg",
      "KPV - 10 mg",
      "BPC-157 - 10 mg",
      "TB-500 - 10 mg",
    ],
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
  },
  {
    id: "kpv",
    slug: "kpv",
    name: "KPV",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/kpv.png",
    featured: false,
    overview:
      "KPV is the tripeptide sequence Lys-Pro-Val derived from the C-terminal region of alpha-melanocyte-stimulating hormone. It has been investigated primarily in preclinical and cellular research examining peptide signaling and inflammatory pathways.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Are melanocortin peptides future therapeutics for cutaneous wound healing?",
        journal: "Experimental Dermatology",
        year: 2019,
        type: "Preclinical Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/30661264/",
      },
      {
        title: "Transdermal Iontophoretic Delivery of Lysine-Proline-Valine (KPV) Peptide Across Microporated Human Skin",
        journal: "Journal of Pharmaceutical Sciences",
        year: 2017,
        type: "Laboratory Study",
        url: "https://pubmed.ncbi.nlm.nih.gov/28343991/",
      },
    ],
  },
  {
    id: "motsc",
    slug: "motsc",
    name: "MOTS-C",
    strength: "20 mg",
    category: "Research Peptide",
    image: "/bottles/motsc.png",
    featured: true,
    overview:
      "MOTS-C is a 16-amino-acid mitochondrial-derived peptide encoded within the mitochondrial 12S rRNA region. Research has examined its role as a mitochondrial signaling molecule and its interactions with cellular metabolic and stress-response pathways.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "MOTS-c: A promising mitochondrial-derived peptide for therapeutic exploitation",
        journal: "Frontiers in Endocrinology",
        year: 2023,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/36761202/",
      },
      {
        title: "Mitochondria-derived peptide MOTS-c: effects and mechanisms related to stress, metabolism and aging",
        journal: "Journal of Translational Medicine",
        year: 2023,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/36670507/",
      },
    ],
  },
  {
    id: "nad",
    slug: "nad",
    name: "NAD+",
    strength: "500 mg",
    category: "Research Compound",
    image: "/bottles/nad.png",
    featured: false,
    overview:
      "Nicotinamide adenine dinucleotide (NAD+) is an essential cellular coenzyme involved in redox reactions, energy metabolism, and enzyme-mediated signaling. NAD+ biology is extensively studied across cellular metabolism, mitochondrial function, and biochemical regulation.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "NAD+ metabolism: pathophysiologic mechanisms and therapeutic potential",
        journal: "Signal Transduction and Targeted Therapy",
        year: 2020,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/33028824/",
      },
      {
        title: "Preclinical and clinical evidence of NAD+ precursors in health, disease, and ageing",
        journal: "Mechanisms of Ageing and Development",
        year: 2021,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/34517020/",
      },
    ],
  },
  {
    id: "selank",
    slug: "selank",
    name: "Selank",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/selank.png",
    featured: false,
    overview:
      "Selank is a synthetic heptapeptide investigated in experimental neurobiological research. Published studies have examined its interactions with molecular and signaling systems in nervous-system models, while its regulatory status and clinical use vary internationally.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Peptide-based Anxiolytics: The Molecular Aspects of Heptapeptide Selank Biological Activity",
        journal: "Current Medicinal Chemistry",
        year: 2018,
        type: "Experimental Study",
        url: "https://pubmed.ncbi.nlm.nih.gov/30255741/",
      },
    ],
  },
  {
    id: "semax",
    slug: "semax",
    name: "Semax",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/semax.png",
    featured: false,
    overview:
      "Semax is a synthetic peptide derived from a fragment of adrenocorticotropic hormone (ACTH). It has been investigated in experimental neurobiology and molecular-signaling research, with much of the published literature originating outside the United States.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Semax, an ACTH4-10 peptide analog with high affinity for copper(II) ion and protective ability against metal induced cell toxicity",
        journal: "Journal of Inorganic Biochemistry",
        year: 2015,
        type: "Laboratory Study",
        url: "https://pubmed.ncbi.nlm.nih.gov/25310602/",
      },
      {
        title: "Semax, a Synthetic Regulatory Peptide, Affects Copper-Induced Abeta Aggregation and Amyloid Formation in Artificial Membrane Models",
        journal: "International Journal of Molecular Sciences",
        year: 2022,
        type: "Laboratory Study",
        url: "https://pubmed.ncbi.nlm.nih.gov/35080861/",
      },
    ],
  },
  {
    id: "ss31",
    slug: "ss31",
    name: "SS-31",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/ss31.png",
    featured: false,
    overview:
      "SS-31, also known in the scientific literature as elamipretide, is a mitochondria-targeting tetrapeptide. Research has focused on its interaction with cardiolipin and the biology of the inner mitochondrial membrane in experimental and clinical research settings.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Elamipretide: A Review of Its Structure, Mechanism of Action, and Therapeutic Potential",
        journal: "International Journal of Molecular Sciences",
        year: 2025,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/39940712/",
      },
      {
        title: "First-in-class cardiolipin-protective compound as a therapeutic agent to restore mitochondrial bioenergetics",
        journal: "British Journal of Pharmacology",
        year: 2014,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/24117165/",
      },
    ],
  },
  {
    id: "tb500",
    slug: "tb500",
    name: "TB-500",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/tb500.png",
    featured: false,
    overview:
      "TB-500 is a synthetic peptide associated with the thymosin beta-4 research family. Published literature on TB-500 and full-length thymosin beta-4 should be distinguished carefully because they are not interchangeable research materials.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Safety and Efficacy of Approved and Unapproved Peptide Therapies for Musculoskeletal Injuries and Athletic Performance",
        journal: "Sports Medicine",
        year: 2026,
        type: "Scientific Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/41966639/",
      },
    ],
  },
  {
    id: "tesamorelin",
    slug: "tesamorelin",
    name: "Tesamorelin",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/tesamorelin.png",
    featured: true,
    overview:
      "Tesamorelin is a synthetic analogue of human growth-hormone-releasing hormone (GHRH). Unlike many investigational research peptides, tesamorelin has been evaluated extensively in controlled human clinical studies and has an established pharmaceutical research history.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Tesamorelin: a review of its use in the management of HIV-associated lipodystrophy",
        journal: "Drugs",
        year: 2011,
        type: "Clinical Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/21668043/",
      },
      {
        title: "Tesamorelin, a human growth hormone releasing factor analogue",
        journal: "Expert Opinion on Investigational Drugs",
        year: 2009,
        type: "Clinical Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/19243281/",
      },
    ],
  },
  {
    id: "thymosin-alpha-1",
    slug: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    strength: "10 mg",
    category: "Research Peptide",
    image: "/bottles/thymosin.png",
    featured: false,
    overview:
      "Thymosin Alpha-1 is a 28-amino-acid peptide originally derived from thymic peptide research and subsequently produced synthetically. It has an extensive experimental and clinical literature examining immune-system signaling and regulation.",
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
    literature: [
      {
        title: "Thymosin alpha 1: A comprehensive review of the literature",
        journal: "World Journal of Virology",
        year: 2020,
        type: "Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/33362999/",
      },
      {
        title: "Thymosin alpha 1: past clinical experience and future promise",
        journal: "Annals of the New York Academy of Sciences",
        year: 2010,
        type: "Clinical Review",
        url: "https://pubmed.ncbi.nlm.nih.gov/20536460/",
      },
    ],
  },
  {
    id: "wolverine",
    slug: "wolverine",
    name: "Wolverine Stack",
    strength: "20 mg",
    category: "Research Blend",
    image: "/bottles/wolverine.png",
    featured: true,
    overview:
      "Wolverine Stack is a two-component research formulation containing BPC-157 and TB-500.",
    composition: [
      "BPC-157 - 10 mg",
      "TB-500 - 10 mg",
    ],
    presentation: "Lyophilized Powder",
    storage: "Store refrigerated. Protect from light.",
  },
];

