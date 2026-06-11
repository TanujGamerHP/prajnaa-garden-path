import { Link } from "@tanstack/react-router";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Farmer story" | "Recipe" | "Journal" | "Field notes";
  author: string;
  date: string;
  readMinutes: number;
  image: string;
  body: string[];
};

import heroImg from "@/assets/hero.jpg";
import farmer1 from "@/assets/farmer-1.jpg";
import farmer2 from "@/assets/farmer-2.jpg";
import farmer3 from "@/assets/farmer-3.jpg";
import farmer4 from "@/assets/farmer-4.jpg";
import prodTurmeric from "@/assets/prod-turmeric.jpg";
import prodPickle from "@/assets/prod-pickle.jpg";
import prodAlmonds from "@/assets/prod-almonds.jpg";

export const posts: BlogPost[] = [
  {
    slug: "the-himalayan-apricot-harvest",
    title: "The Himalayan apricot harvest, in 9 photos",
    excerpt:
      "Each summer, the Hunza valley turns gold. We followed Ramesh Singh for a week as his family brings in the year's harvest.",
    category: "Farmer story",
    author: "Aanya Iyer",
    date: "2026-05-18",
    readMinutes: 6,
    image: heroImg,
    body: [
      "The road from Leh to Hunza climbs through ten thousand feet of cold rock and silence. Then, without warning, a valley opens — and it is the colour of butter.",
      "Ramesh Singh has been farming apricots on this slope for thirty-one years. His father did before him. His son will, if the glacier holds.",
      "We arrived on the third day of the harvest, when the trees are heaviest and the family works from before sunrise. Apricots are gathered by hand, sorted on cotton sheets in the courtyard, and laid out to dry on the flat slate roofs that catch the high-altitude sun.",
      "The dry mountain air does the rest. There is no sulphur, no machine, no shortcut. Ten days later, what you eat is the same fruit, only smaller and sweeter and the colour of old gold.",
    ],
  },
  {
    slug: "five-ways-to-cook-with-turmeric",
    title: "Five gentle ways to cook with single-origin turmeric",
    excerpt:
      "A spice this fragrant deserves more than dal. Five quick ideas from our test kitchen, each ready in 15 minutes.",
    category: "Recipe",
    author: "Meera Bhatt",
    date: "2026-05-02",
    readMinutes: 4,
    image: prodTurmeric,
    body: [
      "Most of us cook with turmeric out of duty — a teaspoon into the oil at the start, almost on autopilot. But single-origin turmeric, freshly milled, deserves attention.",
      "Here are five quick ways to let it sing without losing its softness.",
      "1. Bloom it in ghee for thirty seconds before adding garlic. 2. Stir a pinch into warm milk with a thread of saffron and a knot of crushed cardamom. 3. Whisk into yogurt with lemon zest and salt for a five-minute marinade. 4. Toast with cumin seeds and sprinkle over roasted carrots. 5. Steep with ginger and black pepper for an evening tea.",
    ],
  },
  {
    slug: "why-we-publish-batch-codes",
    title: "Why every Prajnaa pack carries a batch code",
    excerpt:
      "A small string of letters and numbers, but it is the most important thing on the label. Here is what it means.",
    category: "Journal",
    author: "Karan Mehra",
    date: "2026-04-21",
    readMinutes: 3,
    image: prodPickle,
    body: [
      "Look at the back of any Prajnaa jar and you'll see a code: something like RS-HUN-2604-A. It is small. It is not pretty. But it is the most important thing on the pack.",
      "The first two letters are the farmer's initials. The next three are their village. The four digits are the harvest week. The letter at the end is the batch number.",
      "Scan it and you'll meet the farmer, see the soil report from this season, the lab test for this batch, and the photograph of the family the day the harvest came in. That is what 'traceable' means at Prajnaa.",
    ],
  },
  {
    slug: "meet-asha-patel-anand-pickles",
    title: "Meet Asha Patel: the pickle maker of Anand",
    excerpt:
      "Three generations of pickle recipes, one steel kitchen in a small town in Gujarat, and one rule that has never broken.",
    category: "Farmer story",
    author: "Aanya Iyer",
    date: "2026-04-09",
    readMinutes: 5,
    image: farmer1,
    body: [
      "Asha Patel learned to make pickles from her grandmother. Her grandmother learned from her own. The kitchen has moved — from a wood stove to a gas stove to a small steel-clad commercial unit — but the rule has not.",
      "Cut, sun-dry, salt, and rest. No vinegar, no preservative, no shortcut.",
      "Today Asha makes thirteen kinds of pickle for Prajnaa, and every jar passes through her hands at least twice. 'If I would not feed it to my own children,' she says, 'I will not send it to yours.'",
    ],
  },
  {
    slug: "field-notes-monsoon-2026",
    title: "Field notes: what the monsoon told us in 2026",
    excerpt:
      "An early monsoon, a late retreat, and a strange story of mangoes. Notes from twelve states.",
    category: "Field notes",
    author: "Karan Mehra",
    date: "2026-03-30",
    readMinutes: 7,
    image: farmer2,
    body: [
      "The monsoon arrived on the Kerala coast on the 27th of May, three days early. By the second week of July it had reached Kashmir.",
      "What that meant for the people growing your food is a story of small adjustments. In Konkan, mangoes ripened sooner and softer; in Vidarbha, oranges struggled. In Himachal, the apple harvest was the best in nine years.",
      "We've started publishing seasonal field notes so you can see, in plain words, what's coming and why.",
    ],
  },
  {
    slug: "the-almond-of-kashmir",
    title: "The almond of Kashmir — and why it tastes different",
    excerpt:
      "Smaller, paler, and far sweeter than its American cousin. A short essay on a fruit you might not have met.",
    category: "Journal",
    author: "Meera Bhatt",
    date: "2026-03-12",
    readMinutes: 4,
    image: prodAlmonds,
    body: [
      "Most almonds in Indian kitchens are Californian. They are large, uniform, and cheap.",
      "The Kashmiri almond — Mamra, locally — is none of those things. It is smaller, often misshapen, sometimes with a faint blush of pink. It is also unmistakably sweeter, with a soft crunch closer to a pine nut than to a snack-pack almond.",
      "We work with three farming families in Pulwama who still grow it. The trees flower in March, in the cold, against the blue silhouette of Pir Panjal.",
    ],
  },
  {
    slug: "what-organic-really-means",
    title: "What 'organic' really means on a label",
    excerpt:
      "We unpack the four most common claims on Indian food packs and what each one is actually promising you.",
    category: "Journal",
    author: "Karan Mehra",
    date: "2026-02-26",
    readMinutes: 5,
    image: farmer3,
    body: [
      "The word 'organic' is everywhere — and almost no two packs mean the same thing.",
      "In India, four claims dominate: India Organic (NPOP), Jaivik Bharat (PGS-India), FSSAI Organic, and the catch-all 'naturally grown'.",
      "Only the first three are verifiable. The fourth is, at best, a feeling. Here's how to tell which is which the next time you shop.",
    ],
  },
  {
    slug: "the-quiet-economics-of-fair-trade",
    title: "The quiet economics of fair trade for a small farmer",
    excerpt:
      "Margins, middlemen, and the maths that decides whether a farmer's child stays in the village.",
    category: "Journal",
    author: "Aanya Iyer",
    date: "2026-02-04",
    readMinutes: 6,
    image: farmer4,
    body: [
      "A farmer in Uttarakhand sells a kilo of rajma to a local trader for around ₹85. The same kilo, by the time it reaches a metropolitan grocery shelf, is priced anywhere from ₹420 to ₹560.",
      "Most of that gap doesn't go to the farmer. It goes to a chain of middlemen, each taking a small but cumulative cut.",
      "Cutting that chain — and paying the farmer directly — is the single most important thing a marketplace like Prajnaa does.",
    ],
  },
];

export function postBySlug(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function _internalLink() {
  // satisfies linker — keeps Link import alive for callers
  return Link;
}
