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
  features: Array<{ title: string; description: string }>;
};

export const industries: Industry[] = [
  {
    slug: "cafes-and-bakeries",
    name: "Cafés & bakeries",
    shortName: "Café",
    eyebrow: "Built for the morning rush",
    headline: "Turn a familiar order into a reason to return.",
    description:
      "Keep the warmth of a neighborhood café while KYP Stamping quietly remembers visits, favorite orders, and the moment a reward is ready.",
    reward: "8 visits → a pastry on us",
    metric: "8 visits",
    metricLabel: "a typical stamp card, live in one afternoon",
    challenge:
      "Paper cards disappear. Names get forgotten during the rush. KYP Stamping keeps the relationship without slowing the counter.",
    features: [
      {
        title: "Fast counter scanning",
        description:
          "Confirm a stamp in about three seconds from any phone, tablet, or counter screen — and a welcome stamp is already waiting for anyone who joined from your poster.",
      },
      {
        title: "Favorite order memory",
        description:
          "Record a regular’s usual order and turn it into a thoughtful birthday offer.",
      },
      {
        title: "Quiet-hour campaigns",
        description:
          "Invite the right customers back when the afternoon counter goes quiet.",
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
      "Give clients a clear path back with visit rewards, timely reminders, and personal offers that never feel like a blast message.",
    reward: "5 visits → signature treatment",
    metric: "One tap",
    metricLabel: "rebooking prompt after every visit",
    challenge:
      "Great service creates loyalty, but busy clients still forget to rebook. KYP Stamping makes the next visit visible before they leave.",
    features: [
      {
        title: "Visit-based rewards",
        description:
          "Build rewards around services, appointments, or spend without adding a complex POS workflow.",
      },
      {
        title: "Rebooking reminders",
        description:
          "Reach clients when their usual return window is approaching.",
      },
      {
        title: "Consent built in",
        description:
          "Clients control marketing permissions from their own private profile.",
      },
    ],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    shortName: "Restaurant",
    eyebrow: "From first table to favorite table",
    headline: "Give good guests a better reason to choose you again.",
    description:
      "Reward visits across dine-in and takeaway, recognize returning guests, and bring slower service windows back to life.",
    reward: "6 visits → house favorite",
    metric: "No POS change",
    metricLabel: "runs beside the register you already use",
    challenge:
      "Guests have endless choices. KYP Stamping makes progress tangible and keeps your restaurant present between meals.",
    features: [
      {
        title: "One QR identity",
        description:
          "Guests use the same personal code across every participating location.",
      },
      {
        title: "Flexible reward rules",
        description:
          "Set visit thresholds, expiry rules, and redemption terms that suit service.",
      },
      {
        title: "Segmented invitations",
        description:
          "Reach new, regular, VIP, inactive, or reward-ready guests separately.",
      },
    ],
  },
  {
    slug: "retail",
    name: "Independent retail",
    shortName: "Retail",
    eyebrow: "A loyalty layer for local retail",
    headline: "Make every purchase part of an ongoing relationship.",
    description:
      "Give independent shops an uncomplicated loyalty program that customers understand immediately and staff can run confidently.",
    reward: "10 visits → member reward",
    metric: "Consent first",
    metricLabel: "customers choose what a shop can see",
    challenge:
      "Transactions are easy to count; relationships are harder. KYP Stamping connects the two without replacing the tools you already use.",
    features: [
      {
        title: "No POS replacement",
        description:
          "Start alongside your current checkout flow and integrate later when it makes sense.",
      },
      {
        title: "Staff permissions",
        description:
          "Let associates issue stamps while managers retain control of rewards and campaigns.",
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
      "High frequency, low ticket, a line that peaks at three in the afternoon. A stamp card is the natural fit, and a bonus window is how you move the line to the quiet hour.",
    reward: "6 cups \u2192 a free large",
    metric: "2\u00d7",
    metricLabel: "stamps in a slow-hour window, switched on in a minute",
    challenge:
      "The next milk tea shop is a hundred metres away and the menu is the same. What is not the same is who remembers a regular. KYP Stamping does, without slowing a line that is already long.",
    features: [
      {
        title: "Bonus windows",
        description:
          "Double stamps from 2 to 4, or all of December. A schedule and a multiplier — the customer sees it on their card before they queue.",
      },
      {
        title: "Missions for the menu",
        description:
          "\u201cTry three of the new flavours this month.\u201d A goal with a bonus at the end, and progress on the card.",
      },
      {
        title: "A card for every branch",
        description:
          "One card across the chain, with each branch reported on its own so you know which one the regulars actually visit.",
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
      "You already know your regulars by name. A stamp card that costs nothing, runs on the phone in your pocket and works with the customer’s own cheap Android is how that relationship survives a competitor opening on the corner.",
    reward: "10 visits \u2192 ₱50 off",
    metric: "₱0",
    metricLabel: "to start, forever, with every customer on the street",
    challenge:
      "Margins are thin and every peso of reward has to earn its place. A minimum spend per stamp and a cooldown you set keep the card honest, and the free plan means the program costs you nothing until it is working.",
    features: [
      {
        title: "Minimum spend per stamp",
        description:
          "\u201c₱100 for a stamp\u201d keeps a single sachet from earning the same as a full basket. Shown on the card, so no arguments.",
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
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

export const resources: ResourceArticle[] = [
  {
    slug: "design-a-reward-people-finish",
    category: "Loyalty playbook",
    title: "Design a reward people actually finish",
    summary:
      "Choose a visit target and reward value that feel attainable without giving away the margin you need.",
    readTime: "6 min read",
    intro:
      "The best loyalty program is not the most generous one. It is the one customers can understand at a glance and believe they will complete.",
    sections: [
      {
        heading: "Start with your natural rhythm",
        body: "Look at how often a happy regular already visits. A coffee shop might see someone twice a week; a salon may see them every six weeks. Set the reward just beyond the behavior you want to encourage, not beyond what feels possible.",
      },
      {
        heading: "Make the reward concrete",
        body: "“Member benefit” is vague. “A pastry on us” is visible and immediate. Customers should know what they are earning before they collect the first stamp.",
      },
      {
        heading: "Protect the experience",
        body: "Simple terms prevent awkward counter conversations. Decide whether stamps expire, whether a reward can be transferred, and how soon another stamp can be issued.",
      },
    ],
  },
  {
    slug: "bring-back-quiet-hour-customers",
    category: "Campaign guide",
    title: "Bring customers back during quiet hours",
    summary:
      "Use timing and relevance — not bigger discounts — to create demand when your floor has capacity.",
    readTime: "5 min read",
    intro:
      "A quiet-hour campaign works best when it feels like a useful invitation, not an emergency sale.",
    sections: [
      {
        heading: "Choose the right audience",
        body: "Start with customers who already know the business: recent first-timers, almost-regulars, or people one visit away from a reward. Relevance does more work than reach.",
      },
      {
        heading: "Name the window clearly",
        body: "Give people a specific reason to visit at a specific time. “Double stamp from 2–4 PM today” is easier to act on than “Come back soon.”",
      },
      {
        heading: "Measure the return visit",
        body: "Track visits during the campaign window and compare them with a normal day. Keep the message if it changes behavior; retire it if it only gives away margin.",
      },
    ],
  },
  {
    slug: "privacy-friendly-local-marketing",
    category: "Customer trust",
    title: "A practical guide to privacy-friendly loyalty",
    summary:
      "Collect only what helps the customer, explain why it matters, and make consent easy to change.",
    readTime: "7 min read",
    intro:
      "Customer trust is part of the reward. A loyalty program should make the relationship clearer, not create uncertainty about where personal information goes.",
    sections: [
      {
        heading: "Ask for less",
        body: "A name and secure loyalty identifier may be enough to begin. Request birthday, mobile number, or favorite order only when each field unlocks a clear customer benefit.",
      },
      {
        heading: "Separate service from marketing",
        body: "Reward progress updates are not the same as promotions. Let customers understand and control each type of communication independently.",
      },
      {
        heading: "Make leaving uncomplicated",
        body: "Customers should be able to leave a business program, withdraw marketing consent, and understand what happens to their data without contacting support.",
      },
    ],
  },
  {
    slug: "ber-months-playbook",
    category: "Seasonal campaigns",
    title: "The Ber-months playbook",
    summary:
      "September to December is a third of the year and half of many shops’ revenue. Plan the bonus windows, the missions and the gift rewards before the first parol goes up.",
    readTime: "7 min read",
    intro:
      "Christmas in the Philippines starts in September and ends in January. A loyalty program that treats it as one long season, with a plan, outperforms one that runs a promo on the 20th of December because everyone else did.",
    sections: [
      {
        heading: "September: fill the card before the rush",
        body: "Run a bonus window on your slowest days so regulars arrive in December one or two stamps from a reward. A customer who is close to a reward chooses you over the shop next door without being asked. Two-times stamps on Tuesdays and Wednesdays through September is enough.",
      },
      {
        heading: "October and November: missions, not discounts",
        body: "\u201cVisit four times in November\u201d costs you one bonus and buys three extra visits. A discount costs you margin on every visit including the ones you would have had anyway. Set one mission per month, name the bonus plainly, and put progress on the card where they can see it.",
      },
      {
        heading: "December: gifts, and the 13th month",
        body: "Turn the reward catalog toward gifting: a reward a member can send to another member is pasalubong they do not have to carry. The 13th-month pay lands mid-December; a gift card with a small bonus (\u201cload ₱500, get ₱550\u201d) is the one promotion that brings in money rather than giving it away. Then stop. January is for the win-back.",
      },
    ],
  },
  {
    slug: "what-suki-already-knows",
    category: "Loyalty playbook",
    title: "What the suki already knows",
    summary:
      "Filipino shops invented tiered loyalty a long time before software did. Here is how to turn a word everyone understands into levels a customer wants to climb.",
    readTime: "5 min read",
    intro:
      "A suki is not a customer with a card. A suki is a regular the shop knows by name, saves the good ones for, and rounds down for without being asked. The relationship already has tiers; the software just needs to make them visible.",
    sections: [
      {
        heading: "Name the levels the way you would say them",
        body: "Three is plenty. A new customer, a suki, and whatever the top level is in your shop — some owners like \u201csuper suki\u201d, some use the barangay, some use the owner’s name. The names matter more than the thresholds; people repeat them.",
      },
      {
        heading: "Make the benefit something a suki already got",
        body: "The top level should feel like recognition, not a coupon: first pick when a bonus window opens, a reserved reward the other levels cannot see, the earn rate rounded up. That is what the shop already did for its best customers by instinct. Now it happens on the card, at every branch, with every staff member.",
      },
      {
        heading: "Move people up fast and down gently",
        body: "Upgrade the moment someone crosses the line — the same visit, with a message. Downgrade only after a long quiet spell, and send the win-back before it happens: \u201cone more visit this month keeps your suki status\u201d is the most effective message a shop can send, because it is true and it is theirs to lose.",
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
  "Cafe or coffee shop",
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
      "No. KYP Stamping runs as a fast mobile web app and can be saved to the home screen like an installed app.",
  },
  {
    question: "Do we need to replace our POS?",
    answer:
      "No. Start with QR scanning beside your current checkout. POS integrations can be added later.",
  },
  {
    question: "Can my staff stamp their friends?",
    answer:
      "They can press the button — and every stamp carries their name, the time and the branch in a ledger you can read, with a one-tap reversal. A cooldown you set means the same customer cannot be stamped twice in a day. We do not pretend to prevent it; we make it visible, which is what actually stops it.",
  },
  {
    question: "Who owns the customer data?",
    answer:
      "The customer controls their personal profile and consent. Your business sees only the information they choose to share with your program, and you can export your whole member list in one click on any plan.",
  },
  {
    question: "Can I change my reward later?",
    answer:
      "Yes. Raise the target, change the reward, switch the welcome stamp off — cards already in progress finish on the terms they started with, and rewards already earned are always honored.",
  },
];
