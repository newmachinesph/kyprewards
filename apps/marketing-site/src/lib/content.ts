export type Industry = {
  slug: string;
  name: string;
  shortName: string;
  eyebrow: string;
  headline: string;
  description: string;
  reward: string;
  metric: string;
  metricLabel: string;
  challenge: string;
  features: Array<{
    title: string;
    description: string;
    /** Tier the lever arrives with. Omitted means the free plan. */
    tier?: "Core" | "Grow";
  }>;
};

export const industries: Industry[] = [
  {
    slug: "cafes-and-bakeries",
    name: "Cafés & bakeries",
    shortName: "Café",
    eyebrow: "Built for the morning rush",
    headline: "Turn the usual order into a reason to come back.",
    description:
      "Keep the feel of a neighborhood café while KYP Rewards keeps track of visits, favorite orders and the moment a reward is ready.",
    reward: "8 visits → a pastry on us",
    metric: "8 visits",
    metricLabel: "a typical stamp card, live in one afternoon",
    challenge:
      "Paper cards get lost and names slip during the rush. KYP Rewards remembers your regulars without slowing the counter down.",
    features: [
      {
        title: "Fast counter scanning",
        description:
          "Confirm a stamp in about three seconds from any phone, tablet or counter screen. Anyone who joined from your poster already has a welcome stamp waiting.",
      },
      {
        title: "Favorite order memory",
        description:
          "Note a regular’s usual order and turn it into a birthday offer they’ll actually want.",
        tier: "Core",
      },
      {
        title: "Quiet-hour campaigns",
        description:
          "Bring the right customers back when the afternoon counter goes quiet.",
        tier: "Core",
      },
    ],
  },
  {
    slug: "salons-and-wellness",
    name: "Salons & wellness",
    shortName: "Wellness",
    eyebrow: "Retention between appointments",
    headline: "Stay remembered after the appointment ends.",
    description:
      "Give clients a clear reason to book again with visit rewards, well-timed reminders and personal offers that never read like a mass text.",
    reward: "5 visits → signature treatment",
    metric: "5 visits",
    metricLabel: "a typical salon card, live in one afternoon",
    challenge:
      "Good service earns loyalty, but busy clients still forget to rebook. KYP Rewards puts the next visit in front of them before they leave.",
    features: [
      {
        title: "Visit-based rewards",
        description:
          "Reward services, appointments or spend without adding a complicated POS workflow.",
      },
      {
        title: "Rebooking reminders",
        description:
          "Reach clients as their usual time to come back gets close.",
        tier: "Grow",
      },
      {
        title: "Consent built in",
        description:
          "Clients decide which marketing they get from their own private profile.",
      },
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    shortName: "Restaurant",
    eyebrow: "First table, then favorite table",
    headline: "Give good guests a better reason to choose you again.",
    description:
      "Reward dine-in and takeaway visits, recognize guests who come back, and fill the slower hours between services.",
    reward: "6 visits → house favorite",
    metric: "No POS change",
    metricLabel: "runs beside the register you already use",
    challenge:
      "Guests have plenty of other places to eat. KYP Rewards shows them how close they are to a reward and keeps your restaurant on their mind between meals.",
    features: [
      {
        title: "One QR identity",
        description:
          "Guests use the same personal code across every participating location.",
      },
      {
        title: "Flexible reward rules",
        description:
          "Set visit targets, expiry rules and redemption terms that suit how you serve.",
      },
      {
        title: "Segmented invitations",
        description:
          "Reach new, regular, VIP, lapsed or reward-ready guests separately.",
        tier: "Core",
      },
    ],
  },
  {
    slug: "retail",
    name: "Independent retail",
    shortName: "Retail",
    eyebrow: "A loyalty layer for local retail",
    headline: "Make every purchase part of a longer relationship.",
    description:
      "A simple loyalty program for independent shops: customers get it at a glance, and staff can run it without second-guessing.",
    reward: "10 visits → member reward",
    metric: "Consent first",
    metricLabel: "customers choose what a shop can see",
    challenge:
      "Sales are easy to count; relationships aren’t. KYP Rewards ties the two together without replacing the tools you already use.",
    features: [
      {
        title: "No POS replacement",
        description:
          "Start next to your current checkout and integrate later, if and when it makes sense.",
      },
      {
        title: "Staff permissions",
        description:
          "Let floor staff give stamps while managers keep control of rewards and campaigns.",
        tier: "Core",
      },
      {
        title: "Network discovery",
        description:
          "Help nearby customers find your store and join before their first purchase.",
      },
    ],
  },
  {
    slug: "milk-tea-and-dessert",
    name: "Milk tea & dessert shops",
    shortName: "Milk tea",
    eyebrow: "Built for the afternoon line",
    headline: "Make the fourth cup the one they come back for.",
    description:
      "Customers come often, spend little, and the line peaks at three in the afternoon. A stamp card fits that naturally, and a bonus window is how you move part of the line to the quiet hour.",
    reward: "6 cups \u2192 a free large",
    metric: "2\u00d7",
    metricLabel: "stamps in a slow-hour window, switched on in a minute",
    challenge:
      "The next milk tea shop is a hundred metres away with the same menu. The difference is who remembers a regular, and KYP Rewards does that without slowing a line that’s already long.",
    features: [
      {
        title: "Bonus windows",
        description:
          "Double stamps from 2 to 4, or all of December. It’s a schedule and a multiplier, and the customer sees it on their card before they queue.",
        tier: "Core",
      },
      {
        title: "Missions for the menu",
        description:
          "\u201cTry three of the new flavours this month.\u201d A goal with a bonus at the end, with progress shown on the card.",
        tier: "Grow",
      },
      {
        title: "A card for every branch",
        description:
          "One card across the chain, with each branch reported on its own so you know which one the regulars actually visit.",
        tier: "Core",
      },
    ],
  },
  {
    slug: "sari-sari-and-convenience",
    name: "Sari-sari & convenience",
    shortName: "Sari-sari",
    eyebrow: "The store that already knows everyone",
    headline: "Give the suki a reason that beats the store next door.",
    description:
      "You already know your regulars by name. When a competitor opens on the corner, a stamp card that costs nothing, runs on the phone in your pocket and works on the customer’s own cheap Android is how you keep them.",
    reward: "10 visits \u2192 ₱50 off",
    metric: "₱0",
    metricLabel: "to start, forever, with every customer on the street",
    challenge:
      "Margins are thin, so every peso of reward has to earn its place. A minimum spend per stamp and a cooldown you set keep the card honest, and on the free plan the program costs you nothing until it’s working.",
    features: [
      {
        title: "Minimum spend per stamp",
        description:
          "\u201c₱100 for a stamp\u201d keeps a single sachet from earning the same as a full basket. It’s shown on the card, so nobody argues.",
      },
      {
        title: "Works on any phone, with patchy data",
        description:
          "The customer’s saved code works with no signal, and your side runs in the browser of the phone you already own.",
      },
      {
        title: "Free, with no catch",
        description:
          "Unlimited customers, unlimited stamps, a printable poster for the window. You pay nothing until you choose to.",
      },
    ],
  },
];

export type ResourceArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  /** ISO dates for Article markup and the sitemap. Bump `modified` when the text changes. */
  published: string;
  modified: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

export const resources: ResourceArticle[] = [
  {
    slug: "design-a-reward-people-finish",
    published: "2026-08-25",
    modified: "2026-10-12",
    category: "Loyalty playbook",
    title: "Design a reward people actually finish",
    summary:
      "Pick a visit target and a reward that feel within reach without giving away the margin you need.",
    readTime: "6 min read",
    intro:
      "The best loyalty program isn’t the most generous one. It’s the one customers understand at a glance and believe they’ll finish.",
    sections: [
      {
        heading: "Start with how often regulars already come",
        body: "Look at how often a happy regular already visits. A coffee shop might see someone twice a week, a salon every six weeks. Put the reward just past the behavior you want more of, not past what feels possible.",
      },
      {
        heading: "Make the reward concrete",
        body: "“Member benefit” is vague, while “a pastry on us” is something a customer can picture. People should know what they’re earning before they collect the first stamp.",
      },
      {
        heading: "Settle the rules early",
        body: "Simple terms save you awkward conversations at the counter. Decide whether stamps expire, whether a reward can be passed to someone else, and how soon the same customer can earn another stamp.",
      },
    ],
  },
  {
    slug: "bring-back-quiet-hour-customers",
    published: "2026-08-25",
    modified: "2026-10-12",
    category: "Campaign guide",
    title: "Bring customers back during quiet hours",
    summary:
      "Use timing and the right audience, not bigger discounts, to bring people in when you have room on the floor.",
    readTime: "5 min read",
    intro:
      "A quiet-hour campaign works best when it reads like a useful invitation and not a panic sale.",
    sections: [
      {
        heading: "Choose the right audience",
        body: "Start with people who already know the shop: recent first-timers, almost-regulars, or anyone one visit away from a reward. Sending to the right few beats sending to everyone.",
      },
      {
        heading: "Name the window clearly",
        body: "Give people a specific reason to visit at a specific time. “Double stamps from 2 to 4 PM today” is easier to act on than “Come back soon.”",
      },
      {
        heading: "Measure the return visit",
        body: "Count visits during the campaign window and compare them with a normal day. Keep the message if it changes what people do; drop it if all it does is give away margin.",
      },
    ],
  },
  {
    slug: "privacy-friendly-local-marketing",
    published: "2026-08-25",
    modified: "2026-10-12",
    category: "Customer trust",
    title: "A practical guide to privacy-friendly loyalty",
    summary:
      "Collect only what helps the customer, say why you’re asking, and make consent easy to change.",
    readTime: "7 min read",
    intro:
      "Trust is part of the reward. A loyalty program should make the relationship clearer, and it shouldn’t leave anyone wondering where their personal information goes.",
    sections: [
      {
        heading: "Ask for less",
        body: "A name and a secure loyalty ID may be enough to start. Ask for a birthday, mobile number or favorite order only when that field gets the customer something clear in return.",
      },
      {
        heading: "Separate service from marketing",
        body: "An update on reward progress isn’t a promotion. Let customers see and control each kind of message on its own.",
      },
      {
        heading: "Make leaving easy",
        body: "Customers should be able to leave a shop’s program, withdraw marketing consent and see what happens to their data, all without contacting support.",
      },
    ],
  },
  {
    slug: "ber-months-playbook",
    published: "2026-08-25",
    modified: "2026-10-12",
    category: "Seasonal campaigns",
    title: "The Ber-months playbook",
    summary:
      "September to December is a third of the year and, for many shops, half the revenue. Plan the bonus windows, missions and gift rewards before the parol goes up.",
    readTime: "7 min read",
    intro:
      "Christmas in the Philippines starts in September and ends in January. A loyalty program that treats it as one long season, with a plan, beats one that runs a promo on December 20 because everyone else did.",
    sections: [
      {
        heading: "September: fill the card before the rush",
        body: "Run a bonus window on your slowest days so regulars reach December one or two stamps from a reward. Someone that close to a reward picks you over the shop next door without being asked. Double stamps on Tuesdays and Wednesdays through September is enough.",
      },
      {
        heading: "October and November: missions, not discounts",
        body: "\u201cVisit four times in November\u201d costs you one bonus and buys three extra visits. A discount costs you margin on every visit, including the ones you’d have had anyway. Set one mission a month, name the bonus plainly, and put the progress on the card where customers can see it.",
      },
      {
        heading: "December: gifts, and the 13th month",
        body: "Turn the reward catalog toward gifting: a reward a member can send to another member is pasalubong they don’t have to carry. 13th-month pay lands in mid-December, and a gift card with a small bonus (\u201cload ₱500, get ₱550\u201d) is the one promotion that brings money in instead of giving it away. Then stop; January is for the win-back.",
      },
    ],
  },
  {
    slug: "what-suki-already-knows",
    published: "2026-08-25",
    modified: "2026-10-12",
    category: "Loyalty playbook",
    title: "What the suki already knows",
    summary:
      "Filipino shops worked out tiered loyalty long before software did. Here’s how to turn a word everyone already uses into levels customers want to climb.",
    readTime: "5 min read",
    intro:
      "A suki isn’t a customer with a card. A suki is a regular the shop knows by name, saves the good ones for, and rounds down for without being asked. The relationship already has tiers, and the software only has to make them visible.",
    sections: [
      {
        heading: "Name the levels the way you would say them",
        body: "Three is plenty: a new customer, a suki, and whatever the top level is called in your shop. Some owners like \u201csuper suki\u201d, some use the barangay, some use the owner’s name. The names matter more than the thresholds, because people repeat them.",
      },
      {
        heading: "Make the benefit something a suki already got",
        body: "The top level should feel like recognition, not a coupon: first pick when a bonus window opens, a reserved reward the other levels can’t see, the earn rate rounded up. Shops already did this for their best customers by instinct. Now it happens on the card, at every branch, whoever is on shift.",
      },
      {
        heading: "Move people up fast and down gently",
        body: "Upgrade the moment someone crosses the line, on that same visit, with a message. Downgrade only after a long quiet spell, and send the win-back before it happens. \u201cOne more visit this month keeps your suki status\u201d is the most effective message a shop can send, because it’s true and it’s theirs to lose.",
      },
    ],
  },
];

/**
 * The kinds of shop we ask about, in the order a Filipino owner would scan
 * them. Shared by the partner application and the contact form so the two
 * can never drift apart again, and phrased the way the owner would say it —
 * "sari-sari", "carinderia", "barbershop" — not the way a category taxonomy
 * would.
 */
export const businessCategories = [
  "Café or coffee shop",
  "Milk tea or dessert shop",
  "Bakery",
  "Restaurant or carinderia",
  "Sari-sari or convenience store",
  "Independent retail",
  "Salon or barbershop",
  "Spa or wellness",
  "Laundry",
  "Pet services",
  "Fitness studio",
  "Other",
] as const;

export const faqs = [
  {
    question: "Do customers need to download an app?",
    answer:
      "No. KYP Rewards runs as a fast mobile web app, and customers can save it to their home screen like an installed app.",
  },
  {
    question: "Do we need to replace our POS?",
    answer:
      "No. Start with QR scanning next to your current checkout and add a POS integration later if you want one.",
  },
  {
    question: "Can my staff stamp their friends?",
    answer:
      "They can press the button, but every stamp carries their name, the time and the branch in a ledger you can read, and any stamp can be reversed in one tap. A cooldown you set (once a day by default) stops the same customer being stamped twice inside it. We don’t pretend to prevent it; we make it visible, which is what actually stops it.",
  },
  {
    question: "Who owns the customer data?",
    answer:
      "The customer controls their personal profile and consent. Your business sees only what they choose to share with your program, and you can export your whole member list in one click on any plan.",
  },
  {
    question: "Can I change my reward later?",
    answer:
      "Yes. You can raise the target, change the reward or switch the welcome stamp off, and cards already in progress finish on the terms they started with. Rewards already earned are always honored.",
  },
];
